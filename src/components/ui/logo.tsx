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

// Brand color
const BRAND_COLOR = '#2560EA';
const BRAND_LIGHT = '#4F8FFF'; // lighter accent

export function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const { icon, text } = sizes[size];
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Document with pen icon */}
        <svg 
          width={icon} 
          height={icon} 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Document body */}
          <path 
            d="M5 4C5 2.89543 5.89543 2 7 2H17L24 9V28C24 29.1046 23.1046 30 22 30H7C5.89543 30 5 29.1046 5 28V4Z" 
            fill={BRAND_COLOR}
          />
          
          {/* Folded corner */}
          <path 
            d="M17 2L24 9H19C17.8954 9 17 8.10457 17 7V2Z" 
            fill={BRAND_LIGHT}
          />
          
          {/* Document lines */}
          <rect x="8" y="13" width="10" height="1.5" rx="0.75" fill="white" opacity="0.8" />
          <rect x="8" y="17" width="8" height="1.5" rx="0.75" fill="white" opacity="0.6" />
          <rect x="8" y="21" width="10" height="1.5" rx="0.75" fill="white" opacity="0.8" />
          
          {/* Pen/Edit icon overlay */}
          <g transform="translate(16, 16)">
            <path 
              d="M10.5 1.5L12.5 3.5L5 11L2 12L3 9L10.5 1.5Z" 
              fill="#FFD700"
              stroke={BRAND_COLOR}
              strokeWidth="0.5"
            />
            <path 
              d="M10.5 1.5L12.5 3.5" 
              stroke={BRAND_COLOR}
              strokeWidth="1"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold ${text}`} style={{ color: '#2560EA' }}>
          Thesis Generator
        </span>
      )}
    </div>
  );
}

// Icon-only version for small spaces
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
        {/* Document body - white */}
        <path 
          d="M5 4C5 2.89543 5.89543 2 7 2H17L24 9V28C24 29.1046 23.1046 30 22 30H7C5.89543 30 5 29.1046 5 28V4Z" 
          fill="white"
        />
        
        {/* Folded corner */}
        <path 
          d="M17 2L24 9H19C17.8954 9 17 8.10457 17 7V2Z" 
          fill="rgba(255,255,255,0.7)"
        />
        
        {/* Document lines */}
        <rect x="8" y="13" width="10" height="1.5" rx="0.75" fill={BRAND_COLOR} opacity="0.8" />
        <rect x="8" y="17" width="8" height="1.5" rx="0.75" fill={BRAND_COLOR} opacity="0.6" />
        <rect x="8" y="21" width="10" height="1.5" rx="0.75" fill={BRAND_COLOR} opacity="0.8" />
        
        {/* Pen/Edit icon overlay */}
        <g transform="translate(16, 16)">
          <path 
            d="M10.5 1.5L12.5 3.5L5 11L2 12L3 9L10.5 1.5Z" 
            fill="#FFD700"
            stroke="white"
            strokeWidth="0.5"
          />
        </g>
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
      {/* Document body */}
      <path 
        d="M5 4C5 2.89543 5.89543 2 7 2H17L24 9V28C24 29.1046 23.1046 30 22 30H7C5.89543 30 5 29.1046 5 28V4Z" 
        fill={BRAND_COLOR}
      />
      
      {/* Folded corner */}
      <path 
        d="M17 2L24 9H19C17.8954 9 17 8.10457 17 7V2Z" 
        fill={BRAND_LIGHT}
      />
      
      {/* Document lines */}
      <rect x="8" y="13" width="10" height="1.5" rx="0.75" fill="white" opacity="0.8" />
      <rect x="8" y="17" width="8" height="1.5" rx="0.75" fill="white" opacity="0.6" />
      <rect x="8" y="21" width="10" height="1.5" rx="0.75" fill="white" opacity="0.8" />
      
      {/* Pen/Edit icon overlay */}
      <g transform="translate(16, 16)">
        <path 
          d="M10.5 1.5L12.5 3.5L5 11L2 12L3 9L10.5 1.5Z" 
          fill="#FFD700"
          stroke={BRAND_COLOR}
          strokeWidth="0.5"
        />
        <path 
          d="M10.5 1.5L12.5 3.5" 
          stroke={BRAND_COLOR}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
