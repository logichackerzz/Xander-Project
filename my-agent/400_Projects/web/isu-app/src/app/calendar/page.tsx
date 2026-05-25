'use client';

import { useState } from 'react';
import { COURSES } from '@/lib/schedule-data';

/* ── Static todo data (will connect to API later) ── */
interface Todo {
  id: number;
  title: string;
  courseId: string;
  due: string; // YYYY-MM-DD
  done: boolean;
}

const INITIAL_TODOS: Todo[] = [
  { id: 1, title: '專題製作進度報告', courseId: 'A4047000', due: '2026-05-08', done: false },
  { id: 2, title: '網路程式設計作業三', courseId: 'A4024100', due: '2026-05-10', done: false },
  { id: 3, title: '期貨選擇權期中報告', courseId: 'A2331800', due: '2026-05-12', done: false },
  { id: 4, title: '深度學習期末報告', courseId: 'A4008900', due: '2026-05-20', done: false },
  { id: 5, title: '證券投資分析期末考', courseId: 'A2337900', due: '2026-05-22', done: false },
  { id: 6, title: '會計學第五章習題', courseId: 'A2514300', due: '2026-04-28', done: true },
];

const MONTH_NAMES = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
const WEEKDAYS   = ['日', '一', '二', '三', '四', '五', '六'];

/* Which JS weekdays (0-6) have classes */
const CLASS_WEEKDAYS = new Set([1, 2, 3, 4, 5]);

function buildGrid(year: number, month: number): (number | null)[][] {
  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    grid.push(week);
  }
  return grid;
}

function courseForId(id: string) {
  return COURSES.find(c => c.id === id);
}

function formatDue(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function daysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export default function CalendarPage() {
  const today   = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [todos, setTodos] = useState<Todo[]>(INITIAL_TODOS);

  const grid = buildGrid(year, month);

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const toggleTodo = (id: number) =>
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));

  const pending = todos.filter(t => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  const done    = todos.filter(t => t.done);

  return (
    <div className="min-h-screen pb-32" style={{ background: '#F4EFFF' }}>
      {/* Header */}
      <div className="relative overflow-hidden px-5 pt-14 pb-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-25 pointer-events-none"
          style={{ background: 'linear-gradient(135deg, #67e8f9, #818cf8)', filter: 'blur(28px)' }} />
        <div style={{ animation: 'floatIn 0.4s ease-out forwards', opacity: 0 }}>
          <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#9177C9' }}>
            114學年第2學期
          </p>
          <h1 className="text-4xl font-black mt-1 tracking-tight text-gray-800">行事曆</h1>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* ── Mini Calendar ── */}
        <div
          className="bg-white rounded-3xl px-4 pt-4 pb-5 shadow-sm"
          style={{
            boxShadow: '0 4px 24px rgba(2,132,199,0.09)',
            animation: 'floatIn 0.45s ease-out 0.05s forwards',
            opacity: 0,
          }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ background: '#F4EFFF' }}
            >
              <ChevronIcon dir="left" />
            </button>
            <span className="text-base font-black text-gray-800">
              {year} 年 {MONTH_NAMES[month]}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-full active:scale-90 transition-transform"
              style={{ background: '#F4EFFF' }}
            >
              <ChevronIcon dir="right" />
            </button>
          </div>

          {/* Weekday header */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className="text-center text-xs font-semibold py-1"
                style={{ color: i === 0 || i === 6 ? '#FCA5A5' : '#9CA3AF' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Day grid */}
          {grid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((day, di) => {
                if (!day) return <div key={di} />;
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                const dow = new Date(year, month, day).getDay();
                const hasClass = CLASS_WEEKDAYS.has(dow);
                const isWeekend = dow === 0 || dow === 6;

                return (
                  <div key={di} className="flex flex-col items-center py-1 gap-0.5">
                    <div
                      className="w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold"
                      style={{
                        background: isToday ? 'linear-gradient(135deg, #67e8f9, #818cf8)' : 'transparent',
                        color: isToday ? 'white' : isWeekend ? '#FCA5A5' : '#374151',
                        fontWeight: isToday ? 800 : 600,
                      }}
                    >
                      {day}
                    </div>
                    {/* Class indicator dot */}
                    {hasClass && !isToday && (
                      <div className="w-1 h-1 rounded-full" style={{ background: '#818cf8' }} />
                    )}
                    {!hasClass && <div className="w-1 h-1" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Todo list ── */}
        <div style={{ animation: 'floatIn 0.45s ease-out 0.12s forwards', opacity: 0 }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#9177C9' }}>
            待辦事項
          </p>

          {pending.length === 0 && (
            <div className="bg-white rounded-2xl px-4 py-6 text-center shadow-sm">
              <p className="text-sm font-semibold" style={{ color: '#9CA3AF' }}>全部完成了</p>
            </div>
          )}

          <div className="space-y-2">
            {pending.map((todo, i) => {
              const course = courseForId(todo.courseId);
              const left   = daysLeft(todo.due);
              const urgent = left <= 3;
              return (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  course={course}
                  daysLeft={left}
                  urgent={urgent}
                  delay={i}
                  onToggle={() => toggleTodo(todo.id)}
                />
              );
            })}
          </div>

          {/* Completed */}
          {done.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#C9C5D4' }}>
                已完成
              </p>
              <div className="space-y-2 opacity-50">
                {done.map((todo, i) => {
                  const course = courseForId(todo.courseId);
                  return (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      course={course}
                      daysLeft={0}
                      urgent={false}
                      delay={i}
                      onToggle={() => toggleTodo(todo.id)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TodoItem({
  todo, course, daysLeft: left, urgent, delay, onToggle,
}: {
  todo: Todo;
  course: ReturnType<typeof courseForId>;
  daysLeft: number;
  urgent: boolean;
  delay: number;
  onToggle: () => void;
}) {
  return (
    <div
      className="bg-white rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
      style={{
        boxShadow: '0 1px 8px rgba(0,0,0,0.05)',
        animation: `floatIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards`,
        animationDelay: `${delay * 0.05 + 0.15}s`,
        opacity: 0,
      }}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div
        className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all"
        style={{
          borderColor: todo.done ? course?.color ?? '#9CA3AF' : course?.color ?? '#9CA3AF',
          background: todo.done ? (course?.gradient ?? '#9CA3AF') : 'transparent',
        }}
      >
        {todo.done && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Course color dot */}
      <div
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: course?.gradient ?? '#E5E7EB' }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold text-gray-800 ${todo.done ? 'line-through text-gray-400' : ''}`}>
          {todo.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
          {course?.name} · {formatDue(todo.due)}
        </p>
      </div>

      {/* Days left badge */}
      {!todo.done && (
        <span
          className="text-xs font-black px-2 py-0.5 rounded-xl flex-shrink-0"
          style={
            urgent
              ? { background: '#FFF1F2', color: '#E11D48' }
              : { background: '#F4EFFF', color: '#9177C9' }
          }
        >
          {left === 0 ? '今天' : left < 0 ? '逾期' : `${left}天`}
        </span>
      )}
    </div>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      {dir === 'left'
        ? <path d="M10 12L6 8l4-4" stroke="#9177C9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        : <path d="M6 12l4-4-4-4" stroke="#9177C9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      }
    </svg>
  );
}
