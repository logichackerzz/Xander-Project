import '@fontsource/urbanist/700.css'
import '@fontsource/urbanist/800.css'
import '@fontsource/dancing-script/700.css'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Splitting from 'splitting'

import { initHero }        from './sections/s01-hero.js'
import { initNaming }      from './sections/s02-naming.js'
import { initChecklist }   from './sections/s04-checklist.js'
import { initClaudeCode }  from './sections/s04-claudecode.js'

// ── Plugins ───────────────────────────────────────
gsap.registerPlugin(ScrollTrigger)
Splitting()

// ── Lenis ─────────────────────────────────────────
const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)

// ── Progress bar ──────────────────────────────────
const progressBar  = document.getElementById('progressBar')
const chapterNum   = document.getElementById('chapterNum')
const chapterLabel = document.getElementById('chapterLabel')

ScrollTrigger.create({
  start: 0, end: 'max',
  onUpdate: (self) => gsap.set(progressBar, { width: `${self.progress * 100}%` }),
})

// ── Chapter label + background colour per section ─
document.querySelectorAll('.s[data-chapter]').forEach((s) => {
  const bg = s.dataset.bg || '#07050F'

  const updateNav = () => {
    chapterNum.textContent   = s.dataset.chapter
    chapterLabel.textContent = s.dataset.label
    gsap.to('body', { backgroundColor: bg, duration: 1.2, ease: 'power2.inOut' })
  }

  ScrollTrigger.create({
    trigger: s,
    start: 'top top',
    end: '+=100%',
    onEnter:     updateNav,
    onEnterBack: updateNav,
  })
})

// ── Init sections ─────────────────────────────────
const controllers = []
controllers[0] = initHero()      // { enter, exit }
controllers[1] = initNaming()    // { enter, exit, getBeat }
controllers[2] = initChecklist()  // { enter, blurOut } — 工作清單 #s03
controllers[3] = initClaudeCode() // { enter }          — Claude Code #s04

// ── Refresh after all pins created ────────────────
ScrollTrigger.refresh()

// ── Page Transition Overlay ───────────────────────
const overlay = document.getElementById('pageTrans')

/**
 * Transition coordinator — returns lock duration (seconds)
 *
 * Strategy A — custom exit() (S01, S02):
 *   exit animation IS the transition; scroll fired at section-specific timing
 * Strategy B — no custom exit (S05–S08):
 *   quick bg flash hides instant scroll
 * Strategy FOLIO — S02 Beat3：
 *   FOLIO sweep overlay → LIVE DEMO 在同一 canvas 爆炸（不換頁）
 *   爆炸完 idle float，下次滾動用 Strategy B 前往 S05
 */

// demoPlayed：FOLIO 爆炸後設 true，防止二次觸發
let demoPlayed = false
// demoShowing：LIVE DEMO spotlight 實際在畫面上時為 true
// ← 與 demoPlayed 分開：demoPlayed 永不重設，demoShowing 只在 cleanup 後變 false
let demoShowing = false

