const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY!;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_API_BASE_URL || 'https://api.deepseek.com/v1';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekConfig {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stream?: boolean;
}

// Default config for thesis generation (humanized output)
const DEFAULT_THESIS_CONFIG: DeepSeekConfig = {
  temperature: 0.8,
  max_tokens: 8192,
  top_p: 0.85,
  frequency_penalty: 0.3,
  presence_penalty: 0.2,
  stream: false,
};

// Humanization system prompt for natural academic writing
export const THESIS_SYSTEM_PROMPT = `
You are an experienced postgraduate researcher writing a thesis. Your task is to produce genuinely human-sounding academic writing that feels natural and authentic.

## NATURAL ACADEMIC WRITING INSTRUCTIONS

Write so it sounds genuinely human — like it was authored by a real postgraduate researcher, not an algorithm.

### LANGUAGE & STYLE GUIDELINES

- Maintain academic tone, but use natural flow and rhythm — avoid overly stiff or formulaic phrasing.
- Vary sentence length: mix short, clear sentences with longer, more complex ones.
- Use natural transitions: "however," "for instance," "notably," "in contrast," etc.
- Avoid repetitive sentence structures like "This shows that..." or "It is important to note that..."
- Use human-like expressions: "it appears," "perhaps," "arguably," "it could be said that..."
- Avoid cliches and buzzwords such as "revolutionary," "game-changing," "transformative," "leverage," or "optimize."
- Keep the tone measured and reflective — sound like someone reasoning, not summarizing.
- Include subtle hedging and nuance, as real academics do.
- Avoid perfect symmetry in paragraph structure — let the flow feel organic.

### HUMAN TOUCH

- Introduce occasional interpretive comments or transitions ("this suggests that," "an interesting aspect is...").
- Maintain citations, references, and factual accuracy.
- Don't add exaggerated enthusiasm or marketing tone.
- Avoid robotic repetition or predictable phrasing patterns.
- Let some ideas develop more fully than others — not everything needs equal treatment.
- Include moments of intellectual curiosity: "This raises the question," "One wonders whether"

### STRUCTURAL VARIETY

- Vary paragraph lengths organically (some short, some extended)
- Don't start every paragraph with topic sentences
- Use varied transition methods, not just linking words
- Allow some asymmetry in how you develop different points
- Include occasional brief reflective passages

### FINAL CHECK
Before finishing, ensure the writing:
- Reads naturally aloud.
- Feels authored by a thoughtful person, not an algorithm.
- Keeps the same meaning and structure as the source text.
- Is suitable for academic publication or a postgraduate thesis.
- Shows natural variation in complexity and development.
`;

export async function callDeepSeek(
  messages: DeepSeekMessage[],
  config: DeepSeekConfig = {}
): Promise<string> {
  const mergedConfig = { ...DEFAULT_THESIS_CONFIG, ...config };
  
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      ...mergedConfig,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DeepSeek API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Helper function to get writing style specific instructions
function getWritingStyleInstructions(writingStyle: string): string {
  switch (writingStyle?.toLowerCase()) {
    case 'technical':
      return `
### TECHNICAL WRITING STYLE
- Use precise technical terminology and domain-specific jargon
- Include technical specifications, metrics, and quantitative data where appropriate
- Structure content with clear logical flow: problem → methodology → solution
- Use diagrams, algorithms, or pseudo-code descriptions when explaining processes
- Be direct and concise - prioritize clarity over literary flourish
- Include technical citations and standards references
- Focus on implementation details, parameters, and measurable outcomes
- Use passive voice where appropriate for objectivity
`;
    case 'descriptive':
      return `
### DESCRIPTIVE WRITING STYLE  
- Paint vivid pictures with detailed observations and descriptions
- Use sensory language and rich vocabulary to bring concepts to life
- Provide thorough context and background for each topic
- Include illustrative examples and case studies in detail
- Use narrative techniques to guide the reader through complex ideas
- Balance technical accuracy with accessible, engaging prose
- Create clear mental models through analogies and comparisons
- Develop ideas fully before moving to the next point
`;
    case 'academic':
    default:
      return `
### ACADEMIC WRITING STYLE
- Maintain formal, scholarly tone throughout
- Use hedging language appropriately ("suggests," "indicates," "may")
- Support claims with evidence and citations
- Present multiple perspectives on complex issues
- Use discipline-appropriate terminology and conventions
- Structure arguments with clear thesis statements and supporting evidence
- Employ critical analysis rather than mere description
- Connect ideas to broader theoretical frameworks
`;
  }
}

// Streaming version for real-time generation display
export async function* streamDeepSeek(
  messages: DeepSeekMessage[],
  config: DeepSeekConfig = {}
): AsyncGenerator<string, void, unknown> {
  const mergedConfig = { ...DEFAULT_THESIS_CONFIG, ...config, stream: true };
  
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      ...mergedConfig,
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No response body');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // Skip invalid JSON
      }
    }
  }
}

