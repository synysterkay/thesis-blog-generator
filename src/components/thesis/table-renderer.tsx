'use client';

export type TableStyle = 'academic' | 'modern' | 'minimal' | 'striped' | 'bordered';

interface TableData {
  caption?: string;
  columns: string[];
  rows: string[][];
  source?: string;
}

interface TableRendererProps {
  table: TableData;
  style?: TableStyle;
  tableNumber?: number;
}

export function TableRenderer({ table, style = 'academic', tableNumber }: TableRendererProps) {
  const getTableClasses = () => {
    const base = 'w-full text-sm';
    
    switch (style) {
      case 'academic':
        return {
          table: `${base} border-collapse`,
          thead: 'bg-slate-800 text-white',
          th: 'px-4 py-3 text-left font-semibold border-b-2 border-slate-800',
          tbody: '',
          tr: 'border-b border-slate-200 hover:bg-slate-50',
          td: 'px-4 py-3',
          caption: 'text-sm font-semibold text-slate-800 mb-2',
        };
      
      case 'modern':
        return {
          table: `${base} border-collapse`,
          thead: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white',
          th: 'px-4 py-3 text-left font-medium',
          tbody: '',
          tr: 'border-b border-slate-100 hover:bg-blue-50 transition-colors',
          td: 'px-4 py-3',
          caption: 'text-sm font-medium text-blue-700 mb-2',
        };
      
      case 'minimal':
        return {
          table: `${base}`,
          thead: '',
          th: 'px-4 py-2 text-left font-medium text-slate-600 border-b-2 border-slate-300',
          tbody: '',
          tr: 'hover:bg-slate-50',
          td: 'px-4 py-2 border-b border-slate-100',
          caption: 'text-sm text-slate-600 mb-2',
        };
      
      case 'striped':
        return {
          table: `${base} border-collapse rounded-lg overflow-hidden`,
          thead: 'bg-emerald-600 text-white',
          th: 'px-4 py-3 text-left font-semibold',
          tbody: '',
          tr: 'even:bg-emerald-50 odd:bg-white hover:bg-emerald-100 transition-colors',
          td: 'px-4 py-3',
          caption: 'text-sm font-medium text-emerald-700 mb-2',
        };
      
      case 'bordered':
        return {
          table: `${base} border-collapse border-2 border-slate-300`,
          thead: 'bg-slate-100',
          th: 'px-4 py-3 text-left font-semibold border border-slate-300',
          tbody: '',
          tr: 'hover:bg-slate-50',
          td: 'px-4 py-3 border border-slate-300',
          caption: 'text-sm font-medium text-slate-700 mb-2',
        };
      
      default:
        return {
          table: base,
          thead: 'bg-slate-100',
          th: 'px-4 py-2 text-left font-medium border border-slate-200',
          tbody: '',
          tr: '',
          td: 'px-4 py-2 border border-slate-200',
          caption: 'text-sm text-slate-600 mb-2',
        };
    }
  };

  const classes = getTableClasses();

  return (
    <div className="w-full overflow-x-auto">
      {(table.caption || tableNumber) && (
        <p className={classes.caption}>
          {tableNumber && <span className="font-bold">Table {tableNumber}: </span>}
          {table.caption}
        </p>
      )}
      
      <div className="rounded-lg overflow-hidden shadow-sm border border-slate-200">
        <table className={classes.table}>
          <thead className={classes.thead}>
            <tr>
              {table.columns.map((header, idx) => (
                <th key={idx} className={classes.th}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={classes.tbody}>
            {table.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={classes.tr}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className={classes.td}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {table.source && (
        <p className="text-xs text-slate-500 mt-2 italic">Source: {table.source}</p>
      )}
    </div>
  );
}

// Style selector component
interface TableStyleSelectorProps {
  value: TableStyle;
  onChange: (style: TableStyle) => void;
}

export function TableStyleSelector({ value, onChange }: TableStyleSelectorProps) {
  const styles: { id: TableStyle; name: string; description: string }[] = [
    { id: 'academic', name: 'Academic', description: 'Classic academic style' },
    { id: 'modern', name: 'Modern', description: 'Clean gradient header' },
    { id: 'minimal', name: 'Minimal', description: 'Simple and clean' },
    { id: 'striped', name: 'Striped', description: 'Alternating row colors' },
    { id: 'bordered', name: 'Bordered', description: 'Full borders' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Style:</span>
      <div className="flex gap-1">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={`px-2 py-1 rounded text-xs transition-all ${
              value === s.id 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={s.description}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// Preview component showing all styles
interface TableStylePreviewProps {
  onSelect: (style: TableStyle) => void;
}

export function TableStylePreview({ onSelect }: TableStylePreviewProps) {
  const sampleTable: TableData = {
    columns: ['Category', 'Value', 'Trend'],
    rows: [
      ['Item A', '42%', '↑'],
      ['Item B', '28%', '↓'],
      ['Item C', '30%', '→'],
    ],
  };

  const styles: TableStyle[] = ['academic', 'modern', 'minimal', 'striped', 'bordered'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {styles.map((style) => (
        <button
          key={style}
          onClick={() => onSelect(style)}
          className="p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
        >
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{style}</p>
          <div className="transform scale-90 origin-top-left">
            <TableRenderer table={sampleTable} style={style} />
          </div>
        </button>
      ))}
    </div>
  );
}
