'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "@phosphor-icons/react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export function Select({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option",
  label,
  error,
  className 
}: SelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {label && (
        <label className="block text-sm font-medium text-slate-600 mb-1.5">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full h-11 px-4 rounded-xl bg-white border border-slate-200 text-left transition-all duration-200",
          "focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          isOpen && "bg-white border-slate-400 ring-4 ring-slate-100"
        )}
      >
        <span className={cn(
          "text-sm",
          selectedOption ? "text-slate-900" : "text-slate-600"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className={cn(
            "w-5 h-5 text-slate-500 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 py-2 bg-white rounded-xl border border-slate-200 shadow-xl animate-in">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                "flex items-center w-full px-4 py-2.5 text-left transition-colors",
                "hover:bg-slate-50",
                value === option.value && "bg-slate-100"
              )}
            >
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  value === option.value ? "text-slate-900" : "text-slate-600"
                )}>
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
              {value === option.value && (
                <Check size={16} className="text-slate-900 ml-2" />
              )}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
