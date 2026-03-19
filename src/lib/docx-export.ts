import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  Header,
  Footer,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
  PageBreak,
  convertInchesToTwip,
} from 'docx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExportSection {
  title: string;
  content: string;
}

interface ExportData {
  projectName: string;
  marketObject?: string;
  marketType?: string;
  sections: ExportSection[];
}

// ---------------------------------------------------------------------------
// Inline parsing: **bold**, [À COMPLÉTER]
// ---------------------------------------------------------------------------

function parseInline(text: string, baseSize = 22): TextRun[] {
  const runs: TextRun[] = [];
  const regex = /(\*\*(.+?)\*\*|\[À COMPLÉTER[^\]]*\])/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push(new TextRun({ text: text.slice(lastIndex, match.index), size: baseSize }));
    }
    if (match[2]) {
      runs.push(new TextRun({ text: match[2], bold: true, size: baseSize }));
    } else {
      runs.push(
        new TextRun({
          text: match[0],
          bold: true,
          size: baseSize,
          highlight: 'yellow',
        })
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.slice(lastIndex), size: baseSize }));
  }
  if (runs.length === 0 && text) {
    runs.push(new TextRun({ text, size: baseSize }));
  }
  return runs;
}

// ---------------------------------------------------------------------------
// Markdown table → docx Table
// ---------------------------------------------------------------------------

function parseTableBlock(lines: string[]): Table {
  const parseLine = (line: string) =>
    line
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c && !/^[-:]+$/.test(c));

  const headerCells = parseLine(lines[0]);
  const dataLines = lines.slice(2); // skip separator

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: 'CCCCCC',
  };
  const borders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headerCells.map(
      (cell) =>
        new TableCell({
          borders,
          shading: { type: ShadingType.SOLID, color: 'E8EBF0' },
          children: [
            new Paragraph({
              children: [new TextRun({ text: cell, bold: true, size: 18, font: 'Calibri' })],
              spacing: { before: 40, after: 40 },
            }),
          ],
        })
    ),
  });

  const bodyRows = dataLines
    .filter((l) => l.includes('|') && !/^\s*\|?\s*[-:]+/.test(l))
    .map(
      (line) =>
        new TableRow({
          children: parseLine(line).map(
            (cell) =>
              new TableCell({
                borders,
                children: [
                  new Paragraph({
                    children: parseInline(cell, 18),
                    spacing: { before: 30, after: 30 },
                  }),
                ],
              })
          ),
        })
    );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

// ---------------------------------------------------------------------------
// Markdown → docx elements
// ---------------------------------------------------------------------------

function markdownToDocxElements(markdown: string): (Paragraph | Table)[] {
  const lines = markdown.split('\n');
  const elements: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal rule → skip (we use page breaks between sections)
    if (/^[-*_]{3,}$/.test(trimmed)) {
      i++;
      continue;
    }

    // Heading ##
    if (trimmed.startsWith('## ')) {
      elements.push(
        new Paragraph({
          children: parseInline(trimmed.slice(3), 26),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
        })
      );
      i++;
      continue;
    }

    // Heading ###
    if (trimmed.startsWith('### ')) {
      elements.push(
        new Paragraph({
          children: parseInline(trimmed.slice(4), 24),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 240, after: 100 },
        })
      );
      i++;
      continue;
    }

    // Table block
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*[-:|]+/.test(lines[i + 1]?.trim())) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        elements.push(parseTableBlock(tableLines));
        elements.push(new Paragraph({ children: [], spacing: { after: 100 } }));
      }
      continue;
    }

    // Numbered list (1. 2. etc.)
    if (/^\d+\.\s/.test(trimmed)) {
      const text = trimmed.replace(/^\d+\.\s/, '');
      elements.push(
        new Paragraph({
          children: parseInline(text),
          numbering: { reference: 'numbered-list', level: 0 },
          spacing: { before: 40, after: 40 },
        })
      );
      i++;
      continue;
    }

    // Bullet list (- or *)
    if (/^[-*]\s/.test(trimmed)) {
      const text = trimmed.replace(/^[-*]\s/, '');
      // Check indent level
      const indent = line.search(/\S/);
      const level = indent >= 4 ? 1 : 0;
      elements.push(
        new Paragraph({
          children: parseInline(text),
          bullet: { level },
          spacing: { before: 30, after: 30 },
        })
      );
      i++;
      continue;
    }

    // Regular paragraph
    elements.push(
      new Paragraph({
        children: parseInline(trimmed),
        spacing: { before: 80, after: 80 },
        alignment: AlignmentType.JUSTIFIED,
      })
    );
    i++;
  }

  return elements;
}

// ---------------------------------------------------------------------------
// Build full DOCX document
// ---------------------------------------------------------------------------

