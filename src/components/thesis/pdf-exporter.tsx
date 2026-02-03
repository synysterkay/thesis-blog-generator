'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface Chapter {
  chapter_number: number;
  title: string;
  content: string | null;
}

interface TableData {
  caption?: string;
  columns: string[];
  rows: string[][];
  source?: string;
  section?: string;
}

interface ChartData {
  caption?: string;
  type: string;
  labels: string[];
  data: number[];
  xlabel?: string;
  ylabel?: string;
  source?: string;
  section?: string;
}

interface GeneratedFootnote {
  marker: string;
  source: string;
  page?: string;
}

interface ThesisData {
  title: string;
  academic_field?: string;
  topic?: string;
  chapters: Chapter[];
}

interface PDFExporterProps {
  thesis: ThesisData;
  onComplete: () => void;
  onError: (error: string) => void;
}

function toRoman(num: number): string {
  const val = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let roman = '';
  for (let i = 0; num > 0; i++) {
    while (num >= val[i]) { roman += syms[i]; num -= val[i]; }
  }
  return roman;
}

// Fetch footnotes from DeepSeek API
async function fetchFootnotesFromAPI(
  chapterTitle: string,
  chapterContent: string,
  academicField: string
): Promise<GeneratedFootnote[]> {
  try {
    const response = await fetch('/api/generate-footnotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chapterTitle,
        chapterContent,
        academicField,
        language: 'English'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch footnotes');
    }

    const data = await response.json();
    return data.footnotes || [];
  } catch (error) {
    console.error('Footnote API error:', error);
    // Return fallback footnotes if API fails
    return [
      {
        marker: 'Theoretical framework',
        source: 'J. Creswell, Research Design: Qualitative and Quantitative Approaches, Sage Publications, 2014, p. 89.',
        page: '89'
      },
      {
        marker: 'Methodological considerations',
        source: 'R. Yin, Case Study Research: Design and Methods, Sage Publications, 2014, p. 45.',
        page: '45'
      }
    ];
  }
}

interface ParsedContent {
  sections: { type: 'heading' | 'subheading' | 'paragraph'; level?: number; text: string }[];
  tables?: TableData[];
  charts?: ChartData[];
}

