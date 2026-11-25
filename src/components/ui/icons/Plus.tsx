interface IconProps {
  size?: number;
  className?: string;
}

export default function Plus({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M5 12h14M12 5v14"/>
    </svg>
  );
}
