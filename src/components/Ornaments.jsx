// Decorative SVG artwork (hidden from screen readers).

const LEAF = 'M0 0C7-7 19-8 28 0C19 8 7 7 0 0Z';

function Bloom({ x, y, r }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-r * 0.55}
          rx={r * 0.46}
          ry={r * 0.62}
          transform={`rotate(${a})`}
          fill="var(--blush)"
          stroke="var(--rose)"
          strokeWidth="0.8"
        />
      ))}
      {[36, 108, 180, 252, 324].map((a) => (
        <ellipse
          key={a}
          cx="0"
          cy={-r * 0.32}
          rx={r * 0.26}
          ry={r * 0.36}
          transform={`rotate(${a})`}
          fill="var(--blush-light)"
          stroke="var(--rose)"
          strokeWidth="0.6"
        />
      ))}
      <circle r={r * 0.18} fill="var(--champagne)" stroke="var(--gold)" strokeWidth="0.8" />
    </g>
  );
}

const LEAVES = [
  [28, 184, -150], [28, 184, -40],
  [52, 152, -160], [54, 152, -30],
  [82, 122, -150], [84, 122, -25],
  [110, 96, -140], [112, 96, -20],
  [96, 122, 10], [118, 124, -60],
  [50, 118, -120], [48, 104, -60],
];

export function FloralSprig({ className = '' }) {
  return (
    <svg className={`floral ${className}`} viewBox="0 0 220 220" aria-hidden="true" focusable="false">
      <g fill="none" stroke="var(--gold)" strokeWidth="1.2" strokeLinecap="round">
        <path d="M8 212C40 160 70 120 150 60" />
        <path d="M70 128C92 118 112 120 140 132" />
        <path d="M44 162C40 130 46 106 60 84" />
        <path d="M120 86C132 70 150 54 176 46" />
      </g>
      {LEAVES.map(([x, y, rot]) => (
        <path
          key={`${x}-${y}-${rot}`}
          d={LEAF}
          transform={`translate(${x} ${y}) rotate(${rot}) scale(0.8)`}
          fill="var(--champagne)"
          stroke="var(--gold)"
          strokeWidth="0.9"
        />
      ))}
      <Bloom x={150} y={60} r={20} />
      <Bloom x={140} y={132} r={13} />
      <Bloom x={60} y={84} r={11} />
      <ellipse cx="178" cy="45" rx="4" ry="7" transform="rotate(60 178 45)" fill="var(--blush)" stroke="var(--rose)" strokeWidth="0.7" />
      <g fill="var(--gold)">
        <circle cx="186" cy="70" r="1.6" />
        <circle cx="100" cy="150" r="1.4" />
        <circle cx="170" cy="100" r="1.2" />
        <circle cx="30" cy="140" r="1.2" />
      </g>
    </svg>
  );
}

export function Divider({ className = '' }) {
  return (
    <svg className={`divider ${className}`} viewBox="0 0 240 24" aria-hidden="true" focusable="false">
      <g stroke="var(--gold)" strokeWidth="1" fill="none" strokeLinecap="round">
        <path d="M8 12H96" />
        <path d="M144 12H232" />
        <path d="M120 3l9 9-9 9-9-9z" fill="var(--blush-light)" />
      </g>
      <g fill="var(--gold)">
        <circle cx="102" cy="12" r="1.6" />
        <circle cx="138" cy="12" r="1.6" />
        <circle cx="4" cy="12" r="1.2" />
        <circle cx="236" cy="12" r="1.2" />
      </g>
    </svg>
  );
}

export function Icon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
    focusable: 'false',
    className: 'icon',
  };
  if (name === 'calendar')
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        <path d="M12 16.6l-2.1-2a1.2 1.2 0 0 1 1.7-1.8l.4.4.4-.4a1.2 1.2 0 0 1 1.7 1.8z" />
      </svg>
    );
  if (name === 'clock')
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </svg>
    );
  if (name === 'pin')
    return (
      <svg {...common}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.4" />
      </svg>
    );
  if (name === 'arrow')
    return (
      <svg {...common}>
        <path d="M12 5v14M6.5 13.5 12 19l5.5-5.5" />
      </svg>
    );
  if (name === 'download')
    return (
      <svg {...common}>
        <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />
      </svg>
    );
  if (name === 'external')
    return (
      <svg {...common}>
        <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
    );
  return null;
}