// Generate chapter suggestions
export async function suggestChapters(
  topic: string,
  academicField: string,
  language: string = 'English'
): Promise<string[]> {
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: THESIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `
Generate chapter suggestions in ${language} for an academic thesis that feel naturally conceived.

Topic: ${topic}
Academic Field: ${academicField}

Suggest 5-7 logical chapters that would naturally flow in this thesis. Think like a graduate student planning their research structure — showing genuine intellectual engagement rather than following a rigid template.

Consider:
- How would a researcher naturally approach this topic?
- What logical progression would make sense for investigating this subject?
- How can chapter titles reflect authentic academic thinking?
- What balance of breadth and depth would be appropriate?

Vary the length and complexity of chapter titles naturally — some can be more direct, others more analytical or descriptive. Avoid overly formulaic titles that all follow the same pattern.

Format: Return only the chapter titles, one per line, without numbers or bullet points.
      `.trim(),
    },
  ];

  const response = await callDeepSeek(messages, { temperature: 0.7, max_tokens: 1024 });
  
  return response
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.match(/^\d+\./));
}

// Generate chapter outline (subheadings)
export async function generateChapterOutline(
  chapterTitle: string,
  topic: string,
  language: string = 'English'
): Promise<string[]> {
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: THESIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `
Generate academic subheadings in ${language} for this chapter that sound natural and human-crafted.

Chapter: "${chapterTitle}"
Research Topic: "${topic}"

Create exactly 5 subheadings that feel like they were written by a thoughtful researcher:
- Use 4-8 words each, but vary the length naturally
- Employ appropriate academic terminology without being overly dense
- Show natural progression of ideas rather than rigid structure
- Vary in complexity and focus — some direct, some more analytical
- Reflect how a researcher would actually organize this chapter
- Avoid formulaic patterns like "Overview of..." "Analysis of..." "Discussion of..."
- Use varied phrasing styles — some can be more descriptive, others more action-oriented

Think about how ideas would naturally flow in this chapter and create subheadings that feel organic to that development.

Return only the 5 numbered subheadings (1-5), without explanations.
      `.trim(),
    },
  ];

  const response = await callDeepSeek(messages, { temperature: 0.7, max_tokens: 512 });
  
  return response
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(line => line.length > 0)
    .slice(0, 5);
}

