import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

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
    const { data: thesis, error } = await supabase
      .from('theses')
      .select('*')
      .eq('id', thesisId)
      .eq('user_id', user.id)
      .single();

    if (error || !thesis) {
      return NextResponse.json({ error: 'Thesis not found' }, { status: 404 });
    }

    let content: string | Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'markdown':
        content = generateMarkdown(thesis);
        contentType = 'text/markdown';
        filename = `${thesis.title}.md`;
        break;

      case 'latex':
        content = generateLatex(thesis);
        contentType = 'application/x-tex';
        filename = `${thesis.title}.tex`;
        break;

      case 'docx':
        content = await generateDocx(thesis);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${thesis.title}.docx`;
        break;

      case 'pdf':
        // For PDF, we'll return markdown and let the client handle conversion
        // or use a service like puppeteer
        content = generateMarkdown(thesis);
        contentType = 'text/markdown';
        filename = `${thesis.title}.md`;
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

function generateMarkdown(thesis: any): string {
  let md = `# ${thesis.title}\n\n`;
  md += `**Field:** ${thesis.field}\n`;
  md += `**Style:** ${thesis.writing_style}\n\n`;
  
  if (thesis.description) {
    md += `## Abstract\n\n${thesis.description}\n\n`;
  }

  md += `---\n\n`;

  for (const chapter of thesis.chapters || []) {
    md += `# Chapter ${chapter.order}: ${chapter.title}\n\n`;
    
    if (chapter.content) {
      md += `${chapter.content}\n\n`;
    }

    if (chapter.table_data) {
      md += `### ${chapter.table_data.title}\n\n`;
      md += generateMarkdownTable(chapter.table_data);
      md += '\n\n';
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
    
    if (chapter.content) {
      // Convert markdown to basic LaTeX
      const content = chapter.content
        .replace(/## (.+)/g, '\\subsection{$1}')
        .replace(/### (.+)/g, '\\subsubsection{$1}')
        .replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
        .replace(/\*(.+?)\*/g, '\\textit{$1}');
      
      latex += `${escapeLatex(content)}

`;
    }

    if (chapter.table_data) {
      latex += generateLatexTable(chapter.table_data);
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
        new TextRun(thesis.field),
      ],
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Writing Style: ', bold: true }),
        new TextRun(thesis.writing_style),
      ],
      spacing: { after: 400 },
    })
  );

  // Abstract
  if (thesis.description) {
    children.push(
      new Paragraph({
        text: 'Abstract',
        heading: HeadingLevel.HEADING_1,
      })
    );
    children.push(
      new Paragraph({
        text: thesis.description,
        spacing: { after: 400 },
      })
    );
  }

  // Chapters
  for (const chapter of thesis.chapters || []) {
    children.push(
      new Paragraph({
        text: `Chapter ${chapter.order}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
        pageBreakBefore: true,
      })
    );

    if (chapter.content) {
      // Split content into paragraphs
      const paragraphs = chapter.content.split('\n\n');
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
