interface IconProps {
  size?: number;
  className?: string;
}

export default function ChevronDown({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