export async function generateDocx(data: ExportData): Promise<Blob> {
  const date = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Cover page children
  const coverChildren: Paragraph[] = [
    new Paragraph({ spacing: { before: 2000 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'MÉMOIRE TECHNIQUE',
          bold: true,
          size: 52,
          color: '1E3A5F',
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
          color: '1E3A5F',
          size: 20,
        }),
      ],
    }),
  ];

  // Info table on cover
  const coverFields = [
    ['Objet du marché', data.projectName],
    ...(data.marketObject ? [['Description', data.marketObject]] : []),
    ...(data.marketType ? [['Type de marché', data.marketType]] : []),
    ['Maître d\'ouvrage', '[À COMPLÉTER]'],
    ['Lot', '[À COMPLÉTER]'],
    ['Entreprise candidate', '[À COMPLÉTER]'],
    ['Date', date],
  ];

  const borderNone = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const coverTable = new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    rows: coverFields.map(
      ([label, value]) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 35, type: WidthType.PERCENTAGE },
              borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: label, bold: true, size: 22, color: '1E3A5F' })],
                  alignment: AlignmentType.RIGHT,
                  spacing: { before: 60, after: 60 },
                }),
              ],
            }),
            new TableCell({
              borders: { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone },
              children: [
                new Paragraph({
                  children: value.includes('À COMPLÉTER')
                    ? [new TextRun({ text: value, size: 22, highlight: 'yellow', bold: true })]
                    : [new TextRun({ text: value, size: 22 })],
                  spacing: { before: 60, after: 60 },
                }),
              ],
            }),
          ],
        })
    ),
    alignment: AlignmentType.CENTER,
  });

  coverChildren.push(
    new Paragraph({ spacing: { before: 400 }, children: [] }),
    // @ts-expect-error docx types accept Table in certain contexts
    coverTable,
    new Paragraph({ spacing: { before: 800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Document confidentiel',
          italics: true,
          size: 20,
          color: '888888',
        }),
      ],
    })
  );

  // Table of contents section
  const tocChildren: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({ text: 'SOMMAIRE', bold: true, size: 36, color: '1E3A5F' }),
      ],
      spacing: { after: 400 },
    }),
  ];

  data.sections.forEach((section, idx) => {
    tocChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${idx + 1}.  `, bold: true, size: 24, color: '1E3A5F' }),
          new TextRun({ text: section.title, size: 24 }),
        ],
        spacing: { before: 80, after: 80 },
        indent: { left: convertInchesToTwip(0.3) },
      })
    );
  });

  tocChildren.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${data.sections.length + 1}.  `, bold: true, size: 24, color: '1E3A5F' }),
        new TextRun({ text: 'ANNEXES', size: 24 }),
      ],
      spacing: { before: 80, after: 80 },
      indent: { left: convertInchesToTwip(0.3) },
    })
  );

  // Content sections
  const contentSections = data.sections.map((section, idx) => {
    const sectionElements: (Paragraph | Table)[] = [
      // Section title as H1
      new Paragraph({
        children: [
          new TextRun({
            text: `${idx + 1}. ${section.title}`,
            bold: true,
            size: 32,
            color: '1E3A5F',
            font: 'Calibri',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 200, after: 200 },
      }),
    ];

    if (section.content) {
      sectionElements.push(...markdownToDocxElements(section.content));
    } else {
      sectionElements.push(
        new Paragraph({
          children: [new TextRun({ text: '[Section non générée]', italics: true, color: '999999' })],
        })
      );
    }

    return {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(0.8),
            left: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: `Mémoire technique — ${data.projectName}`,
                  italics: true,
                  size: 16,
                  color: '999999',
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: '[ENTREPRISE]',
                  size: 16,
                  color: '999999',
                }),
                new TextRun({ text: '  |  ', size: 16, color: 'CCCCCC' }),
                new TextRun({
                  text: `${idx + 1}. ${section.title}`,
                  italics: true,
                  size: 16,
                  color: '999999',
                }),
              ],
            }),
          ],
        }),
      },
      children: sectionElements,
    };
  });

  // Annexes section
  const annexesSection = {
    properties: {
      page: {
        margin: {
          top: convertInchesToTwip(1),
          bottom: convertInchesToTwip(0.8),
          left: convertInchesToTwip(1),
          right: convertInchesToTwip(1),
        },
      },
    },
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `${data.sections.length + 1}. ANNEXES`,
            bold: true,
            size: 32,
            color: '1E3A5F',
          }),
        ],
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 300 },
      }),
      ...[
        'Attestations de bonne exécution',
        'Qualifications et certifications',
        'Attestations d\'assurance (RC professionnelle et décennale)',
        'CV des intervenants clés',
        'Planning détaillé',
        'Plan d\'installation de chantier (PIC)',
        'Fiches techniques matériaux et produits',
        'PPSPS (Plan Particulier de Sécurité)',
      ].map(
        (item) =>
          new Paragraph({
            children: [new TextRun({ text: item, size: 22 })],
            bullet: { level: 0 },
            spacing: { before: 40, after: 40 },
          })
      ),
      new Paragraph({ spacing: { before: 400 }, children: [] }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Document généré le ${date} — à compléter et personnaliser avant soumission.`,
            italics: true,
            size: 18,
            color: '999999',
          }),
        ],
      }),
    ],
  };

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal' as const,
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
        heading1: {
          run: { font: 'Calibri', size: 32, bold: true, color: '1E3A5F' },
          paragraph: { spacing: { before: 200, after: 200 } },
        },
        heading2: {
          run: { font: 'Calibri', size: 26, bold: true, color: '2C5282' },
          paragraph: { spacing: { before: 300, after: 120 } },
        },
        heading3: {
          run: { font: 'Calibri', size: 24, bold: true, color: '3B6BA5' },
          paragraph: { spacing: { before: 240, after: 100 } },
        },
      },
    },
    sections: [
      // Cover page
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1.5),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
          },
        },
        children: [
          ...coverChildren,
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Table of contents
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          ...tocChildren,
          new Paragraph({ children: [new PageBreak()] }),
        ],
      },
      // Content sections
      ...contentSections,
      // Annexes
      annexesSection,
    ],
  });

  return Packer.toBlob(doc);
}
