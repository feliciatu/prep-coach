const props = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconSparkle({ size = 24, ...rest }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" {...rest}>
      <rect width="24" height="24" rx="6" fill="currentColor" />
      <path
        d="M7 6h5.5a3.5 3.5 0 0 1 0 7H9v5H7V6zm2 5.5h3.5a1.5 1.5 0 0 0 0-3H9v3z"
        fill="white"
      />
    </svg>
  );
}

export function IconBuilding({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 9h.01M15 9h.01M9 14h.01M15 14h.01M9 19h6" />
      <path d="M3 8h18" />
    </svg>
  );
}

export function IconRocket({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function IconTrendingUp({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

export function IconUser({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function IconBriefcase({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="12" strokeWidth="2" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function IconPenTool({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <path d="m12 19 7-7 3 3-7 7-3-3z" />
      <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="m2 2 7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );
}

export function IconUsers({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

export function IconTarget({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function IconBarChart({ size = 24, ...rest }) {
  return (
    <svg {...props} width={size} height={size} {...rest}>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  );
}
