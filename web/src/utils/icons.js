import React from 'react';

const baseProps = {
  fill: 'none',
  viewBox: '0 0 24 24',
  stroke: 'currentColor',
  strokeWidth: 2,
};

const ICON_PATHS = {
  Target: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  Layers: 'M3 7l9-4 9 4-9 4-9-4zm0 5l9 4 9-4M3 17l9 4 9-4',
  Atom: 'M12 2a3 3 0 013 3c0 .34-.06.66-.17.97 1.6.47 3.25 1.28 4.46 2.5 1.22 1.21 2.03 2.86 2.5 4.46A3 3 0 1121 15a3 3 0 01-3-3c0-.34.06-.66.17-.97-1.6-.47-3.25-1.28-4.46-2.5-1.22-1.21-2.03-2.86-2.5-4.46A3 3 0 113 9a3 3 0 013 3c0 .34-.06.66-.17.97 1.6.47 3.25 1.28 4.46 2.5 1.22 1.21 2.03 2.86 2.5 4.46A3 3 0 1112 2z',
  Database: 'M12 6c4.418 0 8-1.343 8-3s-3.582-3-8-3-8 1.343-8 3 3.582 3 8 3zm8 2.5c0 1.657-3.582 3-8 3s-8-1.343-8-3M20 14c0 1.657-3.582 3-8 3s-8-1.343-8-3M20 19.5c0 1.657-3.582 3-8 3s-8-1.343-8-3',
  Code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  Terminal: 'M8 9l3 3-3 3m5 0h3M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z',
  FileCode: 'M9 12h6m-6 4h6M9 8h1m4 0h1M7 3h6l4 4v14H7a2 2 0 01-2-2V5a2 2 0 012-2z',
  Server: 'M5 12h14M5 7h14M5 17h14M7 7h.01M7 12h.01M7 17h.01',
  GitBranch: 'M6 3v12a3 3 0 103 3h6a3 3 0 003-3V9M6 3a3 3 0 100 6 3 3 0 000-6zm12 12a3 3 0 100 6 3 3 0 000-6z',
};

export function AppIcon({ name, className = 'w-5 h-5' }) {
  const path = ICON_PATHS[name] || ICON_PATHS.Target;

  return (
    <svg {...baseProps} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}
