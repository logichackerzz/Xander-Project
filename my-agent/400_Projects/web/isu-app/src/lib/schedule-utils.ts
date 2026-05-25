import { COURSES, Course, CourseSlot } from './schedule-data';

export interface ScheduledCourse {
  course: Course;
  slot: CourseSlot;
}

export function timeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function nowMins(now: Date): number {
  return now.getHours() * 60 + now.getMinutes();
}

export function courseDuration(slot: CourseSlot): number {
  return timeToMins(slot.endTime) - timeToMins(slot.startTime);
}

export function getTodayCourses(dayOfWeek: number): ScheduledCourse[] {
  return COURSES
    .flatMap(course =>
      course.slots
        .filter(s => s.day === dayOfWeek)
        .map(slot => ({ course, slot }))
    )
    .sort((a, b) => timeToMins(a.slot.startTime) - timeToMins(b.slot.startTime));
}

export function getCurrentCourse(courses: ScheduledCourse[], now: Date): ScheduledCourse | null {
  const cur = nowMins(now);
  return (
    courses.find(
      ({ slot }) => cur >= timeToMins(slot.startTime) && cur < timeToMins(slot.endTime)
    ) ?? null
  );
}

export function getNextCourse(courses: ScheduledCourse[], now: Date): ScheduledCourse | null {
  const cur = nowMins(now);
  return courses.find(({ slot }) => timeToMins(slot.startTime) > cur) ?? null;
}

export function isPast(slot: CourseSlot, now: Date): boolean {
  return nowMins(now) >= timeToMins(slot.endTime);
}

export function minsUntil(timeStr: string, now: Date): number {
  return timeToMins(timeStr) - nowMins(now);
}

export function minsRemaining(timeStr: string, now: Date): number {
  return timeToMins(timeStr) - nowMins(now);
}

export function formatMins(mins: number): string {
  if (mins < 60) return `${mins} 分鐘`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} 時 ${m} 分` : `${h} 小時`;
}

export function greeting(now: Date): { text: string; emoji: string } {
  const h = now.getHours();
  if (h < 11) return { text: '早安', emoji: '🌸' };
  if (h < 13) return { text: '午安', emoji: '☀️' };
  if (h < 18) return { text: '下午好', emoji: '🍵' };
  return { text: '晚安', emoji: '🌙' };
}
