import { useId } from "react";

export default function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      role="img"
      aria-label="RatePayPal logo"
      className={className}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#003087" />
          <stop offset="1" stopColor="#0070BA" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill={`url(#${id})`} />
      <circle cx="196" cy="256" r="122" fill="#ffffff" />
      <circle cx="316" cy="256" r="122" fill="#009CDE" fillOpacity="0.92" />
    </svg>
  );
}
