'use client';

import { useEffect, useRef, useState } from 'react';
import { X, DownloadSimple, SpinnerGap, ArrowCounterClockwise, ArrowClockwise, FloppyDisk } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';

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
}

interface ChartData {
  caption?: string;
  type: string;
  labels: string[];
  data: number[];
  source?: string;
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

interface PDFEditorProps {
  thesis: ThesisData;
  onClose: () => void;
  onDownload: () => void;
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

interface ParsedSection {
  type: 'heading' | 'subheading' | 'paragraph';
  level?: number;
  text: string;
}

function getChapterContent(chapter: Chapter): { sections: ParsedSection[]; tables?: TableData[]; charts?: ChartData[] } {
  if (!chapter.content) return { sections: [] };
  try {
    const data = typeof chapter.content === 'string' ? JSON.parse(chapter.content) : chapter.content;
    const text = data?.text || '';
    
    const sections: ParsedSection[] = [];
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
        const cleaned = trimmed.replace(/\*\*(.+?)\*\*/g, '$1');
        currentParagraph += (currentParagraph ? ' ' : '') + cleaned;
      }
    }
    
    if (currentParagraph.trim()) {
      sections.push({ type: 'paragraph', text: currentParagraph.trim() });
    }
    
    return { sections, tables: data?.tables, charts: data?.charts };
  } catch {
    const text = typeof chapter.content === 'string' ? chapter.content : '';
    return { sections: [{ type: 'paragraph', text }] };
  }
}

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

    if (!response.ok) throw new Error('Failed to fetch footnotes');
    const data = await response.json();
    return data.footnotes || [];
  } catch {
    return [
      { marker: 'Theoretical framework', source: 'J. Creswell, Research Design, Sage Publications, 2014, p. 89.', page: '89' },
      { marker: 'Methodological approach', source: 'R. Yin, Case Study Research, Sage Publications, 2014, p. 45.', page: '45' }
    ];
  }
}

