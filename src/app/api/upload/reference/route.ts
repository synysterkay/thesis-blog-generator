import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

// Max file sizes
const FREE_MAX_SIZE = 10 * 1024 * 1024; // 10MB
const PRO_MAX_SIZE = 20 * 1024 * 1024; // 20MB
const FREE_MAX_FILES = 2;
const PRO_MAX_FILES = 10;

// Allowed file types
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .single();
    
    const isPremium = !!subscription;
    const maxSize = isPremium ? PRO_MAX_SIZE : FREE_MAX_SIZE;
    const maxFiles = isPremium ? PRO_MAX_FILES : FREE_MAX_FILES;

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const thesisId = formData.get('thesisId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (all types allowed for all users)
    const fileType = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    if (!fileType) {
      return NextResponse.json({ 
        error: 'Invalid file type. Supported: PDF, DOCX, TXT' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Max size: ${isPremium ? '20MB' : '5MB'}` 
      }, { status: 400 });
    }

    // Check existing file count for this user (or thesis if provided)
    const countQuery = supabase
      .from('reference_documents')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);
    
    if (thesisId) {
      countQuery.eq('thesis_id', thesisId);
    }
    
    const { count } = await countQuery;
    
    if ((count || 0) >= maxFiles) {
      return NextResponse.json({ 
        error: `Maximum ${maxFiles} files allowed. ${isPremium ? '' : 'Upgrade to Pro for more.'}` 
      }, { status: 400 });
    }

    // Generate unique file path
    const timestamp = Date.now();
    const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${timestamp}_${safeFilename}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { error: uploadError } = await supabase.storage
      .from('reference-docs')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Create database record
    const { data: document, error: dbError } = await supabase
      .from('reference_documents')
      .insert({
        thesis_id: thesisId || null,
        user_id: user.id,
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileType,
        status: 'pending',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('reference-docs').remove([filePath]);
      return NextResponse.json({ error: 'Failed to save document record' }, { status: 500 });
    }

    // Trigger parsing in background (fire and forget)
    fetch(`${request.nextUrl.origin}/api/parse/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: document.id }),
    }).catch(console.error);

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        fileSize: document.file_size,
        fileType: document.file_type,
        status: document.status,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE endpoint to remove a document
export async function DELETE(request: NextRequest) {
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

    // Get document to find file path
    const { data: document } = await supabase
      .from('reference_documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage.from('reference-docs').remove([document.file_path]);

    // Delete from database
    await supabase
      .from('reference_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
