'use client';

/**
 * Client-side document parsing.
 * Extracts text from PDF/DOCX/TXT in the browser so we only
 * send small JSON payloads to the API (avoids Vercel 4.5 MB limit).
 */

export async function parseFileClientSide(file: File): Promise<string> {
  const ext = file.name.toLowerCase().split('.').pop();

  switch (ext) {
    case 'pdf':
      return parsePDFClient(file);
    case 'docx':
    case 'doc':
      return parseDOCXClient(file);
    case 'txt':
      return file.text();
    default:
      throw new Error(`Format non supporté : .${ext}. Formats acceptés : PDF, DOCX, TXT`);
  }
}

async function parsePDFClient(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Load worker from CDN to avoid webpack issues
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const text = textContent.items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    pages.push(text);
  }

  return cleanText(pages.join('\n'));
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
