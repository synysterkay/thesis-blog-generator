'use client';

import { ChartRenderer, ChartTheme, ChartType } from './chart-renderer';
import { TableRenderer, TableStyle } from './table-renderer';

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
  type: ChartType;
  labels: string[];
  data: number[];
  xlabel?: string;
  ylabel?: string;
  source?: string;
  section?: string;
}

interface ThesisData {
  title: string;
  academic_field?: string;
  topic?: string;
  chapters: Chapter[];
}

interface ThesisHTMLPreviewProps {
  thesis: ThesisData;
  tableStyle?: TableStyle;
  chartTheme?: ChartTheme;
  showWatermark?: boolean;
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
        currentParagraph += ' ' + trimmed;
      }
    }
    
    if (currentParagraph.trim()) {
      sections.push({ type: 'paragraph', text: currentParagraph.trim() });
    }
    
    return {
      sections,
      tables: data?.tables,
      charts: data?.charts?.map((c: { caption?: string; type: string; labels: string[]; data: number[]; xlabel?: string; ylabel?: string; source?: string; section?: string }) => ({
        ...c,
        type: c.type as ChartType
      }))
    };
  } catch {
    return { sections: [] };
  }
}

export function ThesisHTMLPreview({ thesis, tableStyle = 'academic', chartTheme = 'academic', showWatermark = false }: ThesisHTMLPreviewProps) {
  const year = new Date().getFullYear();
  const field = thesis.academic_field || 'General Studies';
  
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
  
  // Global counters
  let globalTableIndex = 0;
  let globalChartIndex = 0;

  return (
    <div className={`thesis-preview bg-white max-w-4xl mx-auto shadow-lg relative ${showWatermark ? 'no-copy watermarked' : ''}`}>
      {/* Custom styles for thesis preview */}
      <style jsx global>{`
        .thesis-preview.watermarked::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 100;
          background: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 100px,
            rgba(37, 96, 234, 0.08) 100px,
            rgba(37, 96, 234, 0.08) 102px
          );
        }
        .thesis-preview.watermarked .watermark-text {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 101;
          overflow: hidden;
        }
        .thesis-preview {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.6;
          color: #000;
        }
        .thesis-preview.no-copy {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
        }
        .thesis-preview.no-copy * {
          user-select: none;
          -webkit-user-select: none;
        }
        .thesis-preview h1, .thesis-preview h2, .thesis-preview h3, .thesis-preview h4 {
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .thesis-preview p {
          text-align: justify;
          text-indent: 2em;
          margin-bottom: 1em;
        }
        .thesis-preview .no-indent {
          text-indent: 0;
        }
        .thesis-preview .title-page {
          min-height: 600px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: 40px;
          border-bottom: 2px solid #1e3a5f;
        }
        .thesis-preview .section {
          padding: 30px 50px;
          border-bottom: 1px solid #eee;
        }
        .thesis-preview .chapter {
          page-break-before: always;
        }
        .thesis-preview table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5em 0;
        }
        .thesis-preview table th, .thesis-preview table td {
          border: 1px solid #333;
          padding: 8px 12px;
          text-align: left;
        }
        .thesis-preview table th {
          background: #f5f5f5;
          font-weight: bold;
        }
        .thesis-preview .table-caption, .thesis-preview .figure-caption {
          font-size: 11pt;
          font-style: italic;
          text-align: center;
          margin: 0.5em 0;
        }
        .thesis-preview .footnote {
          font-size: 10pt;
          border-top: 1px solid #ccc;
          padding-top: 0.5em;
          margin-top: 2em;
        }
        .thesis-preview .footnote-ref {
          vertical-align: super;
          font-size: 0.8em;
          color: #1e3a5f;
        }
        .thesis-preview .toc-entry {
          display: flex;
          justify-content: space-between;
          margin: 0.3em 0;
          border-bottom: 1px dotted #ccc;
        }
        .thesis-preview .toc-entry span:last-child {
          flex-shrink: 0;
          padding-left: 0.5em;
        }
      `}</style>

      {/* Title Page */}
      <div className="title-page">
        <div className="text-sm uppercase tracking-widest text-slate-600 mb-8">
          Academic Thesis
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-wide">
          {thesis.title}
        </h1>
        <div className="w-24 h-0.5 bg-slate-900 my-6" />
        <div className="text-sm text-slate-600 mb-2">
          Field of Study: {field}
        </div>
        {thesis.topic && (
          <div className="text-sm text-slate-600 mb-4 max-w-md">
            Topic: {thesis.topic}
          </div>
        )}
        <div className="text-sm text-slate-600 mt-8">
          {year}
        </div>
      </div>

      {/* Abstract */}
      <div className="section">
        <h2 className="text-lg font-bold text-center uppercase tracking-wide mb-6">
          Abstract
        </h2>
        <p className="text-justify">
          This thesis presents a comprehensive exploration of {thesis.title.toLowerCase()}. 
          Through rigorous academic methodology, this work examines the key aspects and 
          implications of the research topic within the broader context of {field}. 
          The findings contribute to the existing body of knowledge and provide valuable 
          insights for future research in this domain.
        </p>
      </div>

      {/* Table of Contents */}
      <div className="section">
        <h2 className="text-lg font-bold text-center uppercase tracking-wide mb-6">
          Table of Contents
        </h2>
        <div className="space-y-1">
          <div className="toc-entry">
            <span>Abstract</span>
            <span>{toRoman(1)}</span>
          </div>
          <div className="toc-entry">
            <span>Table of Contents</span>
            <span>{toRoman(2)}</span>
          </div>
          {allTables.length > 0 && (
            <div className="toc-entry">
              <span>List of Tables</span>
              <span>{toRoman(3)}</span>
            </div>
          )}
          {allFigures.length > 0 && (
            <div className="toc-entry">
              <span>List of Figures</span>
              <span>{toRoman(allTables.length > 0 ? 4 : 3)}</span>
            </div>
          )}
          {thesis.chapters.map((chapter, i) => (
            <div key={i} className="toc-entry font-medium">
              <span>Chapter {chapter.chapter_number}: {chapter.title}</span>
              <span>{i + 1}</span>
            </div>
          ))}
          <div className="toc-entry">
            <span>References</span>
            <span>{thesis.chapters.length + 1}</span>
          </div>
        </div>
      </div>

      {/* List of Tables */}
      {allTables.length > 0 && (
        <div className="section">
          <h2 className="text-lg font-bold text-center uppercase tracking-wide mb-6">
            List of Tables
          </h2>
          <div className="space-y-1">
            {allTables.map((table, i) => (
              <div key={i} className="toc-entry">
                <span>Table {i + 1}: {table.caption}</span>
                <span>Ch. {table.chapter}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List of Figures */}
      {allFigures.length > 0 && (
        <div className="section">
          <h2 className="text-lg font-bold text-center uppercase tracking-wide mb-6">
            List of Figures
          </h2>
          <div className="space-y-1">
            {allFigures.map((figure, i) => (
              <div key={i} className="toc-entry">
                <span>Figure {i + 1}: {figure.caption}</span>
                <span>Ch. {figure.chapter}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapters */}
      {thesis.chapters.map((chapter, chapterIdx) => {
        const { sections, tables, charts } = getChapterContent(chapter);
        const chapterTables = tables || [];
        const chapterCharts = charts || [];
        
        // Track which visuals have been placed
        const placedTables = new Set<number>();
        const placedCharts = new Set<number>();
        
        return (
          <div key={chapterIdx} className="section chapter">
            <h2 className="text-xl font-bold text-center uppercase tracking-wide mb-6">
              Chapter {chapter.chapter_number}
              <br />
              <span className="text-lg">{chapter.title}</span>
            </h2>
            
            {sections.map((section, sectionIdx) => {
              // Check if we should insert a table or chart after this section
              const matchingTable = chapterTables.findIndex(
                (t, i) => !placedTables.has(i) && t.section?.toLowerCase().includes(section.text?.toLowerCase().slice(0, 30) || '')
              );
              const matchingChart = chapterCharts.findIndex(
                (c, i) => !placedCharts.has(i) && c.section?.toLowerCase().includes(section.text?.toLowerCase().slice(0, 30) || '')
              );
              
              return (
                <div key={sectionIdx}>
                  {section.type === 'heading' && (
                    <h3 className="text-base font-bold mt-6 mb-3">
                      {chapter.chapter_number}.{sectionIdx + 1} {section.text}
                    </h3>
                  )}
                  {section.type === 'subheading' && (
                    <h4 className="text-sm font-bold mt-4 mb-2 italic">
                      {section.text}
                    </h4>
                  )}
                  {section.type === 'paragraph' && (
                    <p>{section.text}</p>
                  )}
                  
                  {/* Insert table if matched */}
                  {matchingTable >= 0 && (() => {
                    placedTables.add(matchingTable);
                    globalTableIndex++;
                    const table = chapterTables[matchingTable];
                    return (
                      <div className="my-6">
                        <div className="table-caption mb-2">
                          Table {globalTableIndex}: {table.caption || 'Data Table'}
                        </div>
                        <TableRenderer
                          table={table}
                          style={tableStyle}
                          tableNumber={globalTableIndex}
                        />
                        {table.source && (
                          <div className="text-xs text-slate-500 text-center mt-1">
                            Source: {table.source}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  
                  {/* Insert chart if matched */}
                  {matchingChart >= 0 && (() => {
                    placedCharts.add(matchingChart);
                    globalChartIndex++;
                    const chart = chapterCharts[matchingChart];
                    return (
                      <div className="my-6">
                        <ChartRenderer
                          chart={chart}
                          theme={chartTheme}
                        />
                        <div className="figure-caption mt-2">
                          Figure {globalChartIndex}: {chart.caption || 'Chart'}
                        </div>
                        {chart.source && (
                          <div className="text-xs text-slate-500 text-center mt-1">
                            Source: {chart.source}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            
            {/* Place any remaining tables/charts at the end */}
            {chapterTables.map((table, i) => {
              if (placedTables.has(i)) return null;
              globalTableIndex++;
              return (
                <div key={`table-${i}`} className="my-6">
                  <div className="table-caption mb-2">
                    Table {globalTableIndex}: {table.caption || 'Data Table'}
                  </div>
                  <TableRenderer
                    table={table}
                    style={tableStyle}
                    tableNumber={globalTableIndex}
                  />
                  {table.source && (
                    <div className="text-xs text-slate-500 text-center mt-1">
                      Source: {table.source}
                    </div>
                  )}
                </div>
              );
            })}
            
            {chapterCharts.map((chart, i) => {
              if (placedCharts.has(i)) return null;
              globalChartIndex++;
              return (
                <div key={`chart-${i}`} className="my-6">
                  <ChartRenderer
                    chart={chart}
                    theme={chartTheme}
                  />
                  <div className="figure-caption mt-2">
                    Figure {globalChartIndex}: {chart.caption || 'Chart'}
                  </div>
                  {chart.source && (
                    <div className="text-xs text-slate-500 text-center mt-1">
                      Source: {chart.source}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* References */}
      <div className="section">
        <h2 className="text-lg font-bold text-center uppercase tracking-wide mb-6">
          References
        </h2>
        <p className="no-indent text-sm text-slate-600 italic">
          Academic references and citations will be included in the exported document.
        </p>
      </div>
      
      {/* Fixed watermark text overlay */}
      {showWatermark && (
        <div className="watermark-text" aria-hidden="true">
          <div 
            className="absolute w-[300%] h-[300%] -left-full -top-1/2"
            style={{ transform: 'rotate(-35deg)' }}
          >
            <div className="flex flex-wrap justify-center items-center h-full gap-x-16 gap-y-10">
              {Array.from({ length: 150 }).map((_, i) => (
                <span 
                  key={i} 
                  className="text-[#2560EA] font-bold text-xl whitespace-nowrap"
                  style={{ opacity: 0.25 }}
                >
                  THESIS GENERATOR
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
