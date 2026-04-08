interface IconProps {
  size?: number;
  className?: string;
}

export default function ArrowRight({ size = 20, className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 8L22 12L18 16"/>
      <path d="M2 12H22"/>
    </svg>
  );
}