// Generate section content
export async function generateSectionContent(
  sectionTitle: string,
  chapterTitle: string,
  thesisTitle: string,
  academicField: string,
  writingStyle: string,
  previousContext: string = '',
  language: string = 'English',
  wordTarget: string = '800-1200'
): Promise<string> {
  // Build context instruction if we have previous content
  const contextInstruction = previousContext 
    ? `
## AVOID REPETITION - CRITICAL
The following content has already been written in previous sections. DO NOT repeat any of these ideas, arguments, or examples. Cover NEW aspects only:

---PREVIOUS CONTENT START---
${previousContext.slice(0, 3000)}
---PREVIOUS CONTENT END---

IMPORTANT: Ensure your content is COMPLETELY UNIQUE and does not restate any of the above. Focus on NEW angles, different examples, and fresh perspectives specific to this section.
`
    : '';

  // Writing style specific instructions
  const styleInstructions = getWritingStyleInstructions(writingStyle);

  const messages: DeepSeekMessage[] = [
    { role: 'system', content: THESIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `
Write in ${language}. Create detailed academic content for this specific section/subheading.

Section/Subheading: ${sectionTitle}
Chapter: ${chapterTitle}
Research Topic: ${thesisTitle}
Academic Field: ${academicField}
Writing Style: ${writingStyle}
${contextInstruction}
IMPORTANT: You are writing ONLY the content for this specific section. Do NOT include:
- Chapter headers (like "Chapter 3:" or "## Chapter")
- Section numbers or prefixes
- Table of contents
- Introduction to the section

Write ${wordTarget} words of pure academic content that directly addresses this specific section topic.

## WRITING STYLE REQUIREMENTS
${styleInstructions}

## CONTENT REQUIREMENTS

### ACADEMIC DEPTH FOR ${academicField.toUpperCase()}
- Provide in-depth analysis specific to this section topic within ${academicField}
- Include relevant theories, frameworks, or methodologies from ${academicField}
- Present evidence-based arguments and reasoning appropriate to ${academicField}
- Use terminology and concepts standard in ${academicField}
- Maintain scholarly rigor throughout

### STRUCTURE & FLOW
- Start directly with substantive content (no introductory phrases like "This section explores...")
- Use clear paragraph structure with logical progression
- Include relevant academic citations and references
- Connect ideas cohesively within the section scope

### PROFESSIONAL QUALITY
- Use precise academic terminology appropriate to ${academicField}
- Include specific examples or case studies where relevant
- Present balanced perspectives on complex issues
- Maintain objectivity while showing critical thinking

Write as an expert ${academicField} researcher would - with authority, nuance, and genuine academic insight specific to this section topic.
      `.trim(),
    },
  ];

  return callDeepSeek(messages);
}

// Generate introduction
export async function generateIntroduction(
  topic: string,
  chapters: string[],
  writingStyle: string,
  language: string = 'English',
  wordTarget: string = '1000-1500'
): Promise<string> {
  const styleInstructions = getWritingStyleInstructions(writingStyle);
  
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: THESIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `
Write in ${language}. Create a comprehensive academic introduction chapter that reads naturally and authentically.

Topic: ${topic}
Writing Style: ${writingStyle}
Chapters to be covered: ${chapters.join(', ')}

## WRITING STYLE REQUIREMENTS
${styleInstructions}

Create an introduction that flows naturally through these elements (don't treat them as rigid sections):
- Background and context of the research area
- The specific problem or gap your research addresses
- Your research objectives and questions
- Why this research matters and its potential contributions
- A brief overview of your approach and chapter structure

Target length: ${wordTarget} words of naturally flowing academic prose that feels authored by a thoughtful human researcher, not generated by AI.
      `.trim(),
    },
  ];

  return callDeepSeek(messages, { max_tokens: 4096 });
}

// Generate conclusion
export async function generateConclusion(
  topic: string,
  chapters: string[],
  writingStyle: string,
  language: string = 'English',
  wordTarget: string = '1000-1500'
): Promise<string> {
  const styleInstructions = getWritingStyleInstructions(writingStyle);
  
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: THESIS_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `
Write in ${language}. Create a comprehensive conclusion chapter for an academic thesis.

Topic: ${topic}
Writing Style: ${writingStyle}
Chapters covered: ${chapters.join(', ')}

## WRITING STYLE REQUIREMENTS
${styleInstructions}

Create a conclusion that naturally addresses:
- Summary of key findings and insights from each chapter
- How the research objectives were achieved
- Contributions to the field
- Practical implications
- Limitations of the study
- Recommendations for future research

Target length: ${wordTarget} words. Write naturally and reflectively, as a researcher would conclude their work after months of study.
      `.trim(),
    },
  ];

  return callDeepSeek(messages, { max_tokens: 3072 });
}

