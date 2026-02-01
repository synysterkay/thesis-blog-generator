// @ts-nocheck - Deno/Supabase Edge Function (uses URL imports)
// Supabase Edge Function for processing exports
// This runs on Supabase's infrastructure with 60s timeout (free tier)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { exportId } = await req.json()
    
    if (!exportId) {
      return new Response(JSON.stringify({ error: 'Missing exportId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('🔄 Processing export:', exportId)

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get export job
    const { data: exportJob, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .single()

    if (fetchError || !exportJob) {
      console.error('Export job not found:', fetchError)
      return new Response(JSON.stringify({ error: 'Export job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update status to processing
    await supabase
      .from('exports')
      .update({ status: 'processing' })
      .eq('id', exportId)

    // Get thesis data
    const { data: thesis, error: thesisError } = await supabase
      .from('theses')
      .select('*')
      .eq('id', exportJob.thesis_id)
      .single()

    if (thesisError || !thesis) {
      throw new Error('Thesis not found')
    }

    // Get chapters
    const { data: chapters } = await supabase
      .from('chapters')
      .select('*')
      .eq('thesis_id', exportJob.thesis_id)
      .order('chapter_number', { ascending: true })

    const thesisWithChapters = { ...thesis, chapters: chapters || [] }

    // Generate content based on format
    let content: Uint8Array | string
    let contentType: string
    let extension: string

    switch (exportJob.format) {
      case 'markdown':
        content = generateMarkdown(thesisWithChapters)
        contentType = 'text/markdown'
        extension = 'md'
        break
      case 'latex':
        content = generateLatex(thesisWithChapters)
        contentType = 'application/x-tex'
        extension = 'tex'
        break
      case 'pdf':
        content = await generateSimplePDF(thesisWithChapters)
        contentType = 'application/pdf'
        extension = 'pdf'
        break
      default:
        throw new Error('Unsupported format')
    }

    // Upload to storage
    const fileName = `${exportJob.user_id}/${exportId}.${extension}`
    const fileData = typeof content === 'string' ? new TextEncoder().encode(content) : content

    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, fileData, { contentType, upsert: true })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Update export record
    await supabase
      .from('exports')
      .update({
        status: 'completed',
        file_path: fileName,
        file_size: fileData.length,
      })
      .eq('id', exportId)

    console.log('✅ Export completed:', exportId)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Export error:', error)
    
    // Try to mark as failed
    try {
      const { exportId } = await req.clone().json()
      if (exportId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        await supabase
          .from('exports')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Export failed',
          })
          .eq('id', exportId)
      }
    } catch {}

    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Simple PDF generation using basic text (no external libs needed in Deno)
async function generateSimplePDF(thesis: any): Promise<Uint8Array> {
  const title = thesis.title || 'Untitled Thesis'
  const field = thesis.academic_field || 'General Studies'
  const chapters = thesis.chapters || []

  // Build content
  let textContent = `${title}\n\nField: ${field}\n\n`
  textContent += `${'='.repeat(50)}\n\n`

  if (thesis.topic) {
    textContent += `Abstract:\n${thesis.topic}\n\n`
  }

  for (const chapter of chapters) {
    textContent += `${'='.repeat(50)}\n`
    textContent += `Chapter ${chapter.chapter_number}: ${chapter.title}\n`
    textContent += `${'='.repeat(50)}\n\n`

    let chapterText = ''
    if (chapter.content) {
      try {
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content
        chapterText = data?.text || ''
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : ''
      }
    }
    textContent += chapterText + '\n\n'
  }

  // For simplicity, we'll create a text file since true PDF requires complex libs
  // The API route will handle proper PDF generation
  // This is a fallback that creates a readable document
  return new TextEncoder().encode(textContent)
}

function generateMarkdown(thesis: any): string {
  let md = `# ${thesis.title}\n\n`
  md += `**Field:** ${thesis.academic_field || 'General'}\n`
  md += `**Style:** ${thesis.writing_style || 'Academic'}\n\n`
  
  if (thesis.topic) md += `## Abstract\n\n${thesis.topic}\n\n`
  md += `---\n\n`

  for (const chapter of thesis.chapters || []) {
    md += `# Chapter ${chapter.chapter_number}: ${chapter.title}\n\n`
    let chapterText = ''
    if (chapter.content) {
      try {
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content
        chapterText = data?.text || ''
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : ''
      }
    }
    if (chapterText) md += `${chapterText}\n\n`
    md += `---\n\n`
  }
  return md
}

function generateLatex(thesis: any): string {
  const escapeLatex = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/[&%$#_{}]/g, '\\$&')
  }

  let latex = `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{graphicx}
\\usepackage{setspace}
\\doublespacing

\\title{${escapeLatex(thesis.title)}}
\\date{\\today}

\\begin{document}
\\maketitle
`

  if (thesis.topic) {
    latex += `\\begin{abstract}\n${escapeLatex(thesis.topic)}\n\\end{abstract}\n\n`
  }
  latex += `\\tableofcontents\n\\newpage\n\n`

  for (const chapter of thesis.chapters || []) {
    latex += `\\section{${escapeLatex(chapter.title)}}\n\n`
    let chapterText = ''
    if (chapter.content) {
      try {
        const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content
        chapterText = data?.text || ''
      } catch {
        chapterText = typeof chapter.content === 'string' ? chapter.content : ''
      }
    }
    if (chapterText) latex += `${escapeLatex(chapterText)}\n\n`
  }

  latex += `\\end{document}`
  return latex
}
