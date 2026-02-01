import { NextRequest, NextResponse } from 'next/server';
import { generateFootnotes } from '@/lib/deepseek';

export async function POST(req: NextRequest) {
  try {
    const { chapterTitle, chapterContent, academicField, language } = await req.json();

    if (!chapterTitle || !chapterContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await generateFootnotes(
      chapterTitle,
      chapterContent,
      academicField || 'General Studies',
      language || 'English'
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Footnote generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate footnotes' },
      { status: 500 }
    );
  }
}