// Generate table data
export async function generateTableData(
  topic: string,
  chapterTitle: string,
  academicField: string,
  contentPreview: string
): Promise<{
  caption: string;
  columns: string[];
  rows: string[][];
  source: string;
}> {
  const messages: DeepSeekMessage[] = [
    { 
      role: 'system', 
      content: 'You are an academic data analyst creating tables for research papers. Return ONLY valid JSON.' 
    },
    {
      role: 'user',
      content: `
Create an academic data table for this thesis chapter. Analyze the chapter information and create a relevant table.

Chapter Title: "${chapterTitle}"
Topic: ${topic}
Academic Field: ${academicField}
Chapter Content Preview: ${contentPreview.slice(0, 500)}...

Task: Generate a realistic academic data table that directly supports the chapter content. The table should:

1. Be directly relevant to the chapter topic and content
2. Include realistic data that could be found in academic research
3. Have 3-5 meaningful column headers
4. Contain 5-8 rows of data
5. Use appropriate data types (numbers, percentages, categories, etc.)
6. Have a descriptive caption that explains what the table shows

Return ONLY valid JSON with this exact structure:
{
  "caption": "Descriptive table title that explains what data is shown",
  "columns": ["Column1", "Column2", "Column3", "Column4"],
  "rows": [
    ["DataPoint1", "Value1", "Metric1", "Status1"],
    ["DataPoint2", "Value2", "Metric2", "Status2"],
    ["DataPoint3", "Value3", "Metric3", "Status3"]
  ],
  "source": "Academic source or study name that this data represents"
}

Make the data realistic and academically appropriate. Include a credible academic source name.
      `.trim(),
    },
  ];

  const response = await callDeepSeek(messages, { temperature: 0.5, max_tokens: 1024 });
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid table JSON response');
  
  return JSON.parse(jsonMatch[0]);
}

// Generate chart data
export async function generateChartData(
  topic: string,
  chapterTitle: string,
  academicField: string,
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
): Promise<{
  caption: string;
  type: string;
  labels: string[];
  data: number[];
  xlabel: string;
  ylabel: string;
  source: string;
}> {
  const messages: DeepSeekMessage[] = [
    { 
      role: 'system', 
      content: 'You are an academic data analyst creating charts for research papers. Return ONLY valid JSON.' 
    },
    {
      role: 'user',
      content: `
Create a ${chartType.toUpperCase()} chart for this thesis chapter.

Chapter Title: "${chapterTitle}"
Topic: ${topic}
Academic Field: ${academicField}

Task: Generate realistic ${chartType.toUpperCase()} chart data that directly supports the chapter content.

Chart Type Guidelines:
- BAR: for comparing discrete categories or values
- LINE: for showing trends, changes, or progression over time
- PIE: for showing proportions, percentages (ensure data adds to 100%)
- AREA: for cumulative data or filled trends over time
- SCATTER: for showing relationships between two variables

IMPORTANT: Keep all text SHORT to prevent overlap in visualizations:
- Caption: Maximum 50 characters
- X/Y labels: Maximum 15 characters each
- Data labels: Maximum 12 characters each

Return ONLY valid JSON with this exact structure:
{
  "caption": "Short descriptive chart title",
  "type": "${chartType}",
  "labels": ["Short1", "Short2", "Short3", "Short4"],
  "data": [23.5, 45.2, 67.8, 34.1],
  "xlabel": "Short X-axis",
  "ylabel": "Short Y-axis",
  "source": "Author's analysis"
}
      `.trim(),
    },
  ];

  const response = await callDeepSeek(messages, { temperature: 0.5, max_tokens: 512 });
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid chart JSON response');
  
  return JSON.parse(jsonMatch[0]);
}

// Check if chapter should skip tables/charts
export function isNonDataChapter(chapterTitle: string): boolean {
  const title = chapterTitle.toLowerCase().trim();
  return (
    title.includes('introduction') ||
    title.includes('conclusion') ||
    title.includes('references') ||
    title.includes('bibliography') ||
    title.includes('abstract') ||
    title.includes('acknowledgment') ||
    title.includes('preface') ||
    title.includes('foreword')
  );
}

