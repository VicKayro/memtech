'use client';

/**
 * Client-side document parsing.
 * Extracts text from PDF/DOCX/TXT in the browser so we only
 * send small JSON payloads to the API (avoids Vercel 4.5 MB limit).
 */

const MAX_PDF_PAGES = 40; // Only parse first 40 pages (plenty for DCE docs)
const PARSE_TIMEOUT_MS = 45_000; // 45 second timeout per file

export async function parseFileClientSide(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  onProgress?.(`Lecture de ${file.name} (${sizeMB} MB)...`);

  const parsePromise = (async () => {
    switch (ext) {
      case 'pdf':
        return parsePDFClient(file, onProgress);
      case 'docx':
      case 'doc':
        return parseDOCXClient(file);
      case 'txt':
        return file.text();
      default:
        throw new Error(`Format non supporté : .${ext}. Formats acceptés : PDF, DOCX, TXT`);
    }
  })();

  // Race against timeout
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout : le fichier ${file.name} est trop volumineux pour être parsé dans le navigateur (${sizeMB} MB). Essayez un fichier plus petit ou convertissez-le en TXT.`)), PARSE_TIMEOUT_MS)
  );

  return Promise.race([parsePromise, timeoutPromise]);
}

async function parsePDFClient(
  file: File,
  onProgress?: (msg: string) => void
): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Use local worker from public/ to avoid CDN/CORS issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const totalPages = pdf.numPages;
  const pagesToParse = Math.min(totalPages, MAX_PDF_PAGES);

  if (totalPages > MAX_PDF_PAGES) {
    onProgress?.(`${file.name} : ${totalPages} pages, extraction des ${MAX_PDF_PAGES} premières...`);
  }

  const pages: string[] = [];
  for (let i = 1; i <= pagesToParse; i++) {
    if (i % 5 === 0 || i === 1) {
      onProgress?.(`${file.name} : page ${i}/${pagesToParse}...`);
    }
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }

  let result = cleanText(pages.join('\n'));

  if (totalPages > MAX_PDF_PAGES) {
    result += `\n\n[NOTE : Document de ${totalPages} pages — seules les ${MAX_PDF_PAGES} premières pages ont été extraites]`;
  }

  return result;
}

async function parseDOCXClient(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return cleanText(result.value);
}

function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
