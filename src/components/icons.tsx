import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svg({ size = 24, ...props }: IconProps) {
  return { width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true, ...props };
}

export function FlameIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path
        fill="currentColor"
        d="M12 2c.6 3.2-1 5-2.6 6.8C7.8 10.6 6 12.6 6 15.5A6 6 0 0 0 12 22a6 6 0 0 0 6-6.3c0-2.6-1.3-4.3-2.4-5.6-.2 1.6-.9 2.7-2 3.3.4-3.6-.4-8.7-1.6-11.4Z"
      />
    </svg>
  );
}

export function BoltIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path fill="currentColor" d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.5L13.5 2Z" />
    </svg>
  );
}

export function SpeakerIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <path fill="currentColor" stroke="none" d="M3 9.5v5h4l5 4.5V5L7 9.5H3Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

export function TurtleIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path
        fill="currentColor"
        d="M4 15c0-4 3.6-7 8-7s8 3 8 7H4Zm16.5-2.5c.9-.4 2-.2 2.5.6.4.6.1 1.4-.6 1.6L20 15l.5-2.5ZM6 15.5h3l-1 3H5.5L6 15.5Zm9 0h3l.5 3H16l-1-3Z"
      />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path
        fill="currentColor"
        d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10H7Zm2 0h6V8a3 3 0 0 0-6 0v2Z"
      />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path
        fill="currentColor"
        d="m12 2.8 2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3L2.9 9.4l6.3-.8L12 2.8Z"
      />
    </svg>
  );
}

export function CrownIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path fill="currentColor" d="M3 7.5 7.5 11 12 4l4.5 7L21 7.5 19 18H5L3 7.5ZM5 19.5h14V21H5v-1.5Z" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path
        fill="currentColor"
        d="M15.6 3.6a2 2 0 0 1 2.8 0l2 2a2 2 0 0 1 0 2.8L9.2 19.6a2 2 0 0 1-.9.5l-4.1 1a.8.8 0 0 1-1-1l1-4.1c.1-.3.3-.6.5-.9L15.6 3.6Zm-1.4 3.6-8 8-.6 2.6 2.6-.6 8-8-2-2Z"
      />
    </svg>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <svg {...svg(props)}>
      <path
        fill="currentColor"
        d="M4 5.5C4 4.1 5.1 3 6.5 3H11v16H6.5c-.9 0-1.7.3-2.5.8V5.5Zm9-2.5h4.5C18.9 3 20 4.1 20 5.5v14.3c-.8-.5-1.6-.8-2.5-.8H13V3ZM6.5 20.5H11V21H6.5a.5.5 0 0 1 0-.5Zm6.5 0h4.5a.5.5 0 0 1 0 .5H13v-.5Z"
      />
    </svg>
  );
}

/** Word review: one loop running back (counter-clockwise), unlike the two-arrow repeat of review lessons. */
export function RewindIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round">
      <path d="M6.34 6.84A8 8 0 1 0 12 4.5" />
      <path fill="currentColor" stroke="none" d="M8.2 4.5 13.4 1.4v6.2Z" />
    </svg>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...svg(props)} fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 2.5 20.5 6 17 9.5" />
      <path d="M3.5 11.5V10a4 4 0 0 1 4-4h13" />
      <path d="M7 21.5 3.5 18 7 14.5" />
      <path d="M20.5 12.5V14a4 4 0 0 1-4 4h-13" />
    </svg>
  );
}
