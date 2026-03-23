'use client';

import { FileText } from '@phosphor-icons/react';

const sizes = {
  sm: { icon: 18, text: 'text-sm', gap: 'gap-1.5' },
  md: { icon: 22, text: 'text-base', gap: 'gap-2' },
  lg: { icon: 26, text: 'text-lg', gap: 'gap-2' },
  xl: { icon: 36, text: 'text-2xl', gap: 'gap-2.5' },
};

export function LogoIcon({ size = 'md', variant = 'default' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; variant?: 'default' | 'white' }) {
  const { icon } = sizes[size];
  return <FileText size={icon} weight="duotone" className={variant === 'white' ? 'text-white' : 'text-slate-900'} />;
}

export function LogoWithText({ size = 'md', variant = 'default' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; variant?: 'default' | 'white' }) {
  const { icon, text, gap } = sizes[size];
  const isWhite = variant === 'white';
  return (
    <span className={`flex items-center ${gap}`}>
      <FileText size={icon} weight="duotone" className={isWhite ? 'text-white' : 'text-slate-900'} />
      <span className={`font-semibold ${text} tracking-tight ${isWhite ? 'text-white' : 'text-slate-900'}`}>
        Thesis<span className={`font-normal ${isWhite ? 'text-slate-400' : 'text-slate-700'}`}>Generator</span>
      </span>
    </span>
  );
}
