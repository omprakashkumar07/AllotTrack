import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className = '' }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect x="14" y="14" width="172" height="172" rx="36" fill="#1D9E75"/>
      <rect x="58" y="118" width="22" height="46" rx="5" fill="#ffffff"/>
      <rect x="93" y="90" width="22" height="74" rx="5" fill="#ffffff"/>
      <rect x="128" y="58" width="22" height="106" rx="5" fill="#ffffff"/>
      <path d="M52 96 L98 66 L146 40" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" fill="none"/>
      <path d="M122 40 L146 40 L146 62" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}