export function PDFEditor({ thesis, onClose, onDownload }: PDFEditorProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'generating'>('loading');
  const [chapterFootnotes, setChapterFootnotes] = useState<Map<number, GeneratedFootnote[]>>(new Map());
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const year = new Date().getFullYear();
  const field = thesis.academic_field || 'General Studies';

  // Fetch footnotes on load
  useEffect(() => {
    const fetchAllFootnotes = async () => {
      const footnotesMap = new Map<number, GeneratedFootnote[]>();
      
      for (let i = 0; i < thesis.chapters.length; i++) {
        const chapter = thesis.chapters[i];
        const { sections } = getChapterContent(chapter);
        const text = sections.filter(s => s.type === 'paragraph').map(s => s.text).join('\n\n');
        
        if (text) {
          const footnotes = await fetchFootnotesFromAPI(chapter.title, text, field);
          footnotesMap.set(i, footnotes);
        }
      }
      
      setChapterFootnotes(footnotesMap);
      setStatus('ready');
    };

    fetchAllFootnotes();
  }, [thesis, field]);

  // Save initial state for undo
  useEffect(() => {
    if (status === 'ready' && contentRef.current && history.length === 0) {
      setHistory([contentRef.current.innerHTML]);
      setHistoryIndex(0);
    }
  }, [status, history.length]);

  const saveToHistory = () => {
    if (!contentRef.current) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(contentRef.current.innerHTML);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0 && contentRef.current) {
      const newIndex = historyIndex - 1;
      contentRef.current.innerHTML = history[newIndex];
      setHistoryIndex(newIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1 && contentRef.current) {
      const newIndex = historyIndex + 1;
      contentRef.current.innerHTML = history[newIndex];
      setHistoryIndex(newIndex);
    }
  };

  const handleDownload = async () => {
    if (!contentRef.current) return;
    
    setStatus('generating');
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const filename = `${thesis.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}.pdf`;

      const opt = {
        margin: [20, 15, 20, 15] as [number, number, number, number],
        filename,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false, windowWidth: 794 },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: 'avoid-all' as const, before: '.page-break' }
      };

      await html2pdf().set(opt).from(contentRef.current).save();
      
      onDownload();
    } catch (err) {
      console.error('PDF generation error:', err);
      setStatus('ready');
    }
  };

  // Collect tables and figures
  const allTables: { caption: string; chapter: number }[] = [];
  const allFigures: { caption: string; chapter: number }[] = [];
  thesis.chapters.forEach((chapter, i) => {
    const { tables, charts } = getChapterContent(chapter);
    if (tables) tables.forEach(t => allTables.push({ caption: t.caption || 'Data Table', chapter: i + 1 }));
    if (charts) charts.forEach(c => allFigures.push({ caption: c.caption || 'Chart', chapter: i + 1 }));
  });

  // Collect footnote sources
  const allFootnoteSources: string[] = [];
  chapterFootnotes.forEach((footnotes) => {
    footnotes.forEach(fn => {
      if (!allFootnoteSources.includes(fn.source)) allFootnoteSources.push(fn.source);
    });
  });

  let globalFootnoteIndex = 0;

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-xl">
          <SpinnerGap size={20} className="animate-spin text-slate-600" />
          <span className="text-gray-700">Loading editor with footnotes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 rounded-t-xl">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Edit PDF Before Download</h2>
            <p className="text-sm text-slate-500">Click on any text to edit. Changes are saved automatically.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
              className="gap-1"
            >
              <ArrowCounterClockwise size={16} />
              Undo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="gap-1"
            >
              <ArrowClockwise size={16} />
              Redo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Editable Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100">
          <div 
            ref={contentRef}
            contentEditable
            suppressContentEditableWarning
            onBlur={saveToHistory}
            className="bg-white shadow-lg mx-auto"
            style={{ 
              width: '180mm', 
              minHeight: '297mm',
              fontFamily: 'Times New Roman, serif', 
              fontSize: '12pt', 
              lineHeight: '1.6', 
              color: '#000',
              padding: '15mm',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          >
            {/* TITLE PAGE */}
            <div style={{ 
              minHeight: '247mm', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'center', 
              alignItems: 'center', 
              textAlign: 'center',
              pageBreakAfter: 'always'
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

            {/* STATEMENT PAGE */}
            <div style={{ pageBreakAfter: 'always', paddingTop: '40px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '50px' }}>
                STATEMENT
              </h2>
              <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '20px' }}>
                Aware of my responsibility, I hereby declare that the thesis submitted was entirely 
                written by myself. I also declare that this work has not been submitted in the same 
                or similar form for obtaining a diploma or a degree from any educational institution.
              </p>
              <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '20px' }}>
                Furthermore, I declare that all sources used in the preparation of this thesis have 
                been properly cited and referenced in accordance with academic standards.
              </p>
              <div style={{ marginTop: '100px', textAlign: 'right', paddingRight: '40px' }}>
                <p style={{ marginBottom: '5px' }}>____________________________</p>
                <p style={{ fontSize: '10pt', fontStyle: 'italic' }}>Author&apos;s signature</p>
              </div>
            </div>

            {/* ABSTRACT */}
            {thesis.topic && (
              <div style={{ pageBreakAfter: 'always', paddingTop: '40px' }}>
                <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
                  ABSTRACT
                </h2>
                <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8' }}>
                  {thesis.topic}
                </p>
              </div>
            )}

            {/* TABLE OF CONTENTS */}
            <div style={{ pageBreakAfter: 'always', paddingTop: '40px' }}>
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

            {/* INTRODUCTION */}
            <div style={{ pageBreakAfter: 'always', paddingTop: '40px' }}>
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
                aspects of the research question.
              </p>
            </div>

            {/* CHAPTERS */}
            {thesis.chapters.map((chapter, i) => {
              const { sections } = getChapterContent(chapter);
              const chapterNum = i + 1;
              const footnotes = chapterFootnotes.get(i) || [];
              const footnoteRefs: { num: number; source: string }[] = [];
              
              const paragraphIndices = sections.map((s, idx) => s.type === 'paragraph' ? idx : -1).filter(idx => idx !== -1);
              const footnoteInsertPoints = paragraphIndices.length > 3 
                ? [paragraphIndices[Math.floor(paragraphIndices.length / 3)], paragraphIndices[Math.floor(2 * paragraphIndices.length / 3)]]
                : [paragraphIndices[Math.max(0, paragraphIndices.length - 1)]];
              
              let headingCounter = 0;
              let subheadingCounter = 0;
              
              return (
                <div key={i} style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
                  <h2 style={{ textAlign: 'center', fontSize: '16pt', fontWeight: 'bold', marginBottom: '10px' }}>
                    CHAPTER {toRoman(chapterNum)}
                  </h2>
                  <h3 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '30px', textTransform: 'uppercase' }}>
                    {chapter.title}
                  </h3>
                  
                  {sections.map((section, j) => {
                    const shouldAddFootnote = section.type === 'paragraph' && 
                      footnoteInsertPoints.includes(j) && 
                      footnotes[footnoteInsertPoints.indexOf(j)];
                    
                    if (shouldAddFootnote) {
                      globalFootnoteIndex++;
                      const fnIndex = footnoteInsertPoints.indexOf(j);
                      const fnData = footnotes[fnIndex];
                      footnoteRefs.push({ num: globalFootnoteIndex, source: fnData.source });
                    }
                    
                    if (section.type === 'heading') {
                      headingCounter++;
                      subheadingCounter = 0;
                      return (
                        <h4 key={j} style={{ fontSize: '13pt', fontWeight: 'bold', marginTop: '25px', marginBottom: '15px' }}>
                          {chapterNum}.{headingCounter}. {section.text}
                        </h4>
                      );
                    }
                    
                    if (section.type === 'subheading') {
                      subheadingCounter++;
                      const headingNum = headingCounter || 1;
                      return (
                        <h5 key={j} style={{ fontSize: '12pt', fontWeight: 'bold', marginTop: '20px', marginBottom: '12px', fontStyle: section.level === 4 ? 'italic' : 'normal' }}>
                          {chapterNum}.{headingNum}.{subheadingCounter}. {section.text}
                        </h5>
                      );
                    }
                    
                    return (
                      <p key={j} style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
                        {section.text}
                        {shouldAddFootnote && <sup style={{ fontSize: '9pt' }}>{globalFootnoteIndex}</sup>}
                      </p>
                    );
                  })}
                  
                  {/* Footnotes */}
                  {footnoteRefs.length > 0 && (
                    <div style={{ marginTop: '40px', paddingTop: '15px', borderTop: '1px solid black', width: '100%' }}>
                      {footnoteRefs.map(fn => (
                        <p key={fn.num} style={{ fontSize: '10pt', lineHeight: '1.5', margin: '6px 0', textAlign: 'justify' }}>
                          <sup style={{ fontSize: '8pt' }}>{fn.num}</sup> {fn.source}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* CONCLUSIONS */}
            <div style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
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
                contributions to the field of {field.toLowerCase()}.
              </p>
              <p style={{ textIndent: '1.25cm', textAlign: 'justify', lineHeight: '1.8', marginBottom: '14px' }}>
                Future research directions include deeper analysis of specific aspects identified 
                during this study, as well as broader applications of the findings to related domains.
              </p>
            </div>

            {/* REFERENCES */}
            <div style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', marginBottom: '40px' }}>
                REFERENCES
              </h2>
              <div style={{ lineHeight: '1.8' }}>
                {allFootnoteSources.length > 0 ? (
                  allFootnoteSources.sort().map((source, idx) => (
                    <p key={idx} style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                      {idx + 1}. {source}
                    </p>
                  ))
                ) : (
                  <>
                    <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                      1. Creswell, J., Research Design: Qualitative and Quantitative Approaches, Sage Publications, 2014.
                    </p>
                    <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                      2. Hart, C., Doing a Literature Review, Sage Publications, 2018.
                    </p>
                    <p style={{ marginLeft: '1cm', textIndent: '-1cm', marginBottom: '8px' }}>
                      3. Yin, R., Case Study Research: Design and Methods, Sage Publications, 2014.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* LIST OF TABLES */}
            {allTables.length > 0 && (
              <div style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
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

            {/* LIST OF FIGURES */}
            {allFigures.length > 0 && (
              <div style={{ pageBreakBefore: 'always', paddingTop: '40px' }}>
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50 rounded-b-xl">
          <p className="text-sm text-slate-500">
            Click directly on any text to edit it. Use Undo/Redo to revert changes.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleDownload}
              disabled={status === 'generating'}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {status === 'generating' ? (
                <>
                  <SpinnerGap size={16} className="animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <DownloadSimple size={16} />
                  Download PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
