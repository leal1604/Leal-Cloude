export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#637657" />
      <path
        d="M17 30.5 32 18l15 12.5V46a2 2 0 0 1-2 2H19a2 2 0 0 1-2-2Z"
        fill="#f5efe5"
      />
      <path
        d="M32 42.5c-5.5-3.2-8-6-8-9.1 0-2.3 1.8-4 4-4 1.7 0 3.1 1 4 2.4.9-1.4 2.3-2.4 4-2.4 2.2 0 4 1.7 4 4 0 3.1-2.5 5.9-8 9.1Z"
        fill="#93a685"
      />
    </svg>
  );
}
