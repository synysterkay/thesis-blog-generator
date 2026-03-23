import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    const id = React.useId();
    
    if (label) {
      return (
        <div className="relative">
          <input
            id={id}
            type={type}
            className={cn(
              "peer w-full px-4 pt-6 pb-2 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-transparent focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition-all duration-200 outline-none",
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
              "absolute left-4 top-4 text-slate-500 text-sm transition-all duration-200 pointer-events-none",
              "peer-focus:top-2 peer-focus:text-xs peer-focus:text-slate-600",
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
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-600 focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
