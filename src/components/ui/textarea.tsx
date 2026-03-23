'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    const id = React.useId();
    
    if (label) {
      return (
        <div className="relative">
          <textarea
            id={id}
            className={cn(
              "peer w-full px-4 pt-8 pb-3 min-h-[120px] rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-transparent resize-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all duration-200 outline-none",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              className
            )}
            placeholder={label}
            ref={ref}
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "absolute left-4 top-4 text-slate-600 text-sm transition-all duration-200 pointer-events-none",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600",
              "peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-xs",
              error && "peer-focus:text-red-500"
            )}
          >
            {label}
          </label>
          {error && (
            <p className="mt-1.5 text-sm text-red-500">{error}</p>
          )}
        </div>
      );
    }

    return (
      <textarea
        className={cn(
          "flex min-h-[120px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 transition-all duration-200 placeholder:text-slate-500 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
