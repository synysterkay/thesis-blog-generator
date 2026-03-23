'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "@phosphor-icons/react";
import { Button } from "./button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, children, className, showCloseButton = true }: ModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div
        className={cn(
          "relative w-full max-w-lg mx-4 p-8 rounded-3xl bg-white border border-slate-200 shadow-2xl animate-in",
          className
        )}
        style={{
          animation: 'fadeIn 0.3s ease-out, scaleIn 0.3s ease-out',
        }}
      >
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        )}
        {children}
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      {children}
    </div>
  );
}

interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  return (
    <h2 className={cn("text-2xl font-bold text-slate-900", className)}>
      {children}
    </h2>
  );
}

interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalDescription({ children, className }: ModalDescriptionProps) {
  return (
    <p className={cn("mt-2 text-slate-600", className)}>
      {children}
    </p>
  );
}

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn("mt-8 flex gap-3 justify-end", className)}>
      {children}
    </div>
  );
}
