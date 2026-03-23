import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, description, field, targetLength, language = 'English' } = await request.json();

    if (!title || !field) {
      return NextResponse.json(
        { error: 'Title and field are required' },
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

    // Determine number of chapters based on target length
    let chapterCount = 6;
    if (targetLength === 'short') {
      chapterCount = 5;
    } else if (targetLength === 'medium') {
      chapterCount = 7;
    } else if (targetLength === 'long') {
      chapterCount = 9;
    } else if (targetLength === 'extended') {
      chapterCount = 12;
    }

    const prompt = `You are an academic thesis structure expert. Based on the following thesis information, generate a list of chapter titles that would be appropriate for this academic work.

Thesis Title: ${title}
${description ? `Description: ${description}` : ''}
Academic Field: ${field}
Target Length: ${targetLength || 'medium'}
Language: ${language}

Generate exactly ${chapterCount} chapter titles that:
1. Follow standard academic thesis structure for the ${field} field
2. Are specific to the thesis topic (not generic)
3. Flow logically from introduction to conclusion
4. Include appropriate methodology and analysis chapters for the field
5. Use professional academic language
6. ALL chapter titles MUST be written in ${language}

IMPORTANT: Return ONLY a JSON array of chapter titles, nothing else. ALL titles must be in ${language}. Example format:
["Introduction", "Literature Review", "Methodology", "Data Analysis", "Results", "Discussion", "Conclusion"]

Do not include chapter numbers, just the titles. The response must be valid JSON.`;

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
            content: `You are an academic thesis structure expert. You only respond with valid JSON arrays.${language !== 'English' ? ` You MUST write all chapter titles in ${language}. Do NOT use English.` : ''}`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      throw new Error('Failed to generate chapters');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No content received from API');
    }

    // Parse the JSON array from the response
    let chapters: string[];
    try {
      // Try to extract JSON array if wrapped in markdown code blocks
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        chapters = JSON.parse(jsonMatch[0]);
      } else {
        chapters = JSON.parse(content);
      }

      // Validate it's an array of strings
      if (!Array.isArray(chapters) || !chapters.every(c => typeof c === 'string')) {
        throw new Error('Invalid chapter format');
      }
      
      // Remove any existing References chapter (we'll add it at the end)
      chapters = chapters.filter(c => !c.toLowerCase().includes('reference') && !c.toLowerCase().includes('bibliography'));
      
      // Always add References as the last chapter
      chapters.push('References');
      
    } catch (parseError) {
      console.error('Failed to parse chapters:', content);
      // Fallback to default chapters if parsing fails
      chapters = [
        'Introduction',
        'Literature Review',
        'Theoretical Framework',
        'Methodology',
        'Results and Analysis',
        'Discussion',
        'Conclusion and Recommendations',
        'References',
      ];
    }

    return NextResponse.json({ chapters });
  } catch (error: any) {
    console.error('Error generating chapters:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate chapters' },
      { status: 500 }
    );
  }
}
