/**
 * Centralized SVG icon library for ReliefChain.
 * All icons are inline SVGs — no emoji, no icon font dependency.
 * Default size is 1em so they scale with surrounding text.
 */

import React from "react";

interface IconProps {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  color?: string;
}

const base = (
  children: React.ReactNode,
  { size = "1em", className, style, title, color = "currentColor" }: IconProps,
  viewBox = "0 0 24 24"
) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    aria-hidden={title ? undefined : true}
    role={title ? "img" : undefined}
  >
    {title && <title>{title}</title>}
    {children}
  </svg>
);

/** ⛑️  Relief / hard-hat (brand logo) */
export const IconRelief = (p: IconProps) =>
  base(
    <>
      <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" fill="currentColor" stroke="none" />
      <path d="M12 2C7.2 2 3.4 5.6 3 10.2V15h18v-4.8C20.6 5.6 16.8 2 12 2z" fill="currentColor" stroke="none" />
      <path d="M9 15v-4" stroke="white" strokeWidth={2} />
      <path d="M15 15v-4" stroke="white" strokeWidth={2} />
      <path d="M9 11h6" stroke="white" strokeWidth={2} />
    </>,
    { ...p, color: p.color ?? "currentColor" }
  );

/** 🏛️  Organization / institution */
export const IconOrganization = (p: IconProps) =>
  base(
    <>
      <line x1="3" y1="22" x2="21" y2="22" />
      <rect x="2" y="16" width="20" height="5" rx="0" fill="currentColor" stroke="none" opacity="0.15" />
      <path d="M3 7l9-5 9 5" />
      <path d="M4 7v9" /><path d="M8 7v9" /><path d="M12 7v9" /><path d="M16 7v9" /><path d="M20 7v9" />
      <path d="M3 7h18" />
    </>,
    p
  );

/** 💰  Donate / contribute */
export const IconDonate = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2" />
      <path d="M9 9.5A2.5 2.5 0 0 1 12 7.5h.5A2 2 0 0 1 14.5 9.5c0 1.5-1.5 2-2.5 2.5-1 .5-2.5 1-2.5 2.5a2 2 0 0 0 2 2h1a2.5 2.5 0 0 0 2.5-2.5" />
    </>,
    p
  );

/** 📋  Clipboard / spending proposal */
export const IconClipboard = (p: IconProps) =>
  base(
    <>
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14l2 2 4-4" />
    </>,
    p
  );

/** ✅  Checkmark / approved / confirmed */
export const IconCheckCircle = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12l3 3 5-5" />
    </>,
    p
  );

/** 🚀  Execute / launch */
export const IconRocket = (p: IconProps) =>
  base(
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>,
    p
  );

/** 🔑  Key / wallet */
export const IconKey = (p: IconProps) =>
  base(
    <>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </>,
    p
  );

/** 📍  Location pin */
export const IconPin = (p: IconProps) =>
  base(
    <>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </>,
    p
  );

/** 📦  Package / distribution */
export const IconPackage = (p: IconProps) =>
  base(
    <>
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>,
    p
  );

/** 🔍  Search / explore on-chain */
export const IconSearch = (p: IconProps) =>
  base(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    p
  );

/** 🔐  Lock / security / approval required */
export const IconLock = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>,
    p
  );

/** 📊  Chart / accounting */
export const IconChart = (p: IconProps) =>
  base(
    <>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </>,
    p
  );

/** ⛔  Block / unauthorized */
export const IconBlock = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </>,
    p
  );

/** ⚠️  Warning / caution */
export const IconWarning = (p: IconProps) =>
  base(
    <>
      <path d="m10.29 3.86-8.17 14.14A1 1 0 0 0 3 20h18a1 1 0 0 0 .88-1.47L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </>,
    p
  );

/** ❌  Error / close */
export const IconXCircle = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </>,
    p
  );

/** ℹ️  Info */
export const IconInfo = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </>,
    p
  );

/** ✓ Approve (small checkmark for buttons) */
export const IconCheck = (p: IconProps) =>
  base(
    <polyline points="20 6 9 17 4 12" />,
    p
  );

/** ✗ Reject (small X for buttons) */
export const IconX = (p: IconProps) =>
  base(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    p
  );
