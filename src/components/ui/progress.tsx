'use client';

import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export function Progress({ 
  value, 
  className, 
  showLabel = false, 
  size = 'md',
  animated = true 
}: ProgressProps) {
  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn("relative w-full", className)}>
      <div className={cn("bg-slate-100 rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500 ease-out",
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
        {animated && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            style={{ 
              animation: 'shimmer 2s linear infinite',
            }}
          />
        )}
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-6 text-sm font-medium text-slate-600">
          {Math.round(value)}%
        </span>
      )}
    </div>
  );
}
