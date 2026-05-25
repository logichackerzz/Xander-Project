'use client';

import { useEffect, useState, CSSProperties } from 'react';
import {
  getTodayCourses, getCurrentCourse, getNextCourse,
  isPast, minsUntil, minsRemaining, formatMins, greeting,
  courseDuration, ScheduledCourse,
} from '@/lib/schedule-utils';
import { Course, CourseSlot } from '@/lib/schedule-data';
import { useRipple } from '@/hooks/useRipple';

const DAY_ZH  = ['日', '一', '二', '三', '四', '五', '六'];
const MONTH_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ─── helpers ─── */
function stagger(i: number): CSSProperties {
  return { animation: 'floatIn 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards', animationDelay: `${i * 0.07}s`, opacity: 0 };
}

/* ─── page ─── */
export default function TodayPage() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null;

  const jsDay      = now.getDay();
  const isWeekend  = jsDay === 0 || jsDay === 6;
  const todayCourses = isWeekend ? [] : getTodayCourses(jsDay);
  const current    = getCurrentCourse(todayCourses, now);
  const next       = getNextCourse(todayCourses, now);
  const allDone    = todayCourses.length > 0 && todayCourses.every(({ slot }) => isPast(slot, now));
  const { text: greet } = greeting(now);

  return (
    <div className="min-h-screen pb-32" style={{ background: '#F4EFFF' }}>

      {/* ── Hero header ── */}
      <div className="relative overflow-hidden px-5 pt-14 pb-8">
        {/* Decorative blobs */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-40 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8)', filter: 'blur(32px)', animation: 'heroBlob 8s ease-in-out infinite' }} />
        <div className="absolute top-8 -left-10 w-36 h-36 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #f9a8d4, #fcd34d)', filter: 'blur(28px)', animation: 'heroBlob 10s ease-in-out infinite reverse' }} />

        <div className="relative" style={stagger(0)}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9177C9' }}>
            星期{DAY_ZH[jsDay]} · {MONTH_EN[now.getMonth()]} {now.getDate()}
          </p>
          <h1 className="text-4xl font-black mt-1 tracking-tight text-gray-800">
            {greet}
          </h1>
          <p className="text-base mt-0.5 font-medium" style={{ color: '#A084D0' }}>
            {allDone ? '今天課程全部結束了' : isWeekend ? '今天不用上課' : `今天有 ${todayCourses.length} 堂課`}
          </p>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── 現在 ── */}
        {current && (
          <section style={stagger(1)}>
            <SectionLabel>現在上課中</SectionLabel>
            <ActiveCard sc={current} now={now} />
          </section>
        )}

        {/* ── 接下來（沒課時） ── */}
        {!current && next && (
          <section style={stagger(1)}>
            <SectionLabel>接下來</SectionLabel>
            <NextCard sc={next} now={now} />
          </section>
        )}

        {/* ── 稍後（上課中且還有下堂） ── */}
        {current && next && (
          <section style={stagger(2)}>
            <SectionLabel>稍後</SectionLabel>
            <MiniCard sc={next} />
          </section>
        )}

        {/* ── 今日課表 ── */}
        {todayCourses.length > 0 && (
          <section style={stagger(current ? 3 : 2)}>
            <SectionLabel>今日課表</SectionLabel>
            <div className="space-y-2.5">
              {todayCourses.map(({ course, slot }, i) => (
                <CourseListItem key={`${course.id}-${i}`} course={course} slot={slot} now={now} current={current} delay={i} />
              ))}
            </div>
          </section>
        )}

        {/* ── 空狀態 ── */}
        {(isWeekend || allDone || todayCourses.length === 0) && !current && (
          <div className="flex flex-col items-center justify-center pt-16 gap-3 text-center" style={stagger(2)}>
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg"
              style={{ background: 'linear-gradient(135deg, #f9a8d4, #c084fc)' }}
            >
              {isWeekend ? '🗓' : '✓'}
            </div>
            <h2 className="text-2xl font-black text-gray-800">{isWeekend ? '今天休息日' : '今日課程全部結束'}</h2>
            <p className="text-sm font-medium" style={{ color: '#A084D0' }}>
              {isWeekend ? '好好放鬆充電' : '辛苦了，明天繼續加油'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-black uppercase tracking-widest mb-2.5" style={{ color: '#9177C9' }}>
      {children}
    </p>
  );
}

function ActiveCard({ sc, now }: { sc: ScheduledCourse; now: Date }) {
  const { course, slot } = sc;
  const remaining = minsRemaining(slot.endTime, now);
  const total = courseDuration(slot);
  const progress = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const { trigger, elements } = useRipple();

  return (
    <div
      className="rounded-3xl overflow-hidden shadow-xl relative cursor-pointer active:scale-[0.98] transition-transform"
      style={{ boxShadow: `0 8px 32px ${course.color}33` }}
      onClick={trigger}
    >
      {elements}

      {/* Gradient top strip */}
      <div className="h-1.5" style={{ background: course.gradient }} />

      <div className="bg-white px-5 pt-4 pb-5">
        {/* Header row */}
        <div className="flex items-center justify-between mb-3">
          {/* Pulsing badge */}
          <div className="flex items-center gap-2">
            <div className="relative flex h-3 w-3">
              <div className="absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: course.color, animation: 'pulseRing 1.4s ease-out infinite' }} />
              <div className="relative inline-flex rounded-full h-3 w-3" style={{ background: course.color }} />
            </div>
            <span className="text-xs font-black tracking-wide" style={{ color: course.color }}>上課中</span>
          </div>
          <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
            {slot.startTime} – {slot.endTime}
          </span>
        </div>

        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{course.name}</h2>
        <p className="text-sm font-semibold mt-1" style={{ color: '#6B7280' }}>{course.teacher}</p>
        <p className="text-sm mt-0.5 flex items-center gap-1" style={{ color: '#9CA3AF' }}>
          <span>📍</span>
          {course.building} {course.room}
        </p>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>
            <span>還剩 <strong style={{ color: course.color }}>{remaining}</strong> 分鐘</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F3F4F6' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: course.gradient,
                animation: 'progressFill 1s ease-out',
                transition: 'width 30s linear',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function NextCard({ sc, now }: { sc: ScheduledCourse; now: Date }) {
  const { course, slot } = sc;
  const until = minsUntil(slot.startTime, now);
  const { trigger, elements } = useRipple();

  return (
    <div
      className="bg-white rounded-3xl px-5 py-4 shadow-sm relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
      style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
      onClick={trigger}
    >
      {elements}
      {/* Soft gradient tint in corner */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-15 pointer-events-none"
        style={{ background: course.gradient }} />

      <div className="flex items-start justify-between gap-3 relative">
        <div>
          <p className="text-xs font-medium mb-1" style={{ color: '#9CA3AF' }}>
            {slot.startTime} – {slot.endTime}
          </p>
          <h2 className="text-xl font-black text-gray-800 tracking-tight">{course.name}</h2>
          <p className="text-sm font-semibold mt-1" style={{ color: '#6B7280' }}>{course.teacher}</p>
          <p className="text-sm mt-0.5" style={{ color: '#9CA3AF' }}>📍 {course.building} {course.room}</p>
        </div>

        {/* Countdown pill */}
        <div
          className="flex-shrink-0 px-3 py-1.5 rounded-2xl text-xs font-black text-white"
          style={{ background: course.gradient, boxShadow: `0 4px 12px ${course.color}40` }}
        >
          {formatMins(until)}後
        </div>
      </div>
    </div>
  );
}

function MiniCard({ sc }: { sc: ScheduledCourse }) {
  const { course, slot } = sc;
  return (
    <div
      className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}
    >
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0"
        style={{ background: course.gradient }}
      />
      <div className="flex-1 min-w-0">
        <span className="font-black text-sm text-gray-800">{course.name}</span>
        <span className="text-xs ml-2" style={{ color: '#9CA3AF' }}>{course.building} {course.room}</span>
      </div>
      <span className="text-xs font-semibold flex-shrink-0" style={{ color: '#9CA3AF' }}>{slot.startTime}</span>
    </div>
  );
}

function CourseListItem({
  course, slot, now, current, delay,
}: {
  course: Course; slot: CourseSlot; now: Date;
  current: ScheduledCourse | null; delay: number;
}) {
  const { trigger, elements } = useRipple();
  const done   = isPast(slot, now);
  const active = current?.course.id === course.id;

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex items-center gap-3 px-4 py-3 cursor-pointer active:scale-[0.98] transition-transform"
      style={{
        background: active ? course.softBg : 'white',
        boxShadow: active ? `0 4px 16px ${course.color}22` : '0 1px 8px rgba(0,0,0,0.05)',
        border: active ? `1.5px solid ${course.color}33` : '1.5px solid transparent',
        opacity: done && !active ? 0.45 : 1,
        animation: `floatIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards`,
        animationDelay: `${delay * 0.06 + 0.2}s`,
      }}
      onClick={trigger}
    >
      {elements}

      {/* Colored stripe */}
      <div
        className="w-1 self-stretch rounded-full min-h-10 flex-shrink-0"
        style={{ background: done ? '#E5E7EB' : course.gradient }}
      />

      {/* Course icon */}
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: done ? '#F3F4F6' : `${course.color}15` }}
      >
        <div
          className="w-3 h-3 rounded-full"
          style={{ background: done ? '#D1D5DB' : course.gradient }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-black text-sm ${done ? 'text-gray-300 line-through' : 'text-gray-800'}`}>
            {course.name}
          </span>
          <span className="text-xs flex-shrink-0" style={{ color: '#9CA3AF' }}>{slot.startTime}</span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          {course.teacher} · {course.building} {course.room}
        </p>
      </div>

      {active && (
        <span
          className="flex-shrink-0 text-xs font-black px-2.5 py-1 rounded-xl text-white"
          style={{ background: course.gradient }}
        >
          進行中
        </span>
      )}

      {done && (
        <svg className="flex-shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="#D1D5DB" strokeWidth="1.5" />
          <path d="M5 8l2 2 4-4" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}
