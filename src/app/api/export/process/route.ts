import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Create admin client for background processing
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  console.log('\n========================================');
  console.log('🔄 EXPORT PROCESS: Starting background export...');
  console.log('========================================');
  
  try {
    const { exportId } = await request.json();
    console.log('📋 Export ID:', exportId);

    if (!exportId) {
      console.log('❌ EXPORT PROCESS: Missing exportId');
      return NextResponse.json({ error: 'Missing exportId' }, { status: 400 });
    }

    // Get export job
    console.log('🔍 EXPORT PROCESS: Fetching export job from database...');
    const { data: exportJob, error: fetchError } = await supabaseAdmin
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .single();

    if (fetchError || !exportJob) {
      console.error('❌ EXPORT PROCESS: Export job not found:', fetchError);
      return NextResponse.json({ error: 'Export job not found' }, { status: 404 });
    }
    console.log('✓ EXPORT PROCESS: Found export job for thesis:', exportJob.thesis_title);
    console.log('  → Format:', exportJob.format.toUpperCase());
    console.log('  → User ID:', exportJob.user_id);

    // Update status to processing
    console.log('📝 EXPORT PROCESS: Updating status to "processing"...');
    await supabaseAdmin
      .from('exports')
      .update({ status: 'processing' })
      .eq('id', exportId);
    console.log('✓ EXPORT PROCESS: Status updated to processing');

    try {
      // Fetch thesis
      console.log('📚 EXPORT PROCESS: Fetching thesis data...');
      const { data: thesis, error: thesisError } = await supabaseAdmin
        .from('theses')
        .select('*')
        .eq('id', exportJob.thesis_id)
        .single();

      if (thesisError || !thesis) {
        console.error('❌ EXPORT PROCESS: Thesis not found:', thesisError);
        throw new Error('Thesis not found');
      }
      console.log('✓ EXPORT PROCESS: Thesis loaded:', thesis.title);

      // Fetch chapters
      console.log('📖 EXPORT PROCESS: Fetching chapters...');
      const { data: chapters } = await supabaseAdmin
        .from('chapters')
        .select('*')
        .eq('thesis_id', exportJob.thesis_id)
        .order('chapter_number', { ascending: true });
      console.log('✓ EXPORT PROCESS: Found', chapters?.length || 0, 'chapters');

      const thesisWithChapters = {
        ...thesis,
        chapters: chapters || [],
      };

      // Generate export content
      console.log('🏭 EXPORT PROCESS: Generating', exportJob.format.toUpperCase(), 'file...');
      const startTime = Date.now();
      let content: Buffer | string;
      let contentType: string;
      let extension: string;

      switch (exportJob.format) {
        case 'markdown':
          console.log('  → Generating Markdown document...');
          content = generateMarkdown(thesisWithChapters);
          contentType = 'text/markdown';
          extension = 'md';
          break;

        case 'latex':
          console.log('  → Generating LaTeX document...');
          content = generateLatex(thesisWithChapters);
          contentType = 'application/x-tex';
          extension = 'tex';
          break;

        case 'docx':
          console.log('  → Generating DOCX document...');
          content = await generateDocx(thesisWithChapters);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = 'docx';
          break;

        case 'pdf':
          console.log('  → Generating PDF document...');
          content = await generatePDF(thesisWithChapters);
          contentType = 'application/pdf';
          extension = 'pdf';
          break;

        default:
          console.error('❌ EXPORT PROCESS: Invalid format:', exportJob.format);
          throw new Error('Invalid format');
      }
      const generationTime = Date.now() - startTime;
      console.log('✓ EXPORT PROCESS: Document generated in', generationTime, 'ms');

      // Generate unique file path
      const fileName = `${exportJob.user_id}/${exportId}.${extension}`;
      const fileBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
      const fileSizeKB = (fileBuffer.length / 1024).toFixed(2);
      console.log('📦 EXPORT PROCESS: File size:', fileSizeKB, 'KB');

      // Upload to Supabase Storage
      console.log('☁️  EXPORT PROCESS: Uploading to Supabase Storage...');
      console.log('  → Path:', fileName);
      const { error: uploadError } = await supabaseAdmin.storage
        .from('exports')
        .upload(fileName, fileBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('❌ EXPORT PROCESS: Upload failed:', uploadError);
        throw new Error('Failed to upload file');
      }
      console.log('✓ EXPORT PROCESS: File uploaded successfully');

      // Update export record with success
      console.log('📝 EXPORT PROCESS: Updating export record to completed...');
      await supabaseAdmin
        .from('exports')
        .update({
          status: 'completed',
          file_path: fileName,
          file_size: fileBuffer.length,
        })
        .eq('id', exportId);

      console.log('========================================');
      console.log('✅ EXPORT PROCESS: COMPLETED SUCCESSFULLY!');
      console.log('  → Thesis:', exportJob.thesis_title);
      console.log('  → Format:', exportJob.format.toUpperCase());
      console.log('  → Size:', fileSizeKB, 'KB');
      console.log('  → Export ID:', exportId);
      console.log('========================================\n');
      return NextResponse.json({ success: true });

    } catch (processError) {
      console.error('========================================');
      console.error('❌ EXPORT PROCESS: FAILED!');
      console.error('  → Error:', processError instanceof Error ? processError.message : 'Unknown error');
      console.error('  → Export ID:', exportId);
      console.error('========================================\n');
      
      // Update export record with failure
      await supabaseAdmin
        .from('exports')
        .update({
          status: 'failed',
          error_message: processError instanceof Error ? processError.message : 'Export failed',
        })
        .eq('id', exportId);

      return NextResponse.json({ error: 'Export processing failed' }, { status: 500 });
    }

  } catch (error: unknown) {
    console.error('========================================');
    console.error('❌ EXPORT PROCESS: CRITICAL ERROR!');
    console.error('  → Error:', error);
    console.error('========================================\n');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ===== EXPORT GENERATION FUNCTIONS =====

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

function generateReferences(): string[] {
  const year = new Date().getFullYear();
  return [
    `Author A., Title of First Reference Work, "Journal Name" ${year - 2}, vol. 1(1).`,
    `Author B., Author C., Second Reference Title, Publisher Name, City ${year - 3}.`,
    `Author D. et al., Third Reference in Academic Format, "Academic Journal" ${year - 1}, vol. 2(3).`,
  ];
}

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
  
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function generatePDF(thesis: any): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginLeft = 99;
  const marginRight = 71;
  const marginTop = 71;
  const marginBottom = 71;
  const contentWidth = pageWidth - marginLeft - marginRight;

  const year = new Date().getFullYear();
  const field = String(thesis.academic_field || 'General Studies');
  const thesisTitle = String(thesis.title || 'Untitled Thesis');
  const thesisTopic = thesis.topic ? String(thesis.topic) : '';

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

  const addPageNumber = (page: any, num: number) => {
    if (num > 2) {
      const displayNum = num - 2;
      const numText = String(displayNum);
      const numWidth = helveticaFont.widthOfTextAtSize(numText, 12);
      
      if (displayNum % 2 === 1) {
        page.drawText(numText, {
          x: pageWidth - marginRight - numWidth,
          y: 30,
          size: 12,
          font: helveticaFont,
          color: rgb(0, 0, 0),
        });
      } else {
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

  // Title page
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  
  drawCenteredText(page, 'Faculty of Applied Sciences', pageHeight - 100, helveticaFont, 12);
  drawCenteredText(page, `Field of study: ${field}`, pageHeight - 120, helveticaFont, 12);
  drawCenteredText(page, 'THESIS', pageHeight - 280, helveticaBold, 14);
  
  const titleLines = thesisTitle.length > 50 ? splitIntoLines(thesisTitle, 50) : [thesisTitle];
  let titleY = pageHeight - 340;
  for (const line of titleLines) {
    drawCenteredText(page, line, titleY, helveticaBold, 16);
    titleY -= 24;
  }
  
  drawCenteredText(page, 'Thesis written under supervision', pageHeight - 480, helveticaFont, 12);
  drawCenteredText(page, String(year), pageHeight - 700, helveticaFont, 12);

  // Statement page
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  drawCenteredText(page, 'STATEMENT', pageHeight - 180, helveticaBold, 14);
  
  let yPos = pageHeight - 230;
  yPos = drawWrappedText(page, 'Aware of my responsibility, I hereby declare that the thesis submitted was entirely written by myself.', marginLeft, yPos, contentWidth, helveticaFont, 11, 16);

  // TOC
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  drawCenteredText(page, 'TABLE OF CONTENTS', pageHeight - marginTop - 30, helveticaBold, 14);
  
  yPos = pageHeight - marginTop - 80;
  const tocEntry = (text: string, pageNumStr: string) => {
    const dots = '.'.repeat(Math.max(3, 50 - text.length));
    page.drawText(`${text} ${dots} ${pageNumStr}`, {
      x: marginLeft, y: yPos, size: 12, font: helveticaFont, color: rgb(0, 0, 0),
    });
    yPos -= 20;
  };
  
  tocEntry('INTRODUCTION', '4');
  for (let i = 0; i < chapters.length; i++) {
    tocEntry(`CHAPTER ${toRoman(i + 1)}: ${chapters[i].title.substring(0, 40)}`, String(5 + i * 3));
  }
  tocEntry('CONCLUSIONS', String(5 + chapters.length * 3));
  tocEntry('REFERENCES', String(6 + chapters.length * 3));

  // Introduction
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  drawCenteredText(page, 'INTRODUCTION', pageHeight - marginTop - 30, helveticaBold, 14);
  yPos = pageHeight - marginTop - 80;
  yPos = drawWrappedText(page, `This thesis examines ${thesisTitle}. The research explores various aspects of the topic within the field of ${field}.`, marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18);

  // Chapters
  for (let idx = 0; idx < chapters.length; idx++) {
    const chapter = chapters[idx];
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    pageNum++;
    addPageNumber(page, pageNum);
    
    drawCenteredText(page, `CHAPTER ${toRoman(idx + 1)}`, pageHeight - marginTop - 30, helveticaBold, 14);
    drawCenteredText(page, chapter.title.toUpperCase(), pageHeight - marginTop - 55, helveticaBold, 14);
    
    yPos = pageHeight - marginTop - 100;
    const paragraphs = chapter.text.split('\n\n').filter((p: string) => p.trim());
    
    for (const para of paragraphs) {
      if (yPos < marginBottom + 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        pageNum++;
        addPageNumber(page, pageNum);
        yPos = pageHeight - marginTop - 30;
      }
      
      const trimmed = para.trim();
      if (trimmed.startsWith('## ')) {
        yPos -= 15;
        page.drawText(trimmed.replace('## ', ''), { x: marginLeft, y: yPos, size: 12, font: helveticaBold, color: rgb(0, 0, 0) });
        yPos -= 20;
      } else if (trimmed.length > 0) {
        const cleanText = trimmed.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1');
        yPos = drawWrappedText(page, cleanText, marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18);
        yPos -= 8;
      }
    }
  }

  // Conclusions
  page = pdfDoc.addPage([pageWidth, pageHeight]);
  pageNum++;
  addPageNumber(page, pageNum);
  drawCenteredText(page, 'CONCLUSIONS', pageHeight - marginTop - 30, helveticaBold, 14);
  yPos = pageHeight - marginTop - 80;
  yPos = drawWrappedText(page, 'This thesis has examined the key aspects of the research topic presented in the preceding chapters. The findings support the thesis objectives.', marginLeft + 35, yPos, contentWidth - 35, helveticaFont, 12, 18);

  // References
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

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function generateMarkdown(thesis: any): string {
  let md = `# ${thesis.title}\n\n`;
  md += `**Field:** ${thesis.academic_field || 'General'}\n`;
  md += `**Style:** ${thesis.writing_style || 'Academic'}\n\n`;
  
  if (thesis.topic) md += `## Abstract\n\n${thesis.topic}\n\n`;
  md += `---\n\n`;

  for (const chapter of thesis.chapters || []) {
    md += `# Chapter ${chapter.chapter_number}: ${chapter.title}\n\n`;
    let chapterText = '';
    if (chapter.content) {
      try {
        const contentData = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = contentData.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    if (chapterText) md += `${chapterText}\n\n`;
    md += `---\n\n`;
  }

  return md;
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
\\date{\\today}

\\begin{document}
\\maketitle
`;

  if (thesis.topic) latex += `\\begin{abstract}\n${escapeLatex(thesis.topic)}\n\\end{abstract}\n\n`;
  latex += `\\tableofcontents\n\\newpage\n\n`;

  for (const chapter of thesis.chapters || []) {
    latex += `\\section{${escapeLatex(chapter.title)}}\n\n`;
    let chapterText = '';
    if (chapter.content) {
      try {
        const contentData = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = contentData.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    if (chapterText) {
      const content = chapterText
        .replace(/## (.+)/g, '\\subsection{$1}')
        .replace(/### (.+)/g, '\\subsubsection{$1}')
        .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
        .replace(/\*(.+?)\*/g, '\\textit{$1}');
      latex += `${escapeLatex(content)}\n\n`;
    }
  }

  latex += `\\end{document}`;
  return latex;
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

  children.push(new Paragraph({ text: thesis.title, heading: HeadingLevel.TITLE, spacing: { after: 400 } }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Field: ', bold: true }), new TextRun(thesis.academic_field || 'General')],
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Style: ', bold: true }), new TextRun(thesis.writing_style || 'Academic')],
    spacing: { after: 400 },
  }));

  if (thesis.topic) {
    children.push(new Paragraph({ text: 'Abstract', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: thesis.topic || '', spacing: { after: 400 } }));
  }

  for (const chapter of thesis.chapters || []) {
    children.push(new Paragraph({
      text: `Chapter ${chapter.chapter_number}: ${chapter.title}`,
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
    }));

    let chapterText = '';
    if (chapter.content) {
      try {
        const contentData = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = contentData.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }

    if (chapterText) {
      for (const para of chapterText.split('\n\n')) {
        if (para.startsWith('## ')) {
          children.push(new Paragraph({ text: para.replace('## ', ''), heading: HeadingLevel.HEADING_2 }));
        } else if (para.startsWith('### ')) {
          children.push(new Paragraph({ text: para.replace('### ', ''), heading: HeadingLevel.HEADING_3 }));
        } else if (para.trim()) {
          children.push(new Paragraph({ text: para, spacing: { after: 200 } }));
        }
      }
    }
  }

  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBuffer(doc);
}
