import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ── Row definitions ────────────────────────────────
const ROWS = [
  {
    id: 's03Inner0',
    dir: 1,
    dur: 32,
    sep: '✦',
    items: ['資料蒐集與清洗', 'API 串接', '圖表視覺化', '後端建置', '數據儲存', 'UI / UX 設計'],
  },
  {
    id: 's03Inner1',
    dir: -1,
    dur: 44,
    sep: '—',
    items: ['42 後端 API', '19 即時指標', '10+ 資料來源', '8 功能頁面', 'N 件任務', '從零上線', 'Folio · 2026'],
  },
  {
    id: 's03Inner2',
    dir: 1,
    dur: 25,
    sep: '✦',
    items: ['功能除錯', '介面優化', '部署上線', '資料蒐集與清洗', 'API 串接', '圖表視覺化'],
  },
]

function buildRow(items, sep) {
  const html = items
    .map(t => `<span class="s03-item">${t}</span><span class="s03-sep">${sep}</span>`)
    .join('')
  return html + html  // duplicate for seamless loop
}

export function initChecklist() {
  const section = document.getElementById('s03')
  if (!section) return undefined

  // ── Build track contents ───────────────────────
  const inners = []
  ROWS.forEach(({ id, items, sep }) => {
    const el = document.getElementById(id)
    if (!el) return
    el.innerHTML = buildRow(items, sep)
    inners.push(el)
  })

  const trackEls = section.querySelectorAll('.s03-track')
  const eyebrow  = section.querySelector('.s03-eyebrow')
  const badge    = section.querySelector('.s03-badge')
  const ghosts   = section.querySelectorAll('.s03-ghost')

  // ── Initial state ──────────────────────────────
  gsap.set(trackEls, { opacity: 0, skewX: 0 })
  gsap.set(eyebrow,  { opacity: 0, y: -10 })
  gsap.set(badge,    { opacity: 0, scale: 0.75 })
  gsap.set(ghosts,   { opacity: 0, scale: 0.85 })

  // ── Scroll tweens ──────────────────────────────
  let scrollTweens = []

  const stopScrolls = () => {
    scrollTweens.forEach(t => t.kill())
    scrollTweens = []
  }

  const startScrolls = () => {
    inners.forEach((el, i) => {
      const { dir, dur } = ROWS[i]
      const halfW = el.scrollWidth / 2 || 5000
      if (dir === 1) {
        gsap.set(el, { x: 0 })
        scrollTweens.push(gsap.to(el, { x: -halfW, duration: dur, ease: 'none', repeat: -1 }))
      } else {
        gsap.set(el, { x: -halfW })
        scrollTweens.push(gsap.to(el, { x: 0, duration: dur, ease: 'none', repeat: -1 }))
      }
    })
  }

  // ── Floating idle ──────────────────────────────
  const startFloat = () => {}

  // ── Blur-out: called by transition coordinator ──
  const blurOut = () => {
    stopScrolls()
    gsap.to([...trackEls], {
      opacity: 0,
      filter: 'blur(28px)',
      scale: 1.04,
      duration: 0.55,
      ease: 'power2.in',
      stagger: 0.04,
    })
    gsap.to([eyebrow, badge, ghosts], {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
    })
  }

  // ── Enter — C: ghost numbers 先爆出，tracks 穿越而過 ─
  const enter = () => {
    stopScrolls()
    gsap.killTweensOf([...trackEls, eyebrow, badge, ...ghosts])

    // Reset
    gsap.set(trackEls, { opacity: 0, x: (i) => i % 2 === 0 ? '-90vw' : '90vw', skewX: 0 })
    gsap.set(eyebrow,  { opacity: 0, y: -14 })
    gsap.set(badge,    { opacity: 0, scale: 0.72 })
    gsap.set(ghosts,   { opacity: 0, scale: 0.78, filter: 'blur(48px)' })

    const tl = gsap.timeline()

    // ① Ghost 數字從模糊中爆出，像舞台幕布升起
    tl.to(ghosts, {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration: 0.62,
      ease: 'expo.out',
      stagger: 0.1,
    })

    // ② Tracks 從兩側衝入，穿越 ghost 數字（略微提前開始製造交叉感）
    tl.to(trackEls, {
      opacity: 1,
      x: 0,
      duration: 0.72,
      ease: 'expo.out',
      stagger: { each: 0.1, from: 'start' },
    }, '-=0.32')

    // ③ 入場衝力帶出 skewX 殘影，彈性回正
    tl.fromTo(trackEls,
      { skewX: (i) => i % 2 === 0 ? -6 : 6 },
      { skewX: 0, duration: 0.5, ease: 'elastic.out(1, 0.55)', stagger: 0.08 },
      '<0.05'
    )

    // ④ Eyebrow 滑入
    tl.to(eyebrow, { opacity: 1, y: 0, duration: 0.42, ease: 'expo.out' }, '<0.1')

    // ⑤ Badge 彈入
    tl.to(badge, { opacity: 1, scale: 1, duration: 0.65, ease: 'back.out(1.9)' }, '-=0.3')

    setTimeout(startScrolls, 100)
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=100%',
    pin: true,
  })

  return { enter, blurOut }
}
