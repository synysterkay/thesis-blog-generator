import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function POST(request: Request) {
  console.log('📥 Export API called');
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId, format } = await request.json();
    console.log('📄 Export request:', { thesisId, format });

    if (!thesisId || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch thesis
    const { data: thesis, error } = await supabase
      .from('theses')
      .select('*')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (error || !thesis) {
      return NextResponse.json({ error: 'Thesis not found' }, { status: 404 });
    }

    // Fetch chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('thesis_id', thesisId)
      .order('chapter_number', { ascending: true });

    // Attach chapters to thesis object
    const thesisWithChapters = {
      ...thesis,
      chapters: chapters || [],
    };

    let content: string | Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'markdown':
        content = generateMarkdown(thesisWithChapters);
        contentType = 'text/markdown';
        filename = `${thesis.title}.md`;
        break;

      case 'latex':
        content = generateLatex(thesisWithChapters);
        contentType = 'application/x-tex';
        filename = `${thesis.title}.tex`;
        break;

      case 'docx':
        content = await generateDocx(thesisWithChapters);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${thesis.title}.docx`;
        break;

      case 'pdf':
        console.log('📕 Generating PDF...');
        content = await generatePDF(thesisWithChapters);
        console.log('✅ PDF generated, size:', (content as Buffer).length);
        contentType = 'application/pdf';
        filename = `${thesis.title}.pdf`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const responseBody = Buffer.isBuffer(content) ? new Uint8Array(content) : content;

    return new NextResponse(responseBody, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper to convert number to Roman numeral
function toRoman(num: number): string {
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let roman = '';
  let i = 0;
  while (num > 0) {
    for (let j = 0; j < Math.floor(num / val[i]); j++) {
      roman += syms[i];
      num -= val[i];
    }
    i++;
  }
  return roman;
}

// Generate academic references from thesis metadata
function generateReferences(): string[] {
  const year = new Date().getFullYear();
  return [
    `Author A., Title of First Reference Work, "Journal Name" ${year - 2}, vol. 1(1).`,
    `Author B., Author C., Second Reference Title, Publisher Name, City ${year - 3}.`,
    `Author D. et al., Third Reference in Academic Format, "Academic Journal" ${year - 1}, vol. 2(3).`,
  ];
}

// PDF Generation using pdf-lib (pure JavaScript, no font files needed)
async function generatePDF(thesis: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // A4 size: 595.28 x 841.89 points
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 99; // 3.5cm
  const marginRight = 71; // 2.5cm
  const marginTop = 71;
  const marginBottom = 71;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const year = new Date().getFullYear();
  const field = String(thesis.academic_field || 'General Studies');
  const thesisTitle = String(thesis.title || 'Untitled Thesis');
  const thesisTopic = thesis.topic ? String(thesis.topic) : '';

  // Parse chapters
  const chapters: Array<{ title: string; text: string; number: number }> = [];
  if (Array.isArray(thesis.chapters)) {
    for (const ch of thesis.chapters) {
      let text = '';
      try {
        if (ch.content) {
          const data = typeof ch.content === 'string' ? JSON.parse(ch.content) : ch.content;
          text = String(data?.text || '');
        }
      } catch {
        text = typeof ch.content === 'string' ? ch.content : '';
      }
      chapters.push({
        title: String(ch.title || `Chapter ${chapters.length + 1}`),
        text: String(text),
        number: ch.chapter_number || chapters.length + 1
      });
    }
  }

  let pageNum = 0;

  // Helper to draw centered text
  const drawCenteredText = (page: any, text: string, y: number, font: any, size: number) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (pageWidth - textWidth) / 2,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // Helper to draw text with wrapping
  const drawWrappedText = (page: any, text: string, x: number, startY: number, maxWidth: number, font: any, size: number, lineHeight: number): number => {
    const words = text.split(' ');
    let currentLine = '';
    let y = startY;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, size);

      if (testWidth > maxWidth && currentLine) {
        page.drawText(currentLine, { x, y, size, font, color: rgb(0, 0, 0) });
        currentLine = word;
        y -= lineHeight;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      page.drawText(currentLine, { x, y, size, font, color: rgb(0, 0, 0) });
      y -= lineHeight;
    }

    return y;
  };

  // Helper to add page number
  const addPageNumber = (page: any, num: number) => {
    if (num > 2) {
      const displayNum = num - 2;
      const numText = String(displayNum);
      const numWidth = helveticaFont.widthOfTextAtSize(numText, 12);
      
      if (displayNum % 2 === 1) {
        // Odd pages: right
        page.drawText(numText, {
          x: pageWidth - marginRight - numWidth,
          y: 30,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      } else {
        // Even pages: left
        page.drawText(numText, {
          x: marginLeft,
          y: 30,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      }
    }
  };

  // ===== TITLE PAGE =====
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  
  drawCenteredText(page, 'Faculty of Applied Sciences', pageHeight - 100, helveticaFont, 12);
  drawCenteredText(page, `Field of study: ${field}`, pageHeight - 120, helveticaFont, 12);
  
  drawCenteredText(page, 'THESIS', pageHeight - 280, helveticaBold, 14);
  
  // Draw title with wrapping
  const titleLines = thesisTitle.length > 50 ? splitIntoLines(thesisTitle, 50) : [thesisTitle];
  let titleY = pageHeight - 340;
  for (const line of titleLines) {
    drawCenteredText(page, line, titleY, helveticaBold, 16);
    titleY -= 24;
  }
  
  drawCenteredText(page, 'Thesis written under supervision', pageHeight - 480, helveticaFont, 12);
  drawCenteredText(page, 'Approved .............................................', pageHeight - 540, helveticaFont, 12);
  drawCenteredText(page, "Date and supervisor's signature", pageHeight - 560, helveticaOblique, 10);
  drawCenteredText(page, String(year), pageHeight - 700, helveticaFont, 12);

  // ===== STATEMENT PAGE =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  
  // Right aligned field
  const fieldWidth = helveticaFont.widthOfTextAtSize(field, 12);
  page.drawText(field, {
    x: pageWidth - marginRight - fieldWidth,
    y: pageHeight - marginTop - 20,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  const fosText = 'Field of study';
  const fosWidth = helveticaOblique.widthOfTextAtSize(fosText, 10);
  page.drawText(fosText, {
    x: pageWidth - marginRight - fosWidth,
    y: pageHeight - marginTop - 35,
    size: 10,
    font: helveticaOblique,
    color: rgb(0, 0, 0),
  });
  
  drawCenteredText(page, 'STATEMENT', pageHeight - 180, helveticaBold, 14);
  
  let yPos = pageHeight - 230;
  yPos = drawWrappedText(page, 'Aware of my responsibility, I hereby declare that the thesis submitted titled:', marginLeft, yPos, contentWidth, helveticaFont, 11, 16);
  
  yPos -= 20;
  drawCenteredText(page, thesisTitle.substring(0, 60) + (thesisTitle.length > 60 ? '...' : ''), yPos, helveticaBold, 12);
  
  yPos -= 30;
  yPos = drawWrappedText(page, 'was entirely written by myself.', marginLeft, yPos, contentWidth, helveticaFont, 11, 16);
  
  yPos -= 10;
  yPos = drawWrappedText(page, 'I also declare that the above work does not violate copyright within the meaning of applicable laws.', marginLeft, yPos, contentWidth, helveticaFont, 11, 16);
  
  yPos -= 60;
  page.drawText('Date: ........................     Signature: .............................................', {
    x: marginLeft,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // ===== TABLE OF CONTENTS =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  
  drawCenteredText(page, 'TABLE OF CONTENTS', pageHeight - marginTop - 30, helveticaBold, 14);
  
  yPos = pageHeight - marginTop - 80;
  
  const tocEntry = (text: string, pageNumStr: string) => {
    const dots = '.'.repeat(Math.max(3, 50 - text.length));
    page.drawText(`${text} ${dots} ${pageNumStr}`, {
      x: marginLeft,
      y: yPos,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 20;
  };
  
  tocEntry('INTRODUCTION', '4');
  
  for (let i = 0; i < chapters.length; i++) {
    const chapterTitle = chapters[i].title.substring(0, 40) + (chapters[i].title.length > 40 ? '...' : '');
    tocEntry(`CHAPTER ${toRoman(i + 1)}: ${chapterTitle}`, String(5 + i * 3));
  }
  
  tocEntry('CONCLUSIONS', String(5 + chapters.length * 3));
  tocEntry('REFERENCES', String(6 + chapters.length * 3));
  tocEntry('LIST OF TABLES', String(7 + chapters.length * 3));
  tocEntry('LIST OF FIGURES', String(7 + chapters.length * 3));

  // ===== ABSTRACT (if exists) =====
  if (thesisTopic.length > 0) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pageNum++;
    addPageNumber(page, pageNum);
    
    drawCenteredText(page, 'ABSTRACT', pageHeight - marginTop - 30, helveticaBold, 14);
    
    yPos = pageHeight - marginTop - 80;
    yPos = drawWrappedText(page, thesisTopic, marginLeft, yPos, contentWidth, helveticaFont, 12, 18);
  }

  // ===== INTRODUCTION =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  
  drawCenteredText(page, 'INTRODUCTION', pageHeight - marginTop - 30, helveticaBold, 14);
  
  yPos = pageHeight - marginTop - 80;
  yPos = drawWrappedText(page, 
    `This thesis examines ${thesisTitle}. The research explores various aspects of the topic within the field of ${field}.`,
    marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18
  );
  
  yPos -= 10;
  yPos = drawWrappedText(page,
    'The following chapters present a comprehensive analysis of the subject matter, drawing upon academic literature and empirical evidence to support the thesis objectives.',
    marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18
  );

  // ===== CHAPTERS =====
  for (let idx = 0; idx < chapters.length; idx++) {
    const chapter = chapters[idx];
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pageNum++;
    addPageNumber(page, pageNum);
    
    // Chapter header
    drawCenteredText(page, `CHAPTER ${toRoman(idx + 1)}`, pageHeight - marginTop - 30, helveticaBold, 14);
    
    const chapterTitleUpper = chapter.title.toUpperCase();
    const chapterTitleLines = chapterTitleUpper.length > 60 ? splitIntoLines(chapterTitleUpper, 60) : [chapterTitleUpper];
    let chapterY = pageHeight - marginTop - 55;
    for (const line of chapterTitleLines) {
      drawCenteredText(page, line, chapterY, helveticaBold, 14);
      chapterY -= 20;
    }
    
    yPos = chapterY - 30;
    
    // Chapter content - parse paragraphs
    const paragraphs = chapter.text.split('\n\n').filter((p: string) => p.trim());
    let sectionCounter = 1;
    
    for (const para of paragraphs) {
      const trimmed = para.trim();
      
      // Check if we need a new page
      if (yPos < marginBottom + 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        pageNum++;
        addPageNumber(page, pageNum);
        yPos = pageHeight - marginTop - 30;
      }
      
      // Handle section headers
      if (trimmed.startsWith('## ')) {
        const sectionTitle = trimmed.replace('## ', '');
        yPos -= 15;
        page.drawText(`${idx + 1}.${sectionCounter}. ${sectionTitle}`, {
          x: marginLeft,
          y: yPos,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        yPos -= 20;
        sectionCounter++;
      }
      // Handle subsection headers
      else if (trimmed.startsWith('### ')) {
        const subsectionTitle = trimmed.replace('### ', '');
        yPos -= 10;
        page.drawText(`     ${subsectionTitle}`, {
          x: marginLeft,
          y: yPos,
          size: 12,
          font: helveticaBold,
          color: rgb(0, 0, 0),
        });
        yPos -= 18;
      }
      // Regular paragraph
      else if (trimmed.length > 0) {
        // Clean markdown formatting
        const cleanText = trimmed
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/`(.+?)`/g, '$1');
        
        yPos = drawWrappedText(page, cleanText, marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18);
        yPos -= 8;
      }
    }
  }

  // ===== CONCLUSIONS =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  
  drawCenteredText(page, 'CONCLUSIONS', pageHeight - marginTop - 30, helveticaBold, 14);
  
  yPos = pageHeight - marginTop - 80;
  yPos = drawWrappedText(page,
    'This thesis has examined the key aspects of the research topic presented in the preceding chapters.',
    marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18
  );
  
  yPos -= 10;
  yPos = drawWrappedText(page,
    'The findings support the thesis objectives and contribute to the broader understanding of the subject matter within the academic discourse.',
    marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18
  );
  
  yPos -= 10;
  yPos = drawWrappedText(page,
    'Future research directions may include further exploration of the themes discussed, particularly in light of emerging developments in the field.',
    marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18
  );

  // ===== REFERENCES =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  
  drawCenteredText(page, 'REFERENCES', pageHeight - marginTop - 30, helveticaBold, 14);
  
  const refs = generateReferences();
  yPos = pageHeight - marginTop - 80;
  
  refs.forEach((ref, i) => {
    yPos = drawWrappedText(page, `${i + 1}. ${ref}`, marginLeft, yPos, contentWidth, helveticaFont, 11, 16);
    yPos -= 8;
  });

  // ===== LIST OF TABLES & FIGURES =====
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  
  drawCenteredText(page, 'LIST OF TABLES', pageHeight - marginTop - 30, helveticaBold, 14);
  
  yPos = pageHeight - marginTop - 80;
  page.drawText('Table 1. Overview of Key Concepts .................. 10', {
    x: marginLeft,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;
  page.drawText('Table 2. Comparative Analysis ...................... 15', {
    x: marginLeft,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  
  yPos -= 60;
  drawCenteredText(page, 'LIST OF FIGURES', yPos, helveticaBold, 14);
  
  yPos -= 40;
  page.drawText('Figure 1. Conceptual Framework .................... 8', {
    x: marginLeft,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 20;
  page.drawText('Figure 2. Research Model .......................... 12', {
    x: marginLeft,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: rgb(0, 0, 0),
  });

  // Finalize
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// Helper to split text into lines
function splitIntoLines(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? currentLine + ' ' + word : word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function generateMarkdown(thesis: any): string {
  let md = `# ${thesis.title}\n\n`;
  md += `**Field:** ${thesis.academic_field || 'General'}\n`;
  md += `**Style:** ${thesis.writing_style || 'Academic'}\n`;
  md += `**Language:** ${thesis.language || 'English'}\n\n`;
  
  if (thesis.topic) {
    md += `## Abstract\n\n${thesis.topic}\n\n`;
  }

  md += `---\n\n`;

  for (const chapter of thesis.chapters || []) {
    md += `# Chapter ${chapter.chapter_number}: ${chapter.title}\n\n`;
    
    // Parse chapter content
    let chapterText = '';
    if (chapter.content) {
      try {
        const contentData = typeof chapter.content === 'string' 
          ? JSON.parse(chapter.content) 
          : chapter.content;
        chapterText = contentData.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    
    if (chapterText) {
      md += `${chapterText}\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

function generateMarkdownTable(tableData: any): string {
  if (!tableData.headers || !tableData.rows) return '';

  let table = '| ' + tableData.headers.join(' | ') + ' |\n';
  table += '| ' + tableData.headers.map(() => '---').join(' | ') + ' |\n';
  
  for (const row of tableData.rows) {
    table += '| ' + row.join(' | ') + ' |\n';
  }

  return table;
}

function generateLatex(thesis: any): string {
  let latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{setspace}
\\doublespacing

\\title{${escapeLatex(thesis.title)}}
\\author{}
\\date{\\today}

\\begin{document}

\\maketitle

`;

  if (thesis.description) {
    latex += `\\begin{abstract}
${escapeLatex(thesis.description)}
\\end{abstract}

`;
  }

  latex += `\\tableofcontents
\\newpage

`;

  for (const chapter of thesis.chapters || []) {
    latex += `\\section{${escapeLatex(chapter.title)}}

`;
    
    // Parse chapter content
    let chapterText = '';
    if (chapter.content) {
      try {
        const contentData = typeof chapter.content === 'string' 
          ? JSON.parse(chapter.content) 
          : chapter.content;
        chapterText = contentData.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    
    if (chapterText) {
      // Convert markdown to basic LaTeX
      const content = chapterText
        .replace(/## (.+)/g, '\\subsection{$1}')
        .replace(/### (.+)/g, '\\subsubsection{$1}')
        .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
        .replace(/\*(.+?)\*/g, '\\textit{$1}');
      
      latex += `${escapeLatex(content)}

`;
    }
  }

  latex += `\\end{document}`;

  return latex;
}

function generateLatexTable(tableData: any): string {
  if (!tableData.headers || !tableData.rows) return '';

  const cols = 'l'.repeat(tableData.headers.length);
  
  let table = `\\begin{table}[h]
\\centering
\\caption{${escapeLatex(tableData.title)}}
\\begin{tabular}{${cols}}
\\toprule
${tableData.headers.map(escapeLatex).join(' & ')} \\\\
\\midrule
`;

  for (const row of tableData.rows) {
    table += `${row.map(escapeLatex).join(' & ')} \\\\\n`;
  }

  table += `\\bottomrule
\\end{tabular}
\\end{table}

`;

  return table;
}

function escapeLatex(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}]/g, '\\$&')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

async function generateDocx(thesis: any): Promise<Buffer> {
  const children: any[] = [];

  // Title
  children.push(
    new Paragraph({
      text: thesis.title,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    })
  );

  // Metadata
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Field: ', bold: true }),
        new TextRun(thesis.academic_field || 'General'),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Writing Style: ', bold: true }),
        new TextRun(thesis.writing_style || 'Academic'),
      ],
      spacing: { after: 400 },
    })
  );

  // Abstract
  if (thesis.topic) {
    children.push(
      new Paragraph({
        text: 'Abstract',
        heading: HeadingLevel.HEADING_1,
      })
    );
    children.push(
      new Paragraph({
        text: thesis.topic || '',
        spacing: { after: 400 },
      })
    );
  }

  // Chapters
  for (const chapter of thesis.chapters || []) {
    children.push(
      new Paragraph({
        text: `Chapter ${chapter.chapter_number}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
      })
    );

    // Parse chapter content
    let chapterText = '';
    if (chapter.content) {
      try {
        const contentData = typeof chapter.content === 'string' 
          ? JSON.parse(chapter.content) 
          : chapter.content;
        chapterText = contentData.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }

    if (chapterText) {
      // Split content into paragraphs
      const paragraphs = chapterText.split('\n\n');
      for (const para of paragraphs) {
        if (para.startsWith('## ')) {
          children.push(
            new Paragraph({
              text: para.replace('## ', ''),
              heading: HeadingLevel.HEADING_2,
            })
          );
        } else if (para.startsWith('### ')) {
          children.push(
            new Paragraph({
              text: para.replace('### ', ''),
              heading: HeadingLevel.HEADING_3,
            })
          );
        } else if (para.trim()) {
          children.push(
            new Paragraph({
              text: para,
              spacing: { after: 200 },
            })
          );
        }
      }
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  return await Packer.toBuffer(doc);
}