const runTransition = (from, to, dir, snapPositions) => {
  const fromCtrl = controllers[from]
  const toCtrl   = controllers[to]
  const ptBg     = overlay.querySelector('.pt-bg')

  const doScroll = () => {
    window.scrollTo(0, snapPositions[to])
    ScrollTrigger.update()
  }
  const doEnter = () => {
    if (toCtrl?.enter) toCtrl.enter(dir)
  }

  // ── FOLIO sweep: S02 Beat3 → LIVE DEMO 原地爆炸（不換頁）────
  if (from === 1 && to === 2 && dir === 1 && !demoPlayed && controllers[1]?.getBeat?.() === 3) {
    demoPlayed = true
    demoShowing = true
    controllers[1]?.cancel?.()
    triggerFolioToDemo()
    return 3.0   // FOLIO sweep（~1.5s）+ Spotlight 壓暗（~1.2s）= 鎖定 3s

  // ── Demo 結束後：fade overlay → 前往 S04 ────────────
  // 只有 spotlight 實際在畫面上（demoShowing）才做 cleanup；
  // 若只是 demoPlayed=true 但已 cleanup，就讓 Strategy A 正常處理 beats
  } else if (from === 1 && to === 2 && dir === 1 && demoShowing) {
    const ptBg2        = overlay.querySelector('.pt-bg')
    const ptVig2       = document.getElementById('ptVignette')
    const ptBadge2     = document.getElementById('ptLiveBadge')
    const demoLetters2 = Array.from(overlay.querySelectorAll('.pt-dl'))
    const mid          = (demoLetters2.length - 1) / 2

    gsap.killTweensOf(demoLetters2)

    gsap.timeline()
      // ① badge + vignette 快速消失
      .to([ptBadge2, ptVig2], { opacity: 0, duration: 0.18, ease: 'power2.in' })
      // ② LIVE DEMO 字母向上炸散，從中心往外 stagger
      .to(demoLetters2, {
        y: -130,
        x: (i) => (i - mid) * 55,
        opacity: 0,
        scale: 0.5,
        filter: 'blur(14px)',
        duration: 0.52,
        ease: 'power3.in',
        stagger: { each: 0.04, from: 'center' },
      }, '-=0.05')
      // ③ 換頁 + S03 tracks 衝入（ptBg 仍遮住，避免閃爍）
      .call(() => {
        demoShowing = false
        doScroll()
        ScrollTrigger.update()
        gsap.set(progressBar, { opacity: 1 })
        gsap.delayedCall(0.06, () => controllers[2]?.enter?.())
      })
      // ④ ptBg 緩緩退場，讓 S03 漸漸透出
      .to(ptBg2, { opacity: 0, duration: 0.55, ease: 'power2.out' }, '+=0.15')

    return 1.8

  // ── Strategy ? : S03 → S04 疑問轉場 ─────────────────
  } else if (from === 2 && to === 3 && dir === 1) {
    const ptBg    = overlay.querySelector('.pt-bg')
    const ptQmark = document.getElementById('ptQmark')

    controllers[2]?.blurOut?.()

    gsap.set(ptBg,    { opacity: 0, backgroundColor: '#0D0D0D' })
    gsap.set(ptQmark, { opacity: 0, scale: 0.6, filter: 'blur(50px)' })

    gsap.timeline()
      .to(ptBg,    { opacity: 1, duration: 0.45, ease: 'power2.in' })
      .to(ptQmark, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.75, ease: 'expo.out' }, '-=0.1')
      .call(() => { doScroll(); doEnter() }, null, '+=0.85')
      .to(ptQmark, { opacity: 0, scale: 1.25, filter: 'blur(30px)', duration: 0.55, ease: 'power2.in' })
      .to(ptBg,    { opacity: 0, duration: 0.3, ease: 'power2.out' }, '-=0.2')

    return 2.8

  // ── Strategy A: custom exit ───────────────────────────
  } else if (fromCtrl?.exit) {
    const exitResult = fromCtrl.exit(dir)

    if (exitResult?.beat2) return 2.8   // on-page beat, stay locked longer

    const scrollAt = from === 0 ? 0.28   // S01: title mid-flight
                   : from === 1 ? 0.32   // S02: letters shot away
                   : 0.35
    gsap.delayedCall(scrollAt,        doScroll)
    gsap.delayedCall(scrollAt + 0.06, doEnter)
    return 1.3

  // ── Strategy B: bg flash ──────────────────────────────
  } else {
    gsap.set(ptBg, { opacity: 0 })
    gsap.timeline()
      .to(ptBg, { opacity: 1, duration: 0.1, ease: 'none' })
      .call(() => { doScroll(); doEnter() })
      .to(ptBg, { opacity: 0, duration: 0.18, ease: 'power1.out' }, '+=0.04')
    return 1.5  // covers fade-in stagger animation (~1.1s) + buffer
  }
}

// ── FOLIO → LIVE DEMO Spotlight ────────────────────────
// ① FOLIO 飛入落定
// ② LIVE DEMO 從左跟進，落在中央
// ③ 背景壓暗 + 暗角暈染 + 文字 glow
// ④ ● LIVE 指示器出現 + 文字輕呼吸
//    → 下次滾動走 demoPlayed Strategy B 前往 S05
const triggerFolioToDemo = () => {
  const ptBg        = overlay.querySelector('.pt-bg')
  const ptVignette  = document.getElementById('ptVignette')
  const ptLiveBadge = document.getElementById('ptLiveBadge')
  const folioLetters = Array.from(overlay.querySelectorAll('.pt-l'))
  const demoLetters  = Array.from(overlay.querySelectorAll('.pt-dl'))

  // 重設所有 overlay 元素
  gsap.set('#s02 .s02-beat3-wrap', { opacity: 0 })
  gsap.set(ptBg,         { opacity: 0, backgroundColor: '#F4F3FF' })
  gsap.set(ptVignette,   { opacity: 0 })
  gsap.set(ptLiveBadge,  { opacity: 0 })
  gsap.set(folioLetters, { x: '-120vw', opacity: 1 })
  gsap.set(demoLetters,  { x: '-120vw', y: 0, rotation: 0, opacity: 1, scale: 1, filter: 'none' })
  gsap.set(progressBar,  { opacity: 0 })   // z-index 1000，先隱藏防跳動

  const tl = gsap.timeline()

  // ① ptBg 淡入（白色，遮住 S02 背景）
  tl.to(ptBg, { opacity: 1, duration: 0.12, ease: 'none' })

  // ② FOLIO 從左飛入落定
  tl.to(folioLetters, {
    x: 0, duration: 0.45, ease: 'power4.out',
    stagger: { each: 0.055, from: 'start' },
  }, '<0.02')

  // ③ FOLIO 往右退場，LIVE DEMO 從左跟進
  tl.to(folioLetters, {
    x: '130vw', duration: 0.4, ease: 'power3.in',
    stagger: { each: 0.045, from: 'start' },
  }, '+=0.1')
  tl.to(demoLetters, {
    x: 0, y: 0, duration: 0.45, ease: 'power4.out',
    stagger: { each: 0.04, from: 'start' },
  }, '<')

  // ④ LIVE DEMO 落定後 0.25s → Spotlight 暗場壓入
  tl.to(ptBg, {
    backgroundColor: '#0D0618',
    duration: 0.75, ease: 'power2.inOut',
  }, '+=0.25')

  // ⑤ 暗角暈染 + 文字 glow 同時打開
  tl.to(ptVignette, { opacity: 1, duration: 0.65, ease: 'power2.out' }, '<0.1')
  tl.to(demoLetters, {
    filter: 'drop-shadow(0 0 48px rgba(99,102,241,0.6)) drop-shadow(0 0 16px rgba(124,58,237,0.4))',
    duration: 0.7, ease: 'power2.out',
  }, '<')

  // ⑥ ● LIVE 指示器出現
  tl.to(ptLiveBadge, { opacity: 1, duration: 0.5, ease: 'power2.out' }, '-=0.2')

  // ⑦ 文字輕呼吸（無限循環，讓畫面有生命感）
  tl.to(demoLetters, {
    scale: 1.025,
    duration: 2.4, ease: 'sine.inOut',
    yoyo: true, repeat: -1,
  }, '-=0.1')

  // FOLIO letters 已飛出畫面右側，1s 後靜默重設（delayedCall 避免立即覆蓋起始位置）
  gsap.delayedCall(1.5, () => gsap.set(folioLetters, { opacity: 0, x: 0 }))
}

