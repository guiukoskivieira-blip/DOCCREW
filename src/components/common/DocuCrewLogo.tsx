import React from 'react';

interface DocuCrewLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'yellow' | 'monochrome';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  customHeight?: number;
}

/**
 * Pixel-accurate SVG icon representing the DocuCrew modular "D" mark
 * with circuit node connectors and the signature amber-yellow square.
 */
export const DocuCrewIcon: React.FC<{
  className?: string;
  variant?: 'light' | 'dark' | 'yellow' | 'monochrome';
  size?: number | string;
}> = ({ className = 'w-9 h-9', variant = 'dark', size }) => {
  // Determine color scheme based on variant:
  // 'light': White background / dark D body + yellow square (for light UI)
  // 'dark': Dark background / white D body + yellow square (for dark sidebar/header)
  // 'yellow': Yellow background / dark D body (for brand badges/tiles)
  // 'monochrome': Uniform dark/white

  const isDarkBg = variant === 'dark';
  const isYellowBg = variant === 'yellow';

  const bodyColor = isDarkBg ? '#FFFFFF' : '#061E2E';
  const yellowColor = isYellowBg ? '#061E2E' : '#FFC400';
  const nodeLineColor = isDarkBg ? '#FFFFFF' : '#061E2E';

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="DocuCrew Logo Icon"
    >
      {/* Background shape if yellow variant */}
      {isYellowBg && (
        <rect width="100" height="100" rx="22" fill="#FFC400" />
      )}

      {/* Main D Outer Body & Cutout */}
      {/* Outer contour: x=34 to 88, y=14 to 86 */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34 14C34 14 56 14 62 14C78.5685 14 92 27.4315 92 44V56C92 72.5685 78.5685 86 62 86C56 86 34 86 34 86V68C34 68 54 68 58 68C65.732 68 72 61.732 72 54V46C72 38.268 65.732 32 58 32C54 32 34 32 34 32V14Z"
        fill={bodyColor}
      />

      {/* Top Left Modular Block */}
      <rect x="8" y="14" width="18" height="18" rx="4.5" fill={bodyColor} />
      {/* Connection from Top Block to D stem */}
      <path
        d="M26 23H35"
        stroke={nodeLineColor}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Bottom Left Modular Block */}
      <rect x="8" y="68" width="18" height="18" rx="4.5" fill={bodyColor} />
      {/* Connection from Bottom Block to D stem */}
      <path
        d="M26 77H35"
        stroke={nodeLineColor}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Middle Circuit Connection Lines & Junction Dots */}
      <path
        d="M22 50H34"
        stroke={nodeLineColor}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="34" cy="50" r="4.5" fill={nodeLineColor} />

      {/* Signature Amber-Yellow Modular Accent Square */}
      <rect
        x="2"
        y="40"
        width="20"
        height="20"
        rx="5"
        fill={yellowColor}
      />
    </svg>
  );
};

/**
 * Full DocuCrew Brand Logo with Icon + Bold Geometric Wordmark
 */
export const DocuCrewLogo: React.FC<DocuCrewLogoProps> = ({
  className = '',
  variant = 'dark',
  showText = true,
  size = 'md',
}) => {
  const isDarkBg = variant === 'dark';

  const sizeClasses = {
    sm: { icon: 'w-7 h-7', text: 'text-lg tracking-tight', gap: 'gap-2' },
    md: { icon: 'w-9 h-9', text: 'text-xl tracking-tight', gap: 'gap-2.5' },
    lg: { icon: 'w-11 h-11', text: 'text-2xl tracking-tight', gap: 'gap-3' },
    xl: { icon: 'w-14 h-14', text: 'text-3xl tracking-tight', gap: 'gap-3.5' },
    custom: { icon: 'w-auto h-full', text: 'text-xl', gap: 'gap-2' },
  }[size];

  return (
    <div className={`flex items-center ${sizeClasses.gap} ${className}`}>
      <DocuCrewIcon className={sizeClasses.icon} variant={variant} />
      {showText && (
        <span
          className={`font-black font-sans select-none flex items-baseline ${
            sizeClasses.text
          } ${isDarkBg ? 'text-white' : 'text-slate-900'}`}
        >
          DocuCrew
        </span>
      )}
    </div>
  );
};

export default DocuCrewLogo;
