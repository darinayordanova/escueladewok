interface IconProps {
  size?: number;
  className?: string;
}

export default function ArrowLeft({ size = 20, className }: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 8L2 12L6 16"/>
      <path d="M2 12H22"/>
    </svg>
  );
}