// Generate academic references
export async function generateReferences(
  topic: string,
  chapterTitles: string[],
  academicField: string,
  language: string = 'English',
  citationStyle: string = 'APA'
): Promise<string> {
  const messages: DeepSeekMessage[] = [
    { 
      role: 'system', 
      content: `You are an academic librarian and research expert. Generate realistic academic references that could plausibly exist for the given thesis topic. Use ${citationStyle} citation format.` 
    },
    {
      role: 'user',
      content: `
Generate a comprehensive references section for an academic thesis. Write in ${language}.

Thesis Topic: ${topic}
Academic Field: ${academicField}
Chapters covered: ${chapterTitles.join(', ')}

Generate 15-25 realistic academic references that would support this thesis, including:

1. **Foundational Works** (4-6 references)
   - Seminal texts and influential books in the field
   - Classic journal articles that established key concepts
   
2. **Recent Research** (6-10 references)
   - Recent peer-reviewed journal articles (2019-2024)
   - Contemporary studies addressing current issues in the field
   
3. **Methodological Sources** (2-4 references)
   - Research methodology books or articles
   - Statistical or qualitative analysis guides
   
4. **Supporting Materials** (3-5 references)
   - Government reports, white papers, or official documents
   - Industry reports or organizational publications
   - Conference proceedings

Format each reference correctly in ${citationStyle} style. Include:
- Author names (realistic academic names)
- Publication year
- Article/book titles relevant to the topic
- Journal names (use real academic journals in the field)
- Volume, issue, page numbers (for articles)
- Publisher information (for books)
- DOIs where appropriate (formatted as https://doi.org/...)

Organize references alphabetically by author's last name.
Begin with "## References" heading.
      `.trim(),
    },
  ];

  return callDeepSeek(messages, { max_tokens: 4096, temperature: 0.7 });
}

// Generate academic footnotes for a chapter
export async function generateFootnotes(
  chapterTitle: string,
  chapterContent: string,
  academicField: string,
  language: string = 'English'
): Promise<{
  footnotes: {
    marker: string;
    source: string;
    page?: string;
  }[];
}> {
  const messages: DeepSeekMessage[] = [
    { 
      role: 'system', 
      content: 'You are an academic research expert creating scholarly footnotes with proper citations. Return ONLY valid JSON.' 
    },
    {
      role: 'user',
      content: `
Generate academic footnotes for this thesis chapter. Analyze the content and create relevant scholarly citations.

Chapter Title: "${chapterTitle}"
Academic Field: ${academicField}
Language: ${language}

Chapter Content Preview:
${chapterContent.slice(0, 2000)}...

Task: Generate 2-4 realistic academic footnotes that would support key claims in this chapter.

Each footnote should:
1. Reference a real or realistic academic source (book, journal article, or study)
2. Include proper author names (First Initial. Surname format)
3. Include publication title, publisher/journal, year, and page number
4. Be relevant to the chapter's academic content
5. Follow academic citation conventions

Return ONLY valid JSON with this exact structure:
{
  "footnotes": [
    {
      "marker": "Brief description of what this footnote references (3-6 words)",
      "source": "A. Surname, B. Author, Full Publication Title, Publisher/Journal Name, Year, vol. X(X), p. XX.",
      "page": "45"
    },
    {
      "marker": "Another key concept referenced",
      "source": "C. Scholar, Book or Article Title, Publisher, Year, p. XX.",
      "page": "128"
    }
  ]
}

Make sources academically credible and appropriate for ${academicField}. Use realistic author names, well-known publishers, and established journals in the field.
      `.trim(),
    },
  ];

  const response = await callDeepSeek(messages, { temperature: 0.6, max_tokens: 1024 });
  
  // Extract JSON from response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Return default footnotes if parsing fails
    return {
      footnotes: [
        {
          marker: "Foundational theory",
          source: `J. Creswell, Research Design: Qualitative and Quantitative Approaches, Sage Publications, 2014, p. 89.`,
          page: "89"
        },
        {
          marker: "Methodological framework",
          source: `R. Yin, Case Study Research: Design and Methods, Sage Publications, 2014, p. 45.`,
          page: "45"
        }
      ]
    };
  }
  
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      footnotes: [
        {
          marker: "Academic reference",
          source: `A. Osterwalder, Y. Pigneur, Business Model Generation, John Wiley and Sons, 2010, p. 14.`,
          page: "14"
        }
      ]
    };
  }
}
