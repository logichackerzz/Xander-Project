'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const TABS = [
  { label: '今日',   href: '/',          color: '#EC4899', Icon: SunIcon      },
  { label: '課表',   href: '/schedule',  color: '#7C3AED', Icon: GridIcon     },
  { label: '行事曆', href: '/calendar',  color: '#0284C7', Icon: CalTodoIcon  },
  { label: '我的',   href: '/profile',   color: '#D97706', Icon: PersonIcon   },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const [pressed, setPressed] = useState<string | null>(null);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 flex justify-center">
      <div className="w-full max-w-sm">
        <div
          className="flex justify-around items-end pt-2 pb-8 px-2"
          style={{
            background: 'rgba(252,252,255,0.90)',
            backdropFilter: 'blur(40px) saturate(160%)',
            WebkitBackdropFilter: 'blur(40px) saturate(160%)',
            borderTop: '0.5px solid rgba(0,0,0,0.09)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
          }}
        >
          {TABS.map(({ label, href, color, Icon }) => {
            const active = pathname === href;
            const isDown = pressed === href;

            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 select-none"
                style={{ minWidth: 64, WebkitUserSelect: 'none' }}
                onPointerDown={() => setPressed(href)}
                onPointerUp={() => setPressed(null)}
                onPointerLeave={() => setPressed(null)}
                onPointerCancel={() => setPressed(null)}
              >
                <div
                  style={{
                    transform: isDown ? 'scale(0.78)' : 'scale(1)',
                    transition: isDown
                      ? 'transform 0.07s ease-in'
                      : 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  <Icon active={active} color={color} />
                </div>
                <span
                  className="text-[10px] font-semibold tracking-wide"
                  style={{
                    color: active ? color : '#B0AEB8',
                    transition: 'color 0.2s ease',
                  }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

/* ── Icons ── */

function SunIcon({ active, color }: { active: boolean; color: string }) {
  const c = active ? color : '#B0AEB8';
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      {active
        ? <circle cx="12" cy="12" r="5.2" fill={c} />
        : <circle cx="12" cy="12" r="4.5" stroke={c} strokeWidth="1.6" />}
      {rays.map(deg => {
        const r0 = active ? 7.8 : 7.2, r1 = active ? 10.4 : 9.6;
        const rad = (deg * Math.PI) / 180;
        return (
          <line key={deg}
            x1={12 + r0 * Math.cos(rad)} y1={12 + r0 * Math.sin(rad)}
            x2={12 + r1 * Math.cos(rad)} y2={12 + r1 * Math.sin(rad)}
            stroke={c} strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

function GridIcon({ active, color }: { active: boolean; color: string }) {
  const c = active ? color : '#B0AEB8';
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      {active ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3.5" fill={c} />
          <line x1="3"  y1="9.5"  x2="21" y2="9.5"  stroke="white" strokeWidth="1.4" strokeOpacity="0.55" />
          <line x1="3"  y1="15.5" x2="21" y2="15.5" stroke="white" strokeWidth="1.4" strokeOpacity="0.55" />
          <line x1="9.5"  y1="9.5" x2="9.5"  y2="21" stroke="white" strokeWidth="1.4" strokeOpacity="0.55" />
          <line x1="15.5" y1="9.5" x2="15.5" y2="21" stroke="white" strokeWidth="1.4" strokeOpacity="0.55" />
        </>
      ) : (
        <>
          <rect x="3" y="3" width="18" height="18" rx="3.5" stroke={c} strokeWidth="1.6" />
          <line x1="3"  y1="9.5"  x2="21" y2="9.5"  stroke={c} strokeWidth="1.3" />
          <line x1="3"  y1="15.5" x2="21" y2="15.5" stroke={c} strokeWidth="1.3" />
          <line x1="9.5"  y1="9.5" x2="9.5"  y2="21" stroke={c} strokeWidth="1.3" />
          <line x1="15.5" y1="9.5" x2="15.5" y2="21" stroke={c} strokeWidth="1.3" />
        </>
      )}
    </svg>
  );
}

function CalTodoIcon({ active, color }: { active: boolean; color: string }) {
  const c = active ? color : '#B0AEB8';
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      {active ? (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3.5" fill={c} />
          <line x1="3" y1="11" x2="21" y2="11" stroke="white" strokeWidth="1.5" strokeOpacity="0.45" />
          <line x1="8"  y1="3" x2="8"  y2="7.5" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
          <line x1="16" y1="3" x2="16" y2="7.5" stroke={c} strokeWidth="2.2" strokeLinecap="round" />
          <path d="M7.5 16.5l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <rect x="3" y="5" width="18" height="16" rx="3.5" stroke={c} strokeWidth="1.6" />
          <line x1="3" y1="11" x2="21" y2="11" stroke={c} strokeWidth="1.5" />
          <line x1="8"  y1="3" x2="8"  y2="7" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
          <line x1="16" y1="3" x2="16" y2="7" stroke={c} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M7.5 16.5l2.5 2.5 5.5-5.5" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

function PersonIcon({ active, color }: { active: boolean; color: string }) {
  const c = active ? color : '#B0AEB8';
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      {active ? (
        <>
          <circle cx="12" cy="8" r="4.5" fill={c} />
          <path d="M3.5 20c0-3.59 3.8-6.5 8.5-6.5s8.5 2.91 8.5 6.5"
            stroke={c} strokeWidth="2.2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="12" cy="8" r="4" stroke={c} strokeWidth="1.6" />
          <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6"
            stroke={c} strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
