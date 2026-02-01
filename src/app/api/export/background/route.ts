import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Admin client for direct database access
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createSupabaseClient(url, key);
};

export async function POST(request: Request) {
  console.log('📥 EXPORT: Starting...');
  
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('❌ EXPORT: Unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { thesisId, format } = await request.json();
    console.log('📝 EXPORT: Format:', format, 'Thesis:', thesisId);

    if (!thesisId || !format) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get admin client
    const supabaseAdmin = getSupabaseAdmin();

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

    const thesisWithChapters = { ...thesis, chapters: chapters || [] };

    // Create export job record with pending status
    const { data: exportJob, error: exportError } = await supabase
      .from('exports')
      .insert({
        user_id: user.id,
        thesis_id: thesisId,
        thesis_title: thesis.title,
        format,
        status: 'processing',
      })
      .select()
      .single();

    if (exportError) {
      return NextResponse.json({ error: 'Failed to create export job' }, { status: 500 });
    }

    try {
      // Generate content - simplified for speed
      let content: Buffer | string;
      let contentType: string;
      let extension: string;

      switch (format) {
        case 'markdown':
          content = generateMarkdown(thesisWithChapters);
          contentType = 'text/markdown';
          extension = 'md';
          break;
        case 'latex':
          content = generateLatex(thesisWithChapters);
          contentType = 'application/x-tex';
          extension = 'tex';
          break;
        case 'docx':
          content = await generateDocx(thesisWithChapters);
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          extension = 'docx';
          break;
        case 'pdf':
          // Generate formatted text version (fast, works within Vercel free tier 10s limit)
          content = generatePDFText(thesisWithChapters);
          contentType = 'text/plain';
          extension = 'pdf.txt';
          break;
        default:
          throw new Error('Invalid format');
      }

      // Upload to storage
      const fileName = `${user.id}/${exportJob.id}.${extension}`;
      const fileBuffer = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8');

      const { error: uploadError } = await supabaseAdmin.storage
        .from('exports')
        .upload(fileName, fileBuffer, { contentType, upsert: true });

      if (uploadError) {
        throw new Error('Failed to upload file');
      }

      // Update export record
      await supabaseAdmin
        .from('exports')
        .update({
          status: 'completed',
          file_path: fileName,
          file_size: fileBuffer.length,
        })
        .eq('id', exportJob.id);

      console.log('✅ EXPORT: Completed', exportJob.id);

      return NextResponse.json({ 
        success: true, 
        exportId: exportJob.id,
        message: 'Export completed'
      });

    } catch (processError) {
      const errorMsg = processError instanceof Error ? processError.message : 'Export failed';
      console.error('❌ EXPORT failed:', errorMsg, processError);
      
      try {
        await supabaseAdmin
          .from('exports')
          .update({
            status: 'failed',
            error_message: errorMsg,
          })
          .eq('id', exportJob.id);
      } catch (updateErr) {
        console.error('Failed to update export status:', updateErr);
      }

      return NextResponse.json({ error: 'Export processing failed', details: errorMsg }, { status: 500 });
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Export failed';
    console.error('❌ EXPORT error:', message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Get user's exports
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: exports, error } = await supabase
      .from('exports')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch exports:', error);
      return NextResponse.json({ error: 'Failed to fetch exports' }, { status: 500 });
    }

    return NextResponse.json({ exports: exports || [] });
  } catch (error: unknown) {
    console.error('Fetch exports error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch exports';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete an export
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { exportId } = await request.json();

    if (!exportId) {
      return NextResponse.json({ error: 'Export ID required' }, { status: 400 });
    }

    // Fetch export to verify ownership and get file path
    const { data: exportRecord, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    // Delete file from storage if exists
    if (exportRecord.file_path) {
      const { error: storageError } = await supabase.storage
        .from('exports')
        .remove([exportRecord.file_path]);
      
      if (storageError) {
        console.error('Failed to delete file from storage:', storageError);
      }
    }

    // Delete export record
    const { error: deleteError } = await supabase
      .from('exports')
      .delete()
      .eq('id', exportId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Failed to delete export record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete export' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Export deleted' });
  } catch (error: unknown) {
    console.error('Delete export error:', error);
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ===== SIMPLIFIED EXPORT GENERATION FUNCTIONS =====

function generatePDFText(thesis: any): string {
  const title = thesis.title || 'Untitled Thesis';
  const field = thesis.academic_field || 'General Studies';
  const year = new Date().getFullYear();
  
  let content = '';
  content += `${'═'.repeat(60)}\n`;
  content += `                         THESIS\n`;
  content += `${'═'.repeat(60)}\n\n`;
  content += `Title: ${title}\n`;
  content += `Field: ${field}\n`;
  content += `Year: ${year}\n\n`;
  content += `${'─'.repeat(60)}\n\n`;

  if (thesis.topic) {
    content += `ABSTRACT\n${'─'.repeat(40)}\n${thesis.topic}\n\n`;
  }

  content += `TABLE OF CONTENTS\n${'─'.repeat(40)}\n`;
  for (const chapter of thesis.chapters || []) {
    content += `  Chapter ${chapter.chapter_number}: ${chapter.title}\n`;
  }
  content += `\n${'═'.repeat(60)}\n\n`;

  for (const chapter of thesis.chapters || []) {
    content += `\nCHAPTER ${chapter.chapter_number}: ${chapter.title.toUpperCase()}\n`;
    content += `${'─'.repeat(50)}\n\n`;
    
    let chapterText = '';
    if (chapter.content) {
      try {
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = data?.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    content += chapterText + '\n\n';
  }

  content += `\n${'═'.repeat(60)}\n`;
  content += `                      END OF THESIS\n`;
  content += `${'═'.repeat(60)}\n`;
  
  return content;
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
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = data?.text || '';
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
  const escape = (t: string) => t?.replace(/[&%$#_{}]/g, '\\$&') || '';
  
  let latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{setspace}
\\doublespacing
\\title{${escape(thesis.title)}}
\\date{\\today}
\\begin{document}
\\maketitle
`;
  if (thesis.topic) latex += `\\begin{abstract}\n${escape(thesis.topic)}\n\\end{abstract}\n\n`;
  latex += `\\tableofcontents\n\\newpage\n\n`;
  
  for (const chapter of thesis.chapters || []) {
    latex += `\\section{${escape(chapter.title)}}\n\n`;
    let chapterText = '';
    if (chapter.content) {
      try {
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = data?.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    if (chapterText) latex += `${escape(chapterText)}\n\n`;
  }
  latex += `\\end{document}`;
  return latex;
}

async function generateDocx(thesis: any): Promise<Buffer> {
  const children: any[] = [];
  children.push(new Paragraph({ text: thesis.title, heading: HeadingLevel.TITLE, spacing: { after: 400 } }));
  children.push(new Paragraph({
    children: [new TextRun({ text: 'Field: ', bold: true }), new TextRun(thesis.academic_field || 'General')],
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
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
        chapterText = data?.text || '';
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : '';
      }
    }
    if (chapterText) {
      for (const para of chapterText.split('\n\n')) {
        if (para.trim()) {
          children.push(new Paragraph({ text: para.trim(), spacing: { after: 200 } }));
        }
      }
    }
  }
  
  const doc = new Document({ sections: [{ properties: {}, children }] });
  return await Packer.toBuffer(doc);
}