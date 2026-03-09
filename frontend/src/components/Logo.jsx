export default function Logo({ size = 'large', className = '' }) {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <svg 
      className={`${sizeClasses[size]} ${className}`}
      viewBox="0 0 64 64" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradientInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="50%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>
      </defs>

      <path d="M16 4 L40 4 L48 12 L48 60 L16 60 Z" fill="url(#logoGradientInner)" />
      
      <path d="M40 4 L40 12 L48 12" fill="#1E40AF" opacity="0.5" />
      
      <rect x="22" y="18" width="18" height="2" rx="1" fill="white" opacity="0.9" />
      <rect x="22" y="24" width="18" height="2" rx="1" fill="white" opacity="0.9" />
      <rect x="22" y="30" width="14" height="2" rx="1" fill="white" opacity="0.9" />
      <rect x="22" y="36" width="16" height="2" rx="1" fill="white" opacity="0.9" />
      
      <rect x="20" y="44" width="24" height="10" rx="2" fill="white" />
      <text 
        x="32" 
        y="51.5" 
        fontFamily="Arial, sans-serif" 
        fontSize="7" 
        fontWeight="bold" 
        fill="url(#logoGradientInner)" 
        textAnchor="middle"
      >PDF</text>
    </svg>
  );
}
