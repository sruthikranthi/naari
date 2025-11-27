import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xl font-bold font-headline text-foreground',
        className
      )}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary"
      >
        <path
          d="M12 3C7.03125 3 3 7.03125 3 12C3 16.9688 7.03125 21 12 21C16.9688 21 21 16.9688 21 12C21 7.03125 16.9688 3 12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
        <path
          d="M12 3C12 3 15 6 15 12C15 18 12 21 12 21"
          stroke="currentColor"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
        <path
          d="M12 21C12 21 9 18 9 12C9 6 12 3 12 3"
          stroke="currentColor"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
        <path
          d="M3 12C3 12 6 15 12 15C18 15 21 12 21 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
        <path
          d="M21 12C21 12 18 9 12 9C6 9 3 12 3 12"
          stroke="currentColor"
          strokeWidth="2"
          strokeMiterlimit="10"
        />
      </svg>
      <span>Naarimani</span>
    </div>
  );
}
