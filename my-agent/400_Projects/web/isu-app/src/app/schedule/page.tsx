'use client';

import { useState } from 'react';
import { COURSES, PERIOD_TIMES, Course } from '@/lib/schedule-data';
import { useRipple } from '@/hooks/useRipple';

const PERIODS = ['1', '2', '3', '4', 'Z', '5', '6', '7', '8', '9'];
const DAYS = [
  { label: '一', num: 1 },
  { label: '二', num: 2 },
  { label: '三', num: 3 },
  { label: '四', num: 4 },
  { label: '五', num: 5 },
];

interface GridCell { course: Course; span: number; render: boolean; }

function buildGrid(): Record<string, Record<number, GridCell>> {
  const grid: Record<string, Record<number, GridCell>> = {};
  PERIODS.forEach(p => (grid[p] = {}));
  COURSES.forEach(course => {
    course.slots.forEach(slot => {
      const inGrid = slot.periods.filter(p => PERIODS.includes(p));
      inGrid.forEach((period, idx) => {
        grid[period][slot.day] = { course, span: inGrid.length, render: idx === 0 };
      });
    });
  });
  return grid;
}

const GRID = buildGrid();

export default function SchedulePage() {
  const [selected, setSelected] = useState<Course | null>(null);

  return (
    <div className="min-h-screen pb-32" style={{ background: '#F4EFFF' }}>
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-30 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #818cf8, #c4b5fd)', filter: 'blur(28px)' }} />
        <div style={{ animation: 'floatIn 0.4s ease-out forwards', opacity: 0 }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9177C9' }}>
            114學年第2學期
          </p>
          <h1 className="text-4xl font-black mt-1 tracking-tight text-gray-800">課表</h1>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Grid */}
        <div
          className="rounded-3xl overflow-hidden shadow-md"
          style={{
            background: 'white',
            boxShadow: '0 4px 24px rgba(120,80,200,0.10)',
            animation: 'floatIn 0.45s ease-out 0.1s forwards',
            opacity: 0,
          }}
        >
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'linear-gradient(90deg, #ede9fe, #fce7f3)' }}>
                <th className="w-8 py-2.5" />
                {DAYS.map(d => (
                  <th key={d.num}
                    className="text-center py-2.5 text-xs font-black"
                    style={{ color: '#7C3AED' }}
                  >
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period) => (
                <tr key={period} style={{ borderTop: '1px solid #F3F4F6' }}>
                  <td className="text-center align-top pt-2 w-8"
                    style={{ color: '#D1D5DB', fontSize: '9px', lineHeight: 1.3 }}>
                    <div className="font-bold">{period}</div>
                    <div>{PERIOD_TIMES[period].start.slice(0, 5)}</div>
                  </td>

                  {DAYS.map(d => {
                    const cell = GRID[period]?.[d.num];
                    if (!cell) return (
                      <td key={d.num} className="py-1 px-0.5 align-top">
                        <div className="h-10" />
                      </td>
                    );
                    if (!cell.render) return null;

                    return (
                      <td key={d.num} rowSpan={cell.span} className="py-1 px-0.5 align-top">
                        <GridCell course={cell.course} span={cell.span} onSelect={setSelected} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Course list */}
        <div style={{ animation: 'floatIn 0.45s ease-out 0.2s forwards', opacity: 0 }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#9177C9' }}>
            課程列表
          </p>
          <div className="space-y-2.5">
            {COURSES.map((course, i) => (
              <CourseCard key={course.id} course={course} delay={i} onSelect={setSelected} />
            ))}
          </div>
        </div>
      </div>

      {selected && <CourseSheet course={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function GridCell({ course, span, onSelect }: { course: Course; span: number; onSelect: (c: Course) => void }) {
  const { trigger, elements } = useRipple();
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer active:scale-95 transition-transform relative"
      style={{
        background: `${course.color}18`,
        borderLeft: `3px solid ${course.color}`,
        minHeight: `${span * 44 - 6}px`,
        animation: 'fadeSlideUp 0.3s ease-out forwards',
      }}
      onClick={e => { trigger(e); onSelect(course); }}
    >
      {elements}
      <div className="p-1.5">
        <p className="font-black leading-tight" style={{ color: course.color, fontSize: '10px' }}>
          {course.name.length > 5 ? course.name.slice(0, 5) + '…' : course.name}
        </p>
        {span > 1 && (
          <p style={{ color: course.color, fontSize: '9px', opacity: 0.65 }} className="mt-0.5">
            {course.room}
          </p>
        )}
      </div>
    </div>
  );
}

function CourseCard({ course, delay, onSelect }: { course: Course; delay: number; onSelect: (c: Course) => void }) {
  const { trigger, elements } = useRipple();
  return (
    <div
      className="bg-white rounded-2xl px-4 py-3.5 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform shadow-sm"
      style={{
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        animation: `floatIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards`,
        animationDelay: `${delay * 0.06 + 0.25}s`,
        opacity: 0,
      }}
      onClick={e => { trigger(e); onSelect(course); }}
    >
      {elements}
      <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl" style={{ background: course.gradient }} />
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl flex-shrink-0" style={{ background: course.gradient }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-black text-sm text-gray-800 truncate">{course.name}</span>
            <span
              className="text-xs flex-shrink-0 px-2.5 py-0.5 rounded-xl font-black"
              style={
                course.type === 'required'
                  ? { background: '#EDE9FE', color: '#7C3AED' }
                  : { background: '#F3F4F6', color: '#6B7280' }
              }
            >
              {course.type === 'required' ? '必修' : '選修'}
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
            {course.teacher} · {course.credits} 學分 · {course.building} {course.room}
          </p>
        </div>
      </div>
    </div>
  );
}

function CourseSheet({ course, onClose }: { course: Course; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)' }} />
      <div
        className="relative w-full max-w-sm rounded-t-3xl pb-12 z-50 overflow-hidden"
        style={{
          background: 'white',
          animation: 'floatIn 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.12)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient top */}
        <div className="h-2" style={{ background: course.gradient }} />

        <div className="px-6 pt-5">
          <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#E5E7EB' }} />

          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl flex-shrink-0" style={{ background: course.gradient }} />
            <div>
              <h2 className="text-xl font-black text-gray-800">{course.name}</h2>
              <p className="text-xs mt-0.5 font-medium" style={{ color: '#9CA3AF' }}>{course.id}</p>
            </div>
          </div>

          <div className="space-y-1">
            <SheetRow label="授課教師" value={course.teacher} />
            <SheetRow label="教室" value={`${course.building} ${course.room}`} />
            <SheetRow label="學分" value={`${course.credits} 學分`} />
            <SheetRow label="類別" value={course.type === 'required' ? '必修' : '選修'} />
          </div>

          <button
            className="mt-5 w-full py-3.5 rounded-2xl text-sm font-black"
            style={{ background: course.softBg, color: course.color }}
            onClick={onClose}
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
}

function SheetRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
      <span className="text-sm" style={{ color: '#9CA3AF' }}>{label}</span>
      <span className="text-sm font-black text-gray-800">{value}</span>
    </div>
  );
}
