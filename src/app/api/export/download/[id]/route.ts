import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exportId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get export record
    const { data: exportRecord, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    if (exportRecord.status !== 'completed' || !exportRecord.file_path) {
      return NextResponse.json({ error: 'Export not ready' }, { status: 400 });
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('exports')
      .download(exportRecord.file_path);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    // Determine content type
    const extension = exportRecord.file_path.split('.').pop();
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      tex: 'application/x-tex',
      md: 'text/markdown',
    };

    const contentType = contentTypes[extension || 'pdf'] || 'application/octet-stream';
    const fileName = `${exportRecord.thesis_title}.${extension}`;

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(buffer.length),
      },
    });

  } catch (error: unknown) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}

// Delete export
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: exportId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get export record
    const { data: exportRecord, error: fetchError } = await supabase
      .from('exports')
      .select('*')
      .eq('id', exportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !exportRecord) {
      return NextResponse.json({ error: 'Export not found' }, { status: 404 });
    }

    // Delete from storage if file exists
    if (exportRecord.file_path) {
      await supabaseAdmin.storage
        .from('exports')
        .remove([exportRecord.file_path]);
    }

    // Delete record
    await supabase
      .from('exports')
      .delete()
      .eq('id', exportId);

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
