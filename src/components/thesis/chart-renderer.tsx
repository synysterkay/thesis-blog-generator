'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'doughnut';
export type ChartTheme = 'academic' | 'colorful' | 'monochrome' | 'warm' | 'cool';

interface ChartData {
  caption?: string;
  type: ChartType;
  labels: string[];
  data: number[];
  xlabel?: string;
  ylabel?: string;
  source?: string;
}

interface ChartRendererProps {
  chart: ChartData;
  theme?: ChartTheme;
  height?: number;
}

// Color palettes for different themes
const THEMES: Record<ChartTheme, string[]> = {
  academic: ['#1e40af', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
  colorful: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'],
  monochrome: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'],
  warm: ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d', '#16a34a'],
  cool: ['#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea'],
};

export function ChartRenderer({ chart, theme = 'academic', height = 300 }: ChartRendererProps) {
  const colors = THEMES[theme];
  
  // Transform data for Recharts format
  const chartData = chart.labels.map((label, index) => ({
    name: label,
    value: chart.data[index],
  }));

  const renderChart = () => {
    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: chart.xlabel, position: 'bottom', offset: 40 }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: chart.ylabel, angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Bar dataKey="value" name={chart.ylabel || 'Value'} radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: chart.xlabel, position: 'bottom', offset: 40 }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: chart.ylabel, angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={chart.ylabel || 'Value'}
                stroke={colors[0]} 
                strokeWidth={2}
                dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: colors[1] }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                innerRadius={40}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={60}
                label={{ value: chart.xlabel, position: 'bottom', offset: 40 }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                label={{ value: chart.ylabel, angle: -90, position: 'insideLeft', offset: 10 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="value" 
                name={chart.ylabel || 'Value'}
                stroke={colors[0]} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'doughnut':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
                paddingAngle={3}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        // Fallback to bar chart
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full">
      {chart.caption && (
        <p className="text-sm font-medium text-slate-700 mb-3 text-center">{chart.caption}</p>
      )}
      {renderChart()}
      {chart.source && (
        <p className="text-xs text-slate-500 mt-2 text-center">Source: {chart.source}</p>
      )}
    </div>
  );
}

// Theme selector component
interface ChartThemeSelectorProps {
  value: ChartTheme;
  onChange: (theme: ChartTheme) => void;
}

export function ChartThemeSelector({ value, onChange }: ChartThemeSelectorProps) {
  const themes: { id: ChartTheme; name: string; preview: string[] }[] = [
    { id: 'academic', name: 'Academic', preview: THEMES.academic.slice(0, 3) },
    { id: 'colorful', name: 'Colorful', preview: THEMES.colorful.slice(0, 3) },
    { id: 'monochrome', name: 'Monochrome', preview: THEMES.monochrome.slice(0, 3) },
    { id: 'warm', name: 'Warm', preview: THEMES.warm.slice(0, 3) },
    { id: 'cool', name: 'Cool', preview: THEMES.cool.slice(0, 3) },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500">Theme:</span>
      <div className="flex gap-1">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={`flex items-center gap-0.5 px-2 py-1 rounded text-xs transition-all ${
              value === theme.id 
                ? 'bg-slate-900 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={theme.name}
          >
            <div className="flex">
              {theme.preview.map((color, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full -ml-0.5 first:ml-0" 
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
