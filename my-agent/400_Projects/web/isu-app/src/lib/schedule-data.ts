export interface CourseSlot {
  day: number; // 1=Mon … 5=Fri
  periods: string[];
  startTime: string;
  endTime: string;
}

export interface Course {
  id: string;
  name: string;
  teacher: string;
  room: string;
  building: string;
  credits: number;
  type: 'required' | 'elective';
  color: string;     // darker accent for text on white
  gradient: string;  // CSS linear-gradient for card decoration
  softBg: string;    // very light bg tint
  slots: CourseSlot[];
}

export const PERIOD_TIMES: Record<string, { start: string; end: string }> = {
  '1': { start: '08:20', end: '09:10' },
  '2': { start: '09:20', end: '10:10' },
  '3': { start: '10:20', end: '11:10' },
  '4': { start: '11:20', end: '12:10' },
  'Z': { start: '12:20', end: '13:10' },
  '5': { start: '13:30', end: '14:20' },
  '6': { start: '14:30', end: '15:20' },
  '7': { start: '15:30', end: '16:20' },
  '8': { start: '16:30', end: '17:20' },
  '9': { start: '17:30', end: '18:20' },
  'A': { start: '18:50', end: '19:35' },
  'B': { start: '19:40', end: '20:25' },
  'C': { start: '20:30', end: '21:15' },
  'D': { start: '21:20', end: '22:05' },
};

export const COURSES: Course[] = [
  {
    id: 'A4008900',
    name: '深度學習',
    teacher: '孫志彬',
    room: '03117',
    building: '科技大樓',
    credits: 3,
    type: 'required',
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #c084fc 0%, #818cf8 100%)',
    softBg: '#F5F3FF',
    slots: [{ day: 3, periods: ['7', '8', '9'], startTime: '15:30', endTime: '18:20' }],
  },
  {
    id: 'A4024100',
    name: '網路程式設計',
    teacher: '葉建寧',
    room: '03717',
    building: '科技大樓',
    credits: 3,
    type: 'required',
    color: '#059669',
    gradient: 'linear-gradient(135deg, #6ee7b7 0%, #22d3ee 100%)',
    softBg: '#F0FDF9',
    slots: [{ day: 1, periods: ['2', '3', '4'], startTime: '09:20', endTime: '12:10' }],
  },
  {
    id: 'A4047000',
    name: '專題製作',
    teacher: '黃宏財',
    room: '50415',
    building: '綜合大樓',
    credits: 3,
    type: 'required',
    color: '#D97706',
    gradient: 'linear-gradient(135deg, #fcd34d 0%, #fb923c 100%)',
    softBg: '#FFFBEB',
    slots: [
      { day: 2, periods: ['1'], startTime: '08:20', endTime: '09:10' },
      { day: 4, periods: ['1'], startTime: '08:20', endTime: '09:10' },
      { day: 5, periods: ['1'], startTime: '08:20', endTime: '09:10' },
    ],
  },
  {
    id: 'A2321200',
    name: '財務管理（二）',
    teacher: '吳昇曄',
    room: '01802',
    building: '行政大樓',
    credits: 3,
    type: 'elective',
    color: '#DB2777',
    gradient: 'linear-gradient(135deg, #f9a8d4 0%, #f87171 100%)',
    softBg: '#FFF1F2',
    slots: [{ day: 2, periods: ['2', '3', '4'], startTime: '09:20', endTime: '12:10' }],
  },
  {
    id: 'A2331800',
    name: '期貨選擇權',
    teacher: '林雅玲',
    room: '50509',
    building: '綜合大樓',
    credits: 3,
    type: 'elective',
    color: '#4338CA',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #c4b5fd 100%)',
    softBg: '#EEF2FF',
    slots: [{ day: 4, periods: ['5', '6', '7'], startTime: '13:30', endTime: '16:20' }],
  },
  {
    id: 'A2337900',
    name: '證券投資分析',
    teacher: '吳昇曄',
    room: '01910',
    building: '行政大樓',
    credits: 3,
    type: 'elective',
    color: '#0284C7',
    gradient: 'linear-gradient(135deg, #67e8f9 0%, #818cf8 100%)',
    softBg: '#F0F9FF',
    slots: [{ day: 3, periods: ['2', '3', '4'], startTime: '09:20', endTime: '12:10' }],
  },
  {
    id: 'A2514300',
    name: '會計學(二)',
    teacher: '曾秀梅',
    room: '01817',
    building: '行政大樓',
    credits: 3,
    type: 'elective',
    color: '#EA580C',
    gradient: 'linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)',
    softBg: '#FFF7ED',
    slots: [{ day: 1, periods: ['7', '8', '9'], startTime: '15:30', endTime: '18:20' }],
  },
];
