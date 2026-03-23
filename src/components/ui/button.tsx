import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:shadow-xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0",
        gradient:
          "bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "bg-slate-100 border border-slate-200 text-slate-900 hover:bg-slate-200 shadow-sm",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        outline:
          "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
        link:
          "text-slate-900 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
