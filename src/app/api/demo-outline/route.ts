import { suggestChapters } from '@/lib/deepseek';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { topic, language } = await request.json();

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    const sanitizedTopic = topic.trim().slice(0, 200);
    const sanitizedLanguage = typeof language === 'string' ? language.trim().slice(0, 30) : 'English';

    const chapters = await suggestChapters(sanitizedTopic, 'General', sanitizedLanguage);
    const validChapters = chapters.slice(0, 7);

    return NextResponse.json({ chapters: validChapters });
  } catch (error) {
    console.error('Demo outline error:', error);
    // Fallback to generic English chapters on failure
    return NextResponse.json({
      chapters: [
        'Introduction and Problem Statement',
        'Literature Review and Theoretical Framework',
        'Research Methodology',
        'Data Collection and Analysis',
        'Results and Findings',
        'Discussion and Interpretation',
        'Conclusions and Future Directions',
      ],
    });
  }
}