function getChapterContent(chapter: Chapter): ParsedContent {
  if (!chapter.content) return { sections: [] };
  try {
    const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
    let text = data?.text || '';
    
    // Debug: Log what we parsed
    console.log('📊 Chapter:', chapter.title);
    console.log('  - Has tables:', data?.tables ? data.tables.length : 0);
    console.log('  - Has charts:', data?.charts ? data.charts.length : 0);
    if (data?.tables) console.log('  - Tables data:', JSON.stringify(data.tables).slice(0, 200));
    if (data?.charts) console.log('  - Charts data:', JSON.stringify(data.charts).slice(0, 200));
    
    // Parse sections with hierarchy
    const sections: { type: 'heading' | 'subheading' | 'paragraph'; level?: number; text: string }[] = [];
    const lines = text.split('\n');
    let currentParagraph = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        if (currentParagraph.trim()) {
          sections.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        continue;
      }
      
      // Check for markdown headings
      const h2Match = trimmed.match(/^##\s+(.+)$/);
      const h3Match = trimmed.match(/^###\s+(.+)$/);
      const h4Match = trimmed.match(/^####\s+(.+)$/);
      
      if (h2Match) {
        if (currentParagraph.trim()) {
          sections.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        sections.push({ type: 'heading', level: 2, text: h2Match[1].replace(/\*\*/g, '') });
      } else if (h3Match) {
        if (currentParagraph.trim()) {
          sections.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        sections.push({ type: 'subheading', level: 3, text: h3Match[1].replace(/\*\*/g, '') });
      } else if (h4Match) {
        if (currentParagraph.trim()) {
          sections.push({ type: 'paragraph', text: currentParagraph.trim() });
          currentParagraph = '';
        }
        sections.push({ type: 'subheading', level: 4, text: h4Match[1].replace(/\*\*/g, '') });
      } else {
        // Clean bold markers and add to paragraph
        const cleaned = trimmed.replace(/\*\*(.+?)\*\*/g, '$1');
        currentParagraph += (currentParagraph ? ' ' : '') + cleaned;
      }
    }
    
    if (currentParagraph.trim()) {
      sections.push({ type: 'paragraph', text: currentParagraph.trim() });
    }
    
    return { 
      sections, 
      tables: data?.tables,
      charts: data?.charts 
    };
  } catch {
    const text = typeof chapter.content === 'string' ? chapter.content : '';
    return { sections: [{ type: 'paragraph', text }] };
  }
}

function renderTable(table: TableData, index: number): string {
  // Safety check for table data
  if (!table || !table.columns || !table.rows || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
    console.warn('Invalid table data:', table);
    return '';
  }

  const headerColors = ['#D9E2F3', '#E2EFDA', '#FFF2CC', '#FCE4D6', '#DEEBF7'];
  const headerColor = headerColors[index % headerColors.length];
  
  return `
    <div style="margin: 25px 0; page-break-inside: avoid;">
      <p style="font-weight: bold; margin-bottom: 12px; text-align: center; font-size: 11pt;">
        Table ${index + 1}. ${table.caption || 'Data Table'}
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 10pt; margin: 0 auto;">
        <thead>
          <tr style="background-color: ${headerColor};">
            ${table.columns.map(col => `
              <th style="padding: 8px 10px; text-align: center; border: 0.5pt solid black; font-weight: bold;">
                ${col || ''}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${table.rows.map((row) => `
            <tr>
              ${(Array.isArray(row) ? row : []).map(cell => `
                <td style="padding: 6px 10px; text-align: center; border: 0.5pt solid black;">
                  ${cell || ''}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      <p style="font-size: 10pt; margin-top: 8px; text-align: left;">
        Source: ${table.source || "author's own study based on research data."}
      </p>
    </div>
  `;
}

function renderChart(chart: ChartData, index: number): string {
  // Safety check for chart data
  if (!chart || !chart.labels || !chart.data || !Array.isArray(chart.labels) || !Array.isArray(chart.data)) {
    console.warn('Invalid chart data:', chart);
    return '';
  }

  const maxValue = Math.max(...chart.data);
  const colors = ['#4472C4', '#ED7D31', '#A5A5A5', '#FFC000', '#5B9BD5', '#70AD47'];
  
  if (chart.type === 'pie' || chart.type === 'doughnut') {
    const total = chart.data.reduce((a, b) => a + b, 0);
    if (total === 0) return '';
    
    return `
      <div style="margin: 25px 0; page-break-inside: avoid;">
        <p style="font-weight: bold; margin-bottom: 12px; text-align: center; font-size: 11pt;">
          Figure ${index + 1}. ${chart.caption || 'Distribution Chart'}
        </p>
        <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 4px;">
          <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 15px;">
            ${chart.labels.map((label, i) => {
              const percentage = ((chart.data[i] / total) * 100).toFixed(1);
              return `
                <div style="display: flex; align-items: center; gap: 8px; min-width: 150px;">
                  <div style="width: 16px; height: 16px; background: ${colors[i % colors.length]}; border-radius: 2px;"></div>
                  <span style="font-size: 10pt;"><strong>${label || ''}:</strong> ${percentage}%</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <p style="font-size: 10pt; margin-top: 8px; text-align: left;">
          Source: ${chart.source || "author's own study based on research data."}
        </p>
      </div>
    `;
  }
  
  // Bar/Line chart representation
  return `
    <div style="margin: 25px 0; page-break-inside: avoid;">
      <p style="font-weight: bold; margin-bottom: 12px; text-align: center; font-size: 11pt;">
        Figure ${index + 1}. ${chart.caption || 'Data Visualization'}
      </p>
      <div style="background: white; padding: 20px; border: 1px solid #ddd; border-radius: 4px;">
        ${chart.labels.map((label, i) => {
          const width = maxValue > 0 ? (chart.data[i] / maxValue) * 100 : 0;
          return `
            <div style="margin: 10px 0; display: flex; align-items: center;">
              <span style="width: 120px; font-size: 10pt; text-align: right; padding-right: 10px;">${label || ''}</span>
              <div style="flex: 1; background: #f0f0f0; height: 22px; border-radius: 3px; overflow: hidden;">
                <div style="width: ${width}%; background: ${colors[i % colors.length]}; height: 100%; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; min-width: 40px;">
                  <span style="color: white; font-size: 9pt; font-weight: bold;">${chart.data[i] || 0}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <p style="font-size: 10pt; margin-top: 8px; text-align: left;">
        Source: ${chart.source || "author's own study based on research data."}
      </p>
    </div>
  `;
}

function renderFootnotesSection(footnotes: { num: number; source: string }[]): string {
  if (footnotes.length === 0) return '';
  
  return `
    <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid black; width: 100%;">
      ${footnotes.map(fn => `
        <p style="font-size: 10pt; line-height: 1.5; margin: 6px 0; text-align: justify;">
          <sup style="font-size: 8pt;">${fn.num}</sup> ${fn.source}
        </p>
      `).join('')}
    </div>
  `;
}

export function PDFExporter({ thesis, onComplete, onError }: PDFExporterProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading-footnotes' | 'generating-pdf' | 'done'>('loading-footnotes');
  const [chapterFootnotes, setChapterFootnotes] = useState<Map<number, GeneratedFootnote[]>>(new Map());

  const year = new Date().getFullYear();
  const field = thesis.academic_field || 'General Studies';

  // First, fetch all footnotes from DeepSeek API
  useEffect(() => {
    const fetchAllFootnotes = async () => {
      const footnotesMap = new Map<number, GeneratedFootnote[]>();
      
      for (let i = 0; i < thesis.chapters.length; i++) {
        const chapter = thesis.chapters[i];
        const { sections } = getChapterContent(chapter);
        
        // Extract text from sections for footnote generation
        const text = sections
          .filter(s => s.type === 'paragraph')
          .map(s => s.text)
          .join('\n\n');
        
        if (text) {
          const footnotes = await fetchFootnotesFromAPI(
            chapter.title,
            text,
            field
          );
          footnotesMap.set(i, footnotes);
        }
      }
      
      setChapterFootnotes(footnotesMap);
      setStatus('generating-pdf');
    };

    fetchAllFootnotes();
  }, [thesis, field]);

  // Then generate PDF once footnotes are ready
  useEffect(() => {
    if (status !== 'generating-pdf') return;

    const generatePDF = async () => {
      try {
        const html2pdf = (await import('html2pdf.js')).default;
        
        if (!contentRef.current) {
          throw new Error('Content not ready');
        }

        // Small delay to ensure content with footnotes is rendered
        await new Promise(resolve => setTimeout(resolve, 300));

        const element = contentRef.current;
        const filename = `${thesis.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`;

        const opt = {
          margin: [20, 15, 20, 15] as [number, number, number, number],
          filename,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
          jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
          pagebreak: { mode: 'avoid-all' as const, before: '.page-break' }
        };

        await html2pdf().set(opt).from(element).save();
        
        setStatus('done');
        onComplete();
      } catch (err) {
        console.error('PDF generation error:', err);
        onError(err instanceof Error ? err.message : 'PDF generation failed');
      }
    };

    generatePDF();
  }, [status, thesis, onComplete, onError]);

  // Global counters for tables and figures
  let globalTableIndex = 0;
  let globalChartIndex = 0;
  let globalFootnoteIndex = 0;

  // Collect all tables and figures for lists
  const allTables: { caption: string; chapter: number }[] = [];
  const allFigures: { caption: string; chapter: number }[] = [];

  thesis.chapters.forEach((chapter, i) => {
    const { tables, charts } = getChapterContent(chapter);
    if (tables) {
      tables.forEach(t => allTables.push({ caption: t.caption || 'Data Table', chapter: i + 1 }));
    }
    if (charts) {
      charts.forEach(c => allFigures.push({ caption: c.caption || 'Chart', chapter: i + 1 }));
    }
  });

  // Collect all footnotes for references
  const allFootnoteSources: string[] = [];
  chapterFootnotes.forEach((footnotes) => {
    footnotes.forEach(fn => {
      if (!allFootnoteSources.includes(fn.source)) {
        allFootnoteSources.push(fn.source);
      }
    });
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-xl">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-gray-700">
          {status === 'loading-footnotes' 
            ? 'Generating academic footnotes...' 
            : 'Creating PDF document...'}
        </span>
      </div>

      {/* Hidden content for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div 
          ref={contentRef} 
          style={{ 
            width: '180mm', 
            maxWidth: '180mm',
            fontFamily: 'Times New Roman, serif', 
            fontSize: '12pt', 
            lineHeight: '1.6', 
            color: '#000',
            background: 'white',
            boxSizing: 'border-box'
          }}
        >
          
          {/* ===== TITLE PAGE ===== */}
          <div style={{ 
            minHeight: '260mm', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            textAlign: 'center', 
            padding: '20px',
            boxSizing: 'border-box'
          }}>
            <div style={{ marginBottom: '60px' }}>
              <p style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0' }}>UNIVERSITY</p>
              <p style={{ fontSize: '12pt', margin: '5px 0' }}>Faculty of Applied Sciences</p>
              <p style={{ fontSize: '12pt', margin: '5px 0' }}>Field of study: {field}</p>
            </div>
            
            <div style={{ margin: '40px 0' }}>
              <p style={{ fontSize: '12pt', margin: '10px 0' }}>THESIS</p>
            </div>
            
            <h1 style={{ 
              fontSize: '16pt', 
              fontWeight: 'bold', 
              margin: '30px 40px', 
              lineHeight: '1.6',
              textTransform: 'uppercase'
            }}>
              {thesis.title}
            </h1>
            
            <div style={{ marginTop: '80px' }}>
              <p style={{ fontSize: '12pt' }}>Thesis written under supervision</p>
            </div>
            
            <p style={{ marginTop: '100px', fontSize: '12pt' }}>{year}</p>
          </div>

          {/* ===== STATEMENT PAGE ===== */}
          <div className="page-break" style={{ padding: '10px', minHeight: '250mm' }}>
            <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '50px' }}>
              STATEMENT
            </h2>
            <p style={{ 
              textIndent: '1.25cm', 
              textAlign: 'justify', 
              lineHeight: '1.8',
              marginBottom: '20px'
            }}>
              Aware of my responsibility, I hereby declare that the thesis submitted was entirely 
              written by myself. I also declare that this work has not been submitted in the same 
              or similar form for obtaining a diploma or a degree from any educational institution.
            </p>
            <p style={{ 
              textIndent: '1.25cm', 
              textAlign: 'justify', 
              lineHeight: '1.8',
              marginBottom: '20px'
            }}>
              Furthermore, I declare that all sources used in the preparation of this thesis have 
              been properly cited and referenced in accordance with academic standards.
            </p>
            <div style={{ marginTop: '100px', textAlign: 'right', paddingRight: '40px' }}>
              <p style={{ marginBottom: '5px' }}>____________________________</p>
              <p style={{ fontSize: '10pt', fontStyle: 'italic' }}>Author&apos;s signature</p>
            </div>
          </div>

          {/* ===== ABSTRACT ===== */}
          {thesis.topic && (
            <div className="page-break" style={{ padding: '10px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
                ABSTRACT
              </h2>
              <p style={{ 
                textIndent: '1.25cm', 
                textAlign: 'justify', 
                lineHeight: '1.8'
              }}>
                {thesis.topic}
              </p>
            </div>
          )}

          {/* ===== TABLE OF CONTENTS ===== */}
          <div className="page-break" style={{ padding: '10px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
              TABLE OF CONTENTS
            </h2>
            
            <p style={{ margin: '10px 0' }}>INTRODUCTION</p>
            
            {thesis.chapters.map((ch, i) => (
              <div key={i}>
                <p style={{ margin: '10px 0', fontWeight: 'bold' }}>
                  CHAPTER {toRoman(i + 1)}. {ch.title.toUpperCase()}
                </p>
              </div>
            ))}
            
            <p style={{ margin: '10px 0' }}>CONCLUSIONS</p>
            <p style={{ margin: '10px 0' }}>REFERENCES</p>
            {allTables.length > 0 && <p style={{ margin: '10px 0' }}>LIST OF TABLES</p>}
            {allFigures.length > 0 && <p style={{ margin: '10px 0' }}>LIST OF FIGURES</p>}
          </div>

          {/* ===== INTRODUCTION ===== */}
          <div className="page-break" style={{ padding: '10px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '30px' }}>
              INTRODUCTION
            </h2>
            <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
              This thesis examines {thesis.title.toLowerCase()} within the context of {field.toLowerCase()}. 
              The research addresses key questions and challenges in this domain, providing both theoretical 
              analysis and practical insights.
            </p>
            <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
              The primary objective of this study is to analyze and evaluate the various aspects related 
              to the research topic. Through comprehensive literature review and methodological analysis, 
              this work aims to contribute to the existing body of knowledge.
            </p>
            <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
              The thesis is structured into {thesis.chapters.length} main chapters, each addressing specific 
              aspects of the research question. The methodology employed combines qualitative and quantitative 
              approaches to ensure comprehensive coverage of the subject matter.
            </p>
          </div>

          {/* ===== CHAPTERS ===== */}
          {thesis.chapters.map((chapter, i) => {
            const { sections, tables, charts } = getChapterContent(chapter);
            const chapterNum = i + 1;
            
            // Skip footnotes for References chapter
            const isReferencesChapter = chapter.title.toLowerCase().includes('reference');
            
            // Get AI-generated footnotes for this chapter (skip for references)
            const footnotes = isReferencesChapter ? [] : (chapterFootnotes.get(i) || []);
            const footnoteRefs: { num: number; source: string }[] = [];
            
            // Count paragraphs for footnote placement
            const paragraphIndices = sections
              .map((s, idx) => s.type === 'paragraph' ? idx : -1)
              .filter(idx => idx !== -1);
            const footnoteInsertPoints = paragraphIndices.length > 3 
              ? [paragraphIndices[Math.floor(paragraphIndices.length / 3)], paragraphIndices[Math.floor(2 * paragraphIndices.length / 3)]]
              : [paragraphIndices[Math.max(0, paragraphIndices.length - 1)]];
            
            // Track subheading numbers within chapter
            let headingCounter = 0;
            let subheadingCounter = 0;
            
            // Track current section name for inline table/chart placement
            let currentSectionName = '';
            
            // Helper to find table for a section
            const getTableForSection = (sectionName: string) => {
              return tables?.find(t => t.section === sectionName);
            };
            
            // Helper to find chart for a section
            const getChartForSection = (sectionName: string) => {
              return charts?.find(c => c.section === sectionName);
            };
            
            return (
              <div key={i} className="page-break" style={{ padding: '10px' }}>
                {/* Chapter Header */}
                <h2 style={{ 
                  textAlign: 'center', 
                  fontSize: '16pt', 
                  fontWeight: 'bold',
                  marginBottom: '10px' 
                }}>
                  CHAPTER {toRoman(chapterNum)}
                </h2>
                <h3 style={{ 
                  textAlign: 'center', 
                  fontSize: '14pt',
                  fontWeight: 'bold', 
                  marginBottom: '30px',
                  textTransform: 'uppercase'
                }}>
                  {chapter.title}
                </h3>
                
                {/* Chapter Content with Hierarchy, Footnotes, and Inline Tables/Charts */}
                {sections.map((section, j) => {
                  // Check if we should add a footnote reference to this paragraph
                  const shouldAddFootnote = !isReferencesChapter && 
                    section.type === 'paragraph' && 
                    footnoteInsertPoints.includes(j) && 
                    footnotes[footnoteInsertPoints.indexOf(j)];
                  
                  if (shouldAddFootnote) {
                    globalFootnoteIndex++;
                    const fnIndex = footnoteInsertPoints.indexOf(j);
                    const fnData = footnotes[fnIndex];
                    footnoteRefs.push({ num: globalFootnoteIndex, source: fnData.source });
                  }
                  
                  if (section.type === 'heading') {
                    // Before rendering new heading, check if previous section had table/chart
                    const prevSectionTable = currentSectionName ? getTableForSection(currentSectionName) : null;
                    const prevSectionChart = currentSectionName ? getChartForSection(currentSectionName) : null;
                    
                    headingCounter++;
                    subheadingCounter = 0;
                    currentSectionName = section.text;
                    
                    return (
                      <div key={j}>
                        {/* Render table/chart from previous section */}
                        {prevSectionTable && (() => {
                          globalTableIndex++;
                          const html = renderTable(prevSectionTable, globalTableIndex - 1);
                          return <div dangerouslySetInnerHTML={{ __html: html }} />;
                        })()}
                        {prevSectionChart && (() => {
                          globalChartIndex++;
                          const html = renderChart(prevSectionChart, globalChartIndex - 1);
                          return <div dangerouslySetInnerHTML={{ __html: html }} />;
                        })()}
                        
                        <h4 
                          style={{ 
                            fontSize: '13pt', 
                            fontWeight: 'bold', 
                            marginTop: '25px',
                            marginBottom: '15px',
                            textAlign: 'left'
                          }}
                        >
                          {chapterNum}.{headingCounter}. {section.text}
                        </h4>
                      </div>
                    );
                  }
                  
                  if (section.type === 'subheading') {
                    subheadingCounter++;
                    const headingNum = headingCounter || 1;
                    currentSectionName = section.text;
                    return (
                      <h5 
                        key={j} 
                        style={{ 
                          fontSize: '12pt', 
                          fontWeight: 'bold', 
                          marginTop: '20px',
                          marginBottom: '12px',
                          textAlign: 'left',
                          fontStyle: section.level === 4 ? 'italic' : 'normal'
                        }}
                      >
                        {chapterNum}.{headingNum}.{subheadingCounter}. {section.text}
                      </h5>
                    );
                  }
                  
                  return (
                    <p 
                      key={j} 
                      style={{ 
                        textIndent: '1.25cm', 
                        textAlign: 'justify', 
                        lineHeight: '1.8', 
                        marginBottom: '14px' 
                      }}
                    >
                      {section.text}
                      {shouldAddFootnote && (
                        <sup style={{ fontSize: '9pt', color: '#000' }}>{globalFootnoteIndex}</sup>
                      )}
                    </p>
                  );
                })}

                {/* Render table/chart for the last section */}
                {(() => {
                  const lastSectionTable = currentSectionName ? getTableForSection(currentSectionName) : null;
                  const lastSectionChart = currentSectionName ? getChartForSection(currentSectionName) : null;
                  
                  return (
                    <>
                      {lastSectionTable && (() => {
                        globalTableIndex++;
                        const html = renderTable(lastSectionTable, globalTableIndex - 1);
                        return <div dangerouslySetInnerHTML={{ __html: html }} />;
                      })()}
                      {lastSectionChart && (() => {
                        globalChartIndex++;
                        const html = renderChart(lastSectionChart, globalChartIndex - 1);
                        return <div dangerouslySetInnerHTML={{ __html: html }} />;
                      })()}
                    </>
                  );
                })()}

                {/* Footnotes Section (at bottom of chapter content) - skip for references */}
                {!isReferencesChapter && footnoteRefs.length > 0 && (
                  <div dangerouslySetInnerHTML={{ __html: renderFootnotesSection(footnoteRefs) }} />
                )}
              </div>
            );
          })}

          {/* ===== CONCLUSIONS ===== */}
          <div className="page-break" style={{ padding: '10px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
              CONCLUSIONS
            </h2>
            <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
              This thesis has examined the multifaceted aspects of {thesis.title.toLowerCase()}. 
              Through analysis of theoretical frameworks, practical applications, and empirical 
              observations, several key conclusions emerge.
            </p>
            <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
              The research findings support the thesis objectives and demonstrate significant 
              contributions to the field of {field.toLowerCase()}. The methodology employed 
              proved effective in addressing the research questions posed at the outset.
            </p>
            <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
              Future research directions include deeper analysis of specific aspects identified 
              during this study, as well as broader applications of the findings to related domains. 
              The limitations acknowledged in this work provide opportunities for subsequent 
              investigations.
            </p>
          </div>

          {/* ===== REFERENCES ===== */}
          <div className="page-break" style={{ padding: '10px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
              REFERENCES
            </h2>
            <div style={{ lineHeight: '1.8' }}>
              {allFootnoteSources.length > 0 ? (
                // Use AI-generated sources from footnotes
                allFootnoteSources.sort().map((source, idx) => (
                  <p key={idx} style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                    {idx + 1}. {source}
                  </p>
                ))
              ) : (
                // Fallback references if no footnotes
                <>
                  <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                    1. Creswell, J., Research Design: Qualitative and Quantitative Approaches, Sage Publications, 2014.
                  </p>
                  <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                    2. Hart, C., Doing a Literature Review, Sage Publications, 2018.
                  </p>
                  <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                    3. Osterwalder, A., Pigneur, Y., Business Model Generation, John Wiley and Sons, 2010.
                  </p>
                  <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                    4. Porter, M., Competitive Strategy, Free Press, 2008.
                  </p>
                  <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                    5. Yin, R., Case Study Research: Design and Methods, Sage Publications, 2014.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* ===== LIST OF TABLES ===== */}
          {allTables.length > 0 && (
            <div className="page-break" style={{ padding: '10px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
                LIST OF TABLES
              </h2>
              {allTables.map((table, idx) => (
                <p key={idx} style={{ margin: '8px 0' }}>
                  Table {idx + 1}. {table.caption}
                </p>
              ))}
            </div>
          )}

          {/* ===== LIST OF FIGURES ===== */}
          {allFigures.length > 0 && (
            <div className="page-break" style={{ padding: '10px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
                LIST OF FIGURES
              </h2>
              {allFigures.map((figure, idx) => (
                <p key={idx} style={{ margin: '8px 0' }}>
                  Figure {idx + 1}. {figure.caption}
                </p>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
