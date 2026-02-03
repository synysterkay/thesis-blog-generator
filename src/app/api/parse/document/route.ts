import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 120; // 2 minutes for large documents

// Chunk text into manageable pieces for LLM context
function chunkText(text: string, maxChunkSize: number = 3000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Extract text from TXT file
function extractTextFromTxt(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

// Extract text from PDF using pdf-parse
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import for pdf-parse (v1.1.1 uses CommonJS default export)
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('Failed to parse PDF');
  }
}

// Extract text from DOCX using mammoth
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (error) {
    console.error('DOCX parse error:', error);
    throw new Error('Failed to parse DOCX');
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { documentId } = await request.json();
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // Get document record
    const { data: document, error: fetchError } = await supabase
      .from('reference_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update status to processing
    await supabase
      .from('reference_documents')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', documentId);

    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('reference-docs')
        .download(document.file_path);

      if (downloadError || !fileData) {
        throw new Error('Failed to download file');
      }

      // Convert to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text based on file type
      let extractedText = '';
      
      switch (document.file_type) {
        case 'txt':
          extractedText = extractTextFromTxt(buffer);
          break;
        case 'pdf':
          extractedText = await extractTextFromPdf(buffer);
          break;
        case 'docx':
          extractedText = await extractTextFromDocx(buffer);
          break;
        default:
          throw new Error(`Unsupported file type: ${document.file_type}`);
      }

      // Clean up text
      extractedText = extractedText
        .replace(/\r\n/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ +/g, ' ')
        .trim();

      // Chunk the text for LLM context
      const chunks = chunkText(extractedText);

      // Update document with extracted text and chunks
      const { error: updateError } = await supabase
        .from('reference_documents')
        .update({
          extracted_text: extractedText.slice(0, 100000), // Limit stored text
          chunks: chunks.slice(0, 20), // Limit number of chunks
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        documentId,
        textLength: extractedText.length,
        chunkCount: chunks.length,
      });
    } catch (parseError: any) {
      console.error('Parse error:', parseError);
      
      // Update status to failed
      await supabase
        .from('reference_documents')
        .update({
          status: 'failed',
          error_message: parseError.message || 'Failed to parse document',
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId);

      return NextResponse.json({ 
        error: 'Failed to parse document',
        details: parseError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Parse endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to check parsing status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    const { data: document } = await supabase
      .from('reference_documents')
      .select('id, filename, status, error_message, file_size, file_type')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
