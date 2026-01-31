import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors - Electric Blue
        accent: {
          blue: "#2563EB",
          "blue-light": "#3B82F6",
          "blue-dark": "#1D4ED8",
          cyan: "#06B6D4",
          indigo: "#4F46E5",
        },
        // Backgrounds
        background: {
          primary: "#FFFFFF",
          secondary: "#F8FAFC",
          tertiary: "#F1F5F9",
          elevated: "#FFFFFF",
        },
        // Text Colors
        foreground: {
          primary: "#0F172A",
          secondary: "#475569",
          tertiary: "#94A3B8",
          inverse: "#FFFFFF",
        },
        // Borders
        border: {
          primary: "#E2E8F0",
          secondary: "#CBD5E1",
          focus: "#2563EB",
        },
        // Status Colors
        success: {
          DEFAULT: "#10B981",
          bg: "#ECFDF5",
        },
        warning: {
          DEFAULT: "#F59E0B",
          bg: "#FFFBEB",
        },
        error: {
          DEFAULT: "#EF4444",
          bg: "#FEF2F2",
        },
        info: {
          DEFAULT: "#3B82F6",
          bg: "#EFF6FF",
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.6vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.75rem + 2.5vw, 3.5rem)',
        'fluid-5xl': 'clamp(3rem, 2rem + 5vw, 4.5rem)',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05)',
        'glow': '0 0 40px rgba(37, 99, 235, 0.3)',
        'glow-lg': '0 0 60px rgba(37, 99, 235, 0.4)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 50%, #0EA5E9 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(37, 99, 235, 0.03), rgba(6, 182, 212, 0.03))',
        'gradient-radial': 'radial-gradient(ellipse 80% 80% at 50% -20%, rgba(37, 99, 235, 0.15), rgba(255, 255, 255, 0))',
        'grid-pattern': 'linear-gradient(to right, #8080800a 1px, transparent 1px), linear-gradient(to bottom, #8080800a 1px, transparent 1px)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(37, 99, 235, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
