'use client';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { icon: 20, text: 'text-sm' },
  md: { icon: 24, text: 'text-base' },
  lg: { icon: 32, text: 'text-lg' },
  xl: { icon: 48, text: 'text-2xl' },
};

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text } = sizes[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Main document shape */}
        <svg 
          width={icon} 
          height={icon} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Background glow effect */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main document body */}
          <path 
            d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" 
            fill="url(#logoGradient)"
            filter="url(#glow)"
          />
          
          {/* Folded corner */}
          <path 
            d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" 
            fill="url(#shineGradient)"
          />
          
          {/* AI Sparkle/Star accent */}
          <path 
            d="M16 14L17.5 17.5L21 19L17.5 20.5L16 24L14.5 20.5L11 19L14.5 17.5L16 14Z" 
            fill="white"
            opacity="0.95"
          />
          
          {/* Small sparkle dots */}
          <circle cx="22" cy="14" r="1" fill="white" opacity="0.7" />
          <circle cx="10" cy="25" r="0.8" fill="white" opacity="0.5" />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold ${text} bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent`}>
          Thesis Generator
        </span>
      )}
    </div>
  );
}

// Icon-only version for small spaces (white version for dark backgrounds)
export function LogoIcon({ size = 'md', variant = 'default' }: { size?: 'sm' | 'md' | 'lg' | 'xl'; variant?: 'default' | 'white' }) {
  const iconSize = sizes[size].icon;
  
  if (variant === 'white') {
    return (
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main document body - white */}
        <path 
          d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" 
          fill="white"
        />
        
        {/* Folded corner */}
        <path 
          d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" 
          fill="rgba(255,255,255,0.7)"
        />
        
        {/* AI Sparkle/Star accent - blue on white */}
        <path 
          d="M16 14L17.5 17.5L21 19L17.5 20.5L16 24L14.5 20.5L11 19L14.5 17.5L16 14Z" 
          fill="#2563eb"
        />
        
        {/* Small sparkle dots */}
        <circle cx="22" cy="14" r="1" fill="#3b82f6" />
        <circle cx="10" cy="25" r="0.8" fill="#60a5fa" />
      </svg>
    );
  }
  
  return (
    <svg 
      width={iconSize} 
      height={iconSize} 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-sm"
    >
      <defs>
        <linearGradient id="logoGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="shineGradientIcon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      
      <path 
        d="M6 4C6 2.89543 6.89543 2 8 2H18L26 10V28C26 29.1046 25.1046 30 24 30H8C6.89543 30 6 29.1046 6 28V4Z" 
        fill="url(#logoGradientIcon)"
      />
      
      <path 
        d="M18 2L26 10H20C18.8954 10 18 9.10457 18 8V2Z" 
        fill="url(#shineGradientIcon)"
      />
      
      <path 
        d="M16 14L17.5 17.5L21 19L17.5 20.5L16 24L14.5 20.5L11 19L14.5 17.5L16 14Z" 
        fill="white"
        opacity="0.95"
      />
      
      <circle cx="22" cy="14" r="1" fill="white" opacity="0.7" />
      <circle cx="10" cy="25" r="0.8" fill="white" opacity="0.5" />
    </svg>
  );
}
