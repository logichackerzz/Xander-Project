import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Claude Code mascot SVG path
const MASCOT_PATH = `<path clip-rule="evenodd" d="M20.998 10.949H24v3.102h-3v3.028h-1.487V20H18v-2.921h-1.487V20H15v-2.921H9V20H7.488v-2.921H6V20H4.487v-2.921H3V14.05H0V10.95h3V5h17.998v5.949zM6 10.949h1.488V8.102H6v2.847zm10.51 0H18V8.102h-1.49v2.847z" fill="#D97757" fill-rule="evenodd"></path>`

// 格子大小 = 吉祥物尺寸 + 間距，保證不重疊
const CELL     = 82   // 格子
const SIZE     = 72   // 固定尺寸
const JITTER   = 5    // 最大位移（CELL - SIZE = 10，一半安全）

function createMascot(x, y, rotation, opacity) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width',  SIZE)
  svg.setAttribute('height', SIZE)
  svg.classList.add('s04cc-mascot')
  svg.style.left      = `${x}px`
  svg.style.top       = `${y}px`
  svg.style.opacity   = opacity
  svg.style.transform = `rotate(${rotation}deg)`
  svg.innerHTML       = MASCOT_PATH
  return svg
}

// 橫向橢圓保護區，貼合 "Claude Code" 水平文字
function isInSafeZone(cx, cy, vw, vh) {
  const dx = (cx - vw / 2) / (vw * 0.30)
  const dy = (cy - vh / 2) / (vh * 0.17)
  return dx * dx + dy * dy < 1
}

export function initClaudeCode() {
  const section = document.getElementById('s04')
  if (!section) return undefined

  const container = document.getElementById('s04Mascots')
  const eyebrow   = document.getElementById('s04Eyebrow')
  const lineA     = document.getElementById('s04LineA')
  const lineB     = document.getElementById('s04LineB')
  const sub       = document.getElementById('s04Sub')

  if (!container) return undefined

  // ── 格子鋪滿，跳過橢圓保護區，隨機旋轉破格 ───
  const mascots = []
  const vw   = window.innerWidth
  const vh   = window.innerHeight
  const cols = Math.ceil(vw / CELL) + 1
  const rows = Math.ceil(vh / CELL) + 1

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const jx  = (Math.random() - 0.5) * JITTER * 2
      const jy  = (Math.random() - 0.5) * JITTER * 2
      const x   = c * CELL + jx
      const y   = r * CELL + jy
      const cx  = x + SIZE / 2
      const cy  = y + SIZE / 2
      if (isInSafeZone(cx, cy, vw, vh)) continue

      const rotation = (Math.random() - 0.5) * 50   // ±25°，看起來有機
      const opacity  = 0.30 + Math.random() * 0.55  // 0.30–0.85
      const m = createMascot(x, y, rotation, opacity)
      container.appendChild(m)
      mascots.push(m)
    }
  }

  // ── Initial state ──────────────────────────────
  gsap.set(mascots, { scale: 0, rotation: () => Math.random() * 40 - 20 })
  gsap.set([eyebrow, sub], { opacity: 0, y: 16 })
  gsap.set(lineA, { opacity: 0, x: '-12vw' })
  gsap.set(lineB, { opacity: 0, x: '12vw' })

  // ── Float tweens ───────────────────────────────
  let floatTweens = []

  const startFloat = () => {
    floatTweens.forEach(t => t.kill())
    floatTweens = []
    mascots.forEach((m) => {
      floatTweens.push(
        gsap.to(m, {
          y:        `random(-18, 18)`,
          rotation: `random(-12, 12)`,
          duration: 2.5 + Math.random() * 3.5,
          ease:     'sine.inOut',
          yoyo:     true,
          repeat:   -1,
          delay:    Math.random() * 2,
        })
      )
    })
  }

  // ── Enter ──────────────────────────────────────
  const enter = () => {
    floatTweens.forEach(t => t.kill()); floatTweens = []
    gsap.killTweensOf([...mascots, eyebrow, lineA, lineB, sub])

    gsap.set(mascots, { scale: 0, x: 0, y: 0 })
    gsap.set([eyebrow, sub], { opacity: 0, y: 16 })
    gsap.set(lineA, { opacity: 0, x: '-12vw' })
    gsap.set(lineB, { opacity: 0, x: '12vw' })

    const tl = gsap.timeline({ onComplete: startFloat })

    // ① 吉祥物從四邊湧入——依位置決定從哪個方向
    mascots.forEach((m) => {
      const mx = parseFloat(m.style.left)
      const my = parseFloat(m.style.top)
      const fromX = mx < vw * 0.5 ? -120 : 120
      const fromY = my < vh * 0.5 ? -80  : 80
      gsap.set(m, { x: fromX, y: fromY })
    })

    tl.to(mascots, {
      x:        0,
      y:        0,
      scale:    1,
      duration: 0.7,
      ease:     'expo.out',
      stagger:  { each: 0.008, from: 'edges' },
    })

    // ② 「Claude」從左、「Code」從右衝入
    tl.to(lineA, { opacity: 1, x: 0, duration: 0.65, ease: 'expo.out' }, '-=0.2')
    tl.to(lineB, { opacity: 1, x: 0, duration: 0.65, ease: 'expo.out' }, '-=0.55')

    // ③ eyebrow + sub 淡入
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' }, '-=0.3')
    tl.to(sub,     { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out' }, '-=0.3')
  }

  ScrollTrigger.create({
    trigger: section,
    start:   'top top',
    end:     '+=100%',
    pin:     true,
    anticipatePin: 1,
  })

  return { enter }
}
