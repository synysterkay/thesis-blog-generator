import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, TableOfContents, StyleLevel, AlignmentType, Footer, PageNumber, NumberFormat } from 'docx';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId, format } = await request.json();

    if (!thesisId || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch thesis
    const { data: thesis, error: thesisError } = await supabase
      .from('theses')
      .select('*')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (thesisError || !thesis) {
      return NextResponse.json({ error: 'Thesis not found' }, { status: 404 });
    }

    // Fetch chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('thesis_id', thesisId)
      .order('chapter_number', { ascending: true });

    const thesisData = { ...thesis, chapters: chapters || [] };

    // Generate content
    let content: Buffer | string;
    let contentType: string;
    let extension: string;
    let filename: string;

    const safeTitle = thesis.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);

    switch (format) {
      case 'markdown':
        content = generateMarkdown(thesisData);
        contentType = 'text/markdown';
        extension = 'md';
        break;
      case 'latex':
        content = generateLatex(thesisData);
        contentType = 'application/x-tex';
        extension = 'tex';
        break;
      case 'docx':
        content = await generateDocx(thesisData);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        extension = 'docx';
        break;
      case 'pdf':
        // Generate HTML that can be printed to PDF
        content = generatePDFHtml(thesisData);
        contentType = 'text/html';
        extension = 'html';
        break;
      default:
        return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    filename = `${safeTitle}.${extension}`;
    const buffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');
    
    // Log export to database (metadata only, no file storage)
    await supabase.from('exports').insert({
      user_id: user.id,
      thesis_id: thesis.id,
      thesis_title: thesis.title,
      format,
      status: 'completed',
      file_size: buffer.length,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ===== HELPER FUNCTIONS =====

function getChapterText(chapter: any): string {
  if (!chapter.content) return '';
  try {
    const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
    return data?.text || '';
  } catch {
    return typeof chapter.content === 'string' ? chapter.content : '';
  }
}

function toRoman(num: number): string {
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let roman = '';
  for (let i = 0; num > 0; i++) {
    while (num >= val[i]) { roman += syms[i]; num -= val[i]; }
  }
  return roman;
}

// ===== PDF (HTML) GENERATION =====

function generatePDFHtml(thesis: any): string {
  const title = thesis.title || 'Untitled Thesis';
  const field = thesis.academic_field || 'General Studies';
  const year = new Date().getFullYear();
  const chapters = thesis.chapters || [];

  let toc = chapters.map((ch: any, i: number) => 
    `<p style="margin:8px 0;"><a href="#chapter-${i+1}" style="color:#333;text-decoration:none;">Chapter ${toRoman(i+1)}: ${ch.title}</a></p>`
  ).join('');

  let chaptersHtml = chapters.map((ch: any, i: number) => {
    const text = getChapterText(ch);
    const paragraphs = text.split('\n\n').filter((p: string) => p.trim())
      .map((p: string) => `<p style="text-indent:2em;text-align:justify;line-height:2;margin:0 0 1em 0;">${p.trim()}</p>`).join('');
    return `
      <div style="page-break-before:always;" id="chapter-${i+1}">
        <h2 style="text-align:center;font-size:14pt;margin:60px 0 40px 0;text-transform:uppercase;">
          CHAPTER ${toRoman(i+1)}<br/>${ch.title}
        </h2>
        ${paragraphs}
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 2.5cm 2cm 2.5cm 3cm; }
    @media print { body { print-color-adjust: exact; } }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.5; color: #000; max-width: 21cm; margin: 0 auto; padding: 2cm; }
    .title-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
    .no-print-break { page-break-inside: avoid; }
  </style>
</head>
<body>
  <!-- Title Page -->
  <div class="title-page">
    <p style="font-size:12pt;">Faculty of Applied Sciences</p>
    <p style="font-size:12pt;margin-bottom:100px;">Field of study: ${field}</p>
    <p style="font-size:14pt;font-weight:bold;margin:40px 0;">THESIS</p>
    <h1 style="font-size:18pt;font-weight:bold;margin:20px 40px;line-height:1.4;">${title}</h1>
    <p style="margin-top:100px;font-size:12pt;">Thesis written under supervision</p>
    <p style="position:absolute;bottom:80px;font-size:12pt;">${year}</p>
  </div>

  <!-- Statement Page -->
  <div style="page-break-after:always;padding-top:100px;">
    <h2 style="text-align:center;font-size:14pt;margin-bottom:40px;">STATEMENT</h2>
    <p style="text-indent:2em;text-align:justify;line-height:2;">
      Aware of my responsibility, I hereby declare that the thesis submitted was entirely written by myself. 
      I also declare that this work has not been submitted in the same or similar form for obtaining a diploma 
      or a degree from any educational institution.
    </p>
    <div style="margin-top:80px;text-align:right;padding-right:40px;">
      <p>____________________________</p>
      <p style="font-size:10pt;">Author's signature</p>
    </div>
  </div>

  ${thesis.topic ? `
  <!-- Abstract Page -->
  <div style="page-break-after:always;">
    <h2 style="text-align:center;font-size:14pt;margin:60px 0 40px 0;">ABSTRACT</h2>
    <p style="text-indent:2em;text-align:justify;line-height:2;">${thesis.topic}</p>
  </div>
  ` : ''}

  <!-- Table of Contents -->
  <div style="page-break-after:always;">
    <h2 style="text-align:center;font-size:14pt;margin:60px 0 40px 0;">TABLE OF CONTENTS</h2>
    ${toc}
  </div>

  <!-- Chapters -->
  ${chaptersHtml}

  <!-- Conclusions -->
  <div style="page-break-before:always;">
    <h2 style="text-align:center;font-size:14pt;margin:60px 0 40px 0;">CONCLUSIONS</h2>
    <p style="text-indent:2em;text-align:justify;line-height:2;">
      This thesis has examined the key aspects of the research topic presented in the preceding chapters. 
      The findings support the thesis objectives and contribute to the understanding of ${field.toLowerCase()}.
    </p>
  </div>

  <script>
    // Auto-print hint
    if(window.location.protocol === 'file:') {
      console.log('To save as PDF: Press Ctrl+P (or Cmd+P on Mac) and select "Save as PDF"');
    }
  </script>
</body>
</html>`;
}

// ===== MARKDOWN GENERATION =====

function generateMarkdown(thesis: any): string {
  const title = thesis.title || 'Untitled Thesis';
  const field = thesis.academic_field || 'General Studies';
  const year = new Date().getFullYear();
  const chapters = thesis.chapters || [];

  let md = `# ${title}\n\n`;
  md += `**Field of Study:** ${field}  \n`;
  md += `**Year:** ${year}  \n`;
  md += `**Style:** ${thesis.writing_style || 'Academic'}\n\n`;
  md += `---\n\n`;

  // Statement
  md += `## Statement\n\n`;
  md += `Aware of my responsibility, I hereby declare that the thesis submitted was entirely written by myself.\n\n`;
  md += `---\n\n`;

  // Abstract
  if (thesis.topic) {
    md += `## Abstract\n\n${thesis.topic}\n\n`;
    md += `---\n\n`;
  }

  // Table of Contents
  md += `## Table of Contents\n\n`;
  for (let i = 0; i < chapters.length; i++) {
    md += `${i + 1}. [Chapter ${toRoman(i + 1)}: ${chapters[i].title}](#chapter-${i + 1})\n`;
  }
  md += `\n---\n\n`;

  // Chapters
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    md += `## Chapter ${toRoman(i + 1)}: ${ch.title} {#chapter-${i + 1}}\n\n`;
    const text = getChapterText(ch);
    if (text) md += `${text}\n\n`;
    md += `---\n\n`;
  }

  // Conclusions
  md += `## Conclusions\n\n`;
  md += `This thesis has examined the key aspects of the research topic presented in the preceding chapters. The findings support the thesis objectives.\n\n`;

  return md;
}

// ===== LATEX GENERATION =====

function generateLatex(thesis: any): string {
  const escape = (t: string) => (t || '').replace(/\\/g, '\\textbackslash{}').replace(/[&%$#_{}]/g, '\\$&').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
  
  const title = thesis.title || 'Untitled Thesis';
  const field = thesis.academic_field || 'General Studies';
  const year = new Date().getFullYear();
  const chapters = thesis.chapters || [];

  let latex = `\\documentclass[12pt,a4paper]{report}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{times}
\\usepackage{setspace}
\\usepackage{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}

\\geometry{left=3cm,right=2cm,top=2.5cm,bottom=2.5cm}
\\doublespacing

\\titleformat{\\chapter}[display]
  {\\normalfont\\Large\\bfseries\\centering}
  {CHAPTER \\Roman{chapter}}{0pt}{\\Large\\uppercase}
\\titlespacing*{\\chapter}{0pt}{50pt}{40pt}

\\begin{document}

% Title Page
\\begin{titlepage}
\\centering
\\vspace*{2cm}
{\\normalsize Faculty of Applied Sciences\\\\[0.5cm]}
{\\normalsize Field of study: ${escape(field)}\\\\[4cm]}
{\\large\\bfseries THESIS\\\\[1cm]}
{\\LARGE\\bfseries ${escape(title)}\\\\[4cm]}
{\\normalsize Thesis written under supervision\\\\[6cm]}
{\\normalsize ${year}}
\\end{titlepage}

% Statement Page
\\chapter*{Statement}
\\addcontentsline{toc}{chapter}{Statement}
Aware of my responsibility, I hereby declare that the thesis submitted was entirely written by myself. I also declare that this work has not been submitted in the same or similar form for obtaining a diploma or a degree from any educational institution.

\\vspace{3cm}
\\hfill\\begin{tabular}{c}
\\rule{6cm}{0.4pt}\\\\
Author's signature
\\end{tabular}

\\newpage
`;

  // Abstract
  if (thesis.topic) {
    latex += `% Abstract
\\chapter*{Abstract}
\\addcontentsline{toc}{chapter}{Abstract}
${escape(thesis.topic)}

\\newpage
`;
  }

  // Table of Contents
  latex += `\\tableofcontents
\\newpage

`;

  // Chapters
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    latex += `\\chapter{${escape(ch.title)}}
`;
    const text = getChapterText(ch);
    if (text) {
      const paragraphs = text.split('\n\n').filter((p: string) => p.trim());
      for (const para of paragraphs) {
        latex += `${escape(para.trim())}\n\n`;
      }
    }
  }

  // Conclusions
  latex += `\\chapter*{Conclusions}
\\addcontentsline{toc}{chapter}{Conclusions}
This thesis has examined the key aspects of the research topic presented in the preceding chapters. The findings support the thesis objectives and contribute to the understanding of ${escape(field.toLowerCase())}.

\\end{document}`;

  return latex;
}

// ===== DOCX GENERATION =====

async function generateDocx(thesis: any): Promise<Buffer> {
  const title = thesis.title || 'Untitled Thesis';
  const field = thesis.academic_field || 'General Studies';
  const year = new Date().getFullYear();
  const chapters = thesis.chapters || [];

  const children: any[] = [];

  // Title Page
  children.push(new Paragraph({ text: '', spacing: { after: 1000 } }));
  children.push(new Paragraph({ text: 'Faculty of Applied Sciences', alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
  children.push(new Paragraph({ text: `Field of study: ${field}`, alignment: AlignmentType.CENTER, spacing: { after: 2000 } }));
  children.push(new Paragraph({ text: 'THESIS', alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, spacing: { after: 400 } }));
  children.push(new Paragraph({ text: title, alignment: AlignmentType.CENTER, heading: HeadingLevel.TITLE, spacing: { after: 2000 } }));
  children.push(new Paragraph({ text: 'Thesis written under supervision', alignment: AlignmentType.CENTER, spacing: { after: 3000 } }));
  children.push(new Paragraph({ text: String(year), alignment: AlignmentType.CENTER, spacing: { after: 400 } }));

  // Statement Page
  children.push(new Paragraph({ text: 'STATEMENT', alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 600 } }));
  children.push(new Paragraph({ 
    text: 'Aware of my responsibility, I hereby declare that the thesis submitted was entirely written by myself. I also declare that this work has not been submitted in the same or similar form for obtaining a diploma or a degree from any educational institution.',
    spacing: { after: 1200, line: 480 }
  }));
  children.push(new Paragraph({ text: '____________________________', alignment: AlignmentType.RIGHT, spacing: { before: 800 } }));
  children.push(new Paragraph({ text: "Author's signature", alignment: AlignmentType.RIGHT }));

  // Abstract
  if (thesis.topic) {
    children.push(new Paragraph({ text: 'ABSTRACT', alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 600 } }));
    children.push(new Paragraph({ text: thesis.topic, spacing: { after: 400, line: 480 } }));
  }

  // Table of Contents Header
  children.push(new Paragraph({ text: 'TABLE OF CONTENTS', alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 600 } }));
  for (let i = 0; i < chapters.length; i++) {
    children.push(new Paragraph({ 
      text: `Chapter ${toRoman(i + 1)}: ${chapters[i].title}`,
      spacing: { after: 200 }
    }));
  }

  // Chapters
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    children.push(new Paragraph({
      text: `CHAPTER ${toRoman(i + 1)}`,
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: true,
      spacing: { after: 200 }
    }));
    children.push(new Paragraph({
      text: ch.title.toUpperCase(),
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 600 }
    }));
    
    const text = getChapterText(ch);
    if (text) {
      const paragraphs = text.split('\n\n').filter((p: string) => p.trim());
      for (const para of paragraphs) {
        children.push(new Paragraph({ 
          text: para.trim(), 
          spacing: { after: 280, line: 480 },
          indent: { firstLine: 720 }
        }));
      }
    }
  }

  // Conclusions
  children.push(new Paragraph({ text: 'CONCLUSIONS', alignment: AlignmentType.CENTER, heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 600 } }));
  children.push(new Paragraph({ 
    text: `This thesis has examined the key aspects of the research topic presented in the preceding chapters. The findings support the thesis objectives and contribute to the understanding of ${field.toLowerCase()}.`,
    spacing: { after: 400, line: 480 },
    indent: { firstLine: 720 }
  }));

  const doc = new Document({ 
    sections: [{ 
      properties: {},
      children 
    }]
  });
  
  return await Packer.toBuffer(doc);
}
