import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, description, field, chapters } = await request.json();

    if (!title || !field || !chapters || !Array.isArray(chapters)) {
      return NextResponse.json(
        { error: 'Title, field, and chapters are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API configuration error' },
        { status: 500 }
      );
    }

    const prompt = `You are an academic thesis structure expert. Based on the following thesis information and chapters, generate subchapter outlines (sections) for each chapter.

Thesis Title: ${title}
${description ? `Description: ${description}` : ''}
Academic Field: ${field}

Chapters:
${chapters.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

For each chapter, generate 3-5 appropriate subchapters/sections that:
1. Break down the chapter into logical, focused sections
2. Use standard academic numbering (1.1, 1.2, 1.3, etc.)
3. Are specific to the thesis topic and chapter content
4. Follow academic conventions for the ${field} field
5. Cover the essential aspects that should be addressed in each chapter

IMPORTANT: Return ONLY a valid JSON object where each key is the chapter number (1, 2, 3, etc.) and the value is an array of subchapter titles. Example format:
{
  "1": ["Background and Context", "Research Objectives", "Scope and Limitations", "Thesis Structure"],
  "2": ["Historical Overview", "Key Theories", "Current State of Research", "Research Gap"],
  "3": ["Research Design", "Data Collection Methods", "Analysis Framework", "Ethical Considerations"]
}

Do not include the chapter numbers in the subchapter titles, just the descriptive titles. The response must be valid JSON.`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are an academic thesis structure expert. You only respond with valid JSON objects.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error('Failed to generate outlines');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No content received from API');
    }

    // Parse the JSON object from the response
    let outlines: Record<string, string[]>;
    try {
      // Try to extract JSON object if wrapped in markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        outlines = JSON.parse(jsonMatch[0]);
      } else {
        outlines = JSON.parse(content);
      }

      // Validate it's an object with arrays of strings
      if (typeof outlines !== 'object' || outlines === null) {
        throw new Error('Invalid outline format');
      }

      // Ensure all values are arrays of strings
      for (const key of Object.keys(outlines)) {
        if (!Array.isArray(outlines[key]) || !outlines[key].every(s => typeof s === 'string')) {
          throw new Error('Invalid outline format');
        }
      }
      
    } catch (parseError) {
      console.error('Failed to parse outlines:', content);
      // Fallback to default outlines if parsing fails
      outlines = {};
      chapters.forEach((chapter: string, index: number) => {
        const chapterNum = (index + 1).toString();
        if (chapter.toLowerCase().includes('introduction')) {
          outlines[chapterNum] = ['Background and Context', 'Research Problem', 'Objectives and Questions', 'Scope and Limitations', 'Thesis Structure'];
        } else if (chapter.toLowerCase().includes('literature') || chapter.toLowerCase().includes('review')) {
          outlines[chapterNum] = ['Theoretical Framework', 'Key Concepts and Definitions', 'Previous Studies', 'Research Gap'];
        } else if (chapter.toLowerCase().includes('method')) {
          outlines[chapterNum] = ['Research Design', 'Data Collection', 'Data Analysis', 'Validity and Reliability', 'Ethical Considerations'];
        } else if (chapter.toLowerCase().includes('result') || chapter.toLowerCase().includes('finding')) {
          outlines[chapterNum] = ['Overview of Findings', 'Main Results', 'Supporting Evidence', 'Summary of Key Insights'];
        } else if (chapter.toLowerCase().includes('discussion') || chapter.toLowerCase().includes('analysis')) {
          outlines[chapterNum] = ['Interpretation of Results', 'Comparison with Literature', 'Implications', 'Limitations'];
        } else if (chapter.toLowerCase().includes('conclusion')) {
          outlines[chapterNum] = ['Summary of Findings', 'Contributions', 'Recommendations', 'Future Research'];
        } else if (chapter.toLowerCase().includes('reference')) {
          outlines[chapterNum] = ['Academic Sources', 'Online Resources', 'Other References'];
        } else {
          outlines[chapterNum] = ['Overview', 'Main Content', 'Analysis', 'Summary'];
        }
      });
    }

    return NextResponse.json({ outlines });
  } catch (error: any) {
    console.error('Error generating outlines:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate outlines' },
      { status: 500 }
    );
  }
}
