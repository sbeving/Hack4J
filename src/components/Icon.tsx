import type { SVGProps } from "react";

// Bespoke line-icon set for Sulha. One grammar: 24-grid, 1.75 stroke,
// round caps/joins, currentColor. Domain icons (seal, scales, handshake,
// dossier, shield) are crafted; UI icons are clean geometric constructions.
// No emoji anywhere — icons are how a product stops looking auto-generated.

export type IconName =
  | "seal"
  | "workshop"
  | "tower"
  | "scales"
  | "network"
  | "document"
  | "stamp"
  | "dossier"
  | "handshake"
  | "conciliation"
  | "anchor"
  | "shield"
  | "bell"
  | "upload"
  | "download"
  | "mic"
  | "clock"
  | "check"
  | "close"
  | "plus"
  | "arrow"
  | "chevron"
  | "globe"
  | "logout"
  | "braces"
  | "search"
  | "filter"
  | "alert"
  | "sparkle"
  | "send"
  | "eye"
  | "spinner";

const P: Record<IconName, React.ReactNode> = {
  // brand: concentric seal with four khatam points
  seal: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M19.4 4.6L18 6M6 18l-1.4 1.4" />
    </>
  ),
  // claimant / MSME workshop — a small storefront
  workshop: (
    <>
      <path d="M3.5 9.5 5 4h14l1.5 5.5" />
      <path d="M4 9.5v10h16v-10" />
      <path d="M3.5 9.5a2.2 2.2 0 0 0 4.3 0 2.2 2.2 0 0 0 4.2 0 2.2 2.2 0 0 0 4.2 0 2.2 2.2 0 0 0 4.3 0" />
      <path d="M9.5 19.5v-5h5v5" />
    </>
  ),
  // provider — utility tower
  tower: (
    <>
      <path d="M12 3v18" />
      <path d="M7 21h10" />
      <path d="M6 7h12M7.5 11h9M9 15h6" />
      <path d="M8 3h8l-4 4-4-4Z" />
    </>
  ),
  // resolver — balance scales
  scales: (
    <>
      <path d="M12 4v16M8 20h8" />
      <path d="M5 7h14M12 4l-7 3M12 4l7 3" />
      <path d="M2.5 13a2.5 2.5 0 0 0 5 0L5 7 2.5 13Z" />
      <path d="M16.5 13a2.5 2.5 0 0 0 5 0L19 7l-2.5 6Z" />
    </>
  ),
  // admin — network of nodes
  network: (
    <>
      <circle cx="12" cy="5" r="2.2" />
      <circle cx="5" cy="18" r="2.2" />
      <circle cx="19" cy="18" r="2.2" />
      <path d="M11 6.8 6.2 16M13 6.8 17.8 16M6.6 18h10.8" />
    </>
  ),
  document: (
    <>
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
      <path d="M14 2.5V6a1 1 0 0 0 1 1h3" />
      <path d="M8 12h8M8 15.5h8M8 18.5h5" />
    </>
  ),
  // formal notice — stamped document
  stamp: (
    <>
      <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
      <path d="M14 2.5V6a1 1 0 0 0 1 1h3" />
      <circle cx="11.5" cy="14.5" r="3.2" />
      <path d="M9.7 14.5h3.6M11.5 12.7v3.6" />
    </>
  ),
  // dossier — folder with a check
  dossier: (
    <>
      <path d="M3 6.5a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11Z" />
      <path d="M9 14.5l2 2 3.5-4" />
    </>
  ),
  handshake: (
    <>
      <path d="M2.5 8.5 6 6h4l2 2" />
      <path d="M21.5 8.5 18 6h-3.5l-4 3.5a1.3 1.3 0 0 0 1.7 2l1.8-1.5" />
      <path d="M14 11.5l2.2 2.2M11.7 13l2 2M9.5 14.7l1.7 1.7" />
      <path d="M2.5 8.5v6l3 2M21.5 8.5v6l-3 2" />
    </>
  ),
  // PV de conciliation — scroll with a check
  conciliation: (
    <>
      <path d="M6 3.5h11a1 1 0 0 1 1 1V18a2.5 2.5 0 0 0 2.5 2.5H8" />
      <path d="M6 3.5A2.5 2.5 0 0 0 3.5 6v13A2.5 2.5 0 0 0 6 21.5" />
      <path d="M9 8.5l1.6 1.6L14 6.7" />
      <path d="M9 13h6M9 16h4" />
    </>
  ),
  // ledger anchor — linked chain
  anchor: (
    <>
      <path d="M8.5 10.5 6 13a3 3 0 0 0 4.2 4.3l2-2" />
      <path d="M15.5 13.5 18 11a3 3 0 0 0-4.2-4.3l-2 2" />
      <path d="M9.5 14.5l5-5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.5 20 5v6c0 5-3.4 8.4-8 10.5C7.4 19.4 4 16 4 11V5l8-2.5Z" />
      <path d="M9 11.5l2.2 2.2L15 9.7" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  upload: (
    <>
      <path d="M12 15V4M8 7.5 12 3.5l4 4" />
      <path d="M4 15v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15" />
    </>
  ),
  download: (
    <>
      <path d="M12 3.5v11M8 11l4 4 4-4" />
      <path d="M4 15v3.5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V15" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
      <path d="M12 17.5V21M8.5 21h7" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  check: <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 2.4 2.5 14.6 0 17M12 3.5c-2.5 2.4-2.5 14.6 0 17" />
    </>
  ),
  logout: (
    <>
      <path d="M14 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h8" />
      <path d="M17 8l4 4-4 4M21 12H10" />
    </>
  ),
  braces: (
    <>
      <path d="M8.5 3.5C6 3.5 6.5 7 6.5 9c0 1.6-1 3-2.5 3 1.5 0 2.5 1.4 2.5 3 0 2-.5 5.5 2 5.5" />
      <path d="M15.5 3.5C18 3.5 17.5 7 17.5 9c0 1.6 1 3 2.5 3-1.5 0-2.5 1.4-2.5 3 0 2 .5 5.5-2 5.5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  filter: <path d="M3.5 5.5h17l-6.5 8v5l-4 2v-7l-6.5-8Z" />,
  alert: (
    <>
      <path d="M12 3.5 21.5 20H2.5L12 3.5Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  sparkle: (
    <path d="M12 3.5c.6 4.2 1.8 5.4 6 6-4.2.6-5.4 1.8-6 6-.6-4.2-1.8-5.4-6-6 4.2-.6 5.4-1.8 6-6Z" />
  ),
  send: <path d="M4 12 20 4l-4 16-4.5-6.5L4 12Z" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  spinner: <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5" />,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className,
  ...rest
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "name">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {P[name]}
    </svg>
  );
}