// ── FOLIO overlay helper (reserved for slogan page) ──────────
// Call triggerFolioSweep(dir) from any section to trigger the
// "FOLIO" word-sweep animation as a standalone moment.
window.__folioSweep = (dir = 1) => {
  const ptBg    = overlay.querySelector('.pt-bg')
  const letters = overlay.querySelectorAll('.pt-l')
  const from    = dir === 1 ? '110vw' : '-110vw'
  const exit    = dir === 1 ? '-110vw' : '110vw'
  const stagger = { each: 0.055, from: dir === 1 ? 'start' : 'end' }

  gsap.set(letters, { x: from, opacity: 1 })   // make visible before sweep
  gsap.set(ptBg,    { opacity: 0 })

  gsap.timeline()
    .to(ptBg, { opacity: 1, duration: 0.08, ease: 'none' })
    .to(letters, { x: 0, duration: 0.38, ease: 'power4.out', stagger }, '<')
    .to(letters, { x: exit, duration: 0.28, ease: 'power3.in', stagger }, '+=0.12')
    .to(ptBg, { opacity: 0, duration: 0.12, ease: 'none' }, '-=0.1')
    .set(letters, { opacity: 0 })              // hide again after sweep
}

// ── Snap + Transition coordinator ─────────────────
// Double rAF: ensures pin spacers are laid out before collecting positions
requestAnimationFrame(() => requestAnimationFrame(() => {

  const snapPositions = ScrollTrigger.getAll()
    .filter(st => st.pin)
    .sort((a, b) => a.start - b.start)
    .map(st => st.start)

  if (!snapPositions.length) return

  // Stop natural Lenis scroll — all navigation via coordinator
  lenis.stop()

  let isSnapping = false

  const snapTo = (dir) => {
    if (isSnapping) return

    // Find which section we're currently in
    const cur = window.scrollY
    let nearest = 0, minDist = Infinity
    snapPositions.forEach((pos, i) => {
      const d = Math.abs(cur - pos)
      if (d < minDist) { minDist = d; nearest = i }
    })

    const next = Math.max(0, Math.min(snapPositions.length - 1, nearest + dir))

    if (next === nearest) {
      // At boundary — still let section process beats/demo via exit handler
      if (dir === 1 && controllers[nearest]?.exit) {
        isSnapping = true
        const lockFor = runTransition(nearest, nearest + 1, dir, snapPositions)
        gsap.delayedCall(lockFor, () => { isSnapping = false })
      }
      return
    }

    isSnapping = true

    // runTransition returns the lock duration for this specific transition type
    const lockFor = runTransition(nearest, next, dir, snapPositions)
    gsap.delayedCall(lockFor, () => { isSnapping = false })
  }

  // Mouse wheel
  window.addEventListener('wheel', (e) => {
    e.preventDefault()
    snapTo(e.deltaY > 0 ? 1 : -1)
  }, { passive: false })

  // Keyboard: arrow / page keys
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); snapTo(1)  }
    if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); snapTo(-1) }
  })

  // Auto-play Hero enter on first load
  controllers[0]?.enter(1)
}))
