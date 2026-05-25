import '@fontsource/urbanist/700.css'
import '@fontsource/urbanist/800.css'
import '@fontsource/dancing-script/700.css'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Splitting from 'splitting'

import { initHero }         from './sections/s01-hero.js'
import { initNaming }       from './sections/s02-naming.js'
import { initMission }      from './sections/s03-mission.js'
import { initDemo }         from './sections/s04-demo.js'
import { initArchitecture } from './sections/s05-architecture.js'
import { initAgentAI }      from './sections/s06-agent-ai.js'
import { initFramework }    from './sections/s07-framework.js'
import { initClosing }      from './sections/s08-closing.js'

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
// S01 & S02: new coordinator system — returns { enter, exit }
// S03–S08:   legacy system — returns undefined, use ScrollTrigger onEnter
const controllers = []
controllers[0] = initHero()     // { enter, exit }
controllers[1] = initNaming()   // { enter, exit }
controllers[2] = initMission()  // undefined — legacy
controllers[3] = initDemo()     // undefined — legacy
controllers[4] = initArchitecture() // undefined — legacy
controllers[5] = initAgentAI()      // undefined — legacy
controllers[6] = initFramework()    // undefined — legacy
controllers[7] = initClosing()      // undefined — legacy

// ── Refresh after all pins created ────────────────
ScrollTrigger.refresh()

// ── Page Transition Overlay ───────────────────────
const overlay = document.getElementById('pageTrans')

/**
 * Transition coordinator
 *
 * Strategy A — Sections with custom exit() (currently S01, S02):
 *   The exit animation IS the transition. No overlay.
 *   main.js fires instant-scroll at a section-specific timing.
 *
 *   S01 (from=0): hero "Folio" launches horizontally ~0.44 s
 *     → scroll at t=0.28 (title already off-screen on fast path)
 *   S02 (from=1): letters collapse / shoot away ~0.38 s
 *     → scroll at t=0.32
 *
 * Strategy B — Sections without custom exit (S03–S08):
 *   Quick bg flash hides the instant scroll.
 *
 * The #pageTrans .pt-folio overlay is RESERVED for the future
 * slogan page — it is NOT used for regular page transitions.
 */
const runTransition = (from, to, dir, snapPositions) => {
  const fromCtrl = controllers[from]
  const toCtrl   = controllers[to]
  const ptBg     = overlay.querySelector('.pt-bg')

  const doScroll = () => {
    lenis.scrollTo(snapPositions[to], { duration: 0, force: true })
    ScrollTrigger.update()
  }
  const doEnter = () => {
    if (toCtrl?.enter) toCtrl.enter(dir)
  }

  if (fromCtrl?.exit) {
    // ── Strategy A: exit animation is the transition ──────
    fromCtrl.exit(dir)

    // Section-specific scroll timing (when the content has left the viewport)
    const scrollAt = from === 0 ? 0.28   // S01: title mid-flight
                   : from === 1 ? 0.32   // S02: letters shot away
                   : 0.35               // future custom sections

    gsap.delayedCall(scrollAt,        doScroll)
    gsap.delayedCall(scrollAt + 0.06, doEnter)

  } else {
    // ── Strategy B: lightweight bg flash ─────────────────
    gsap.set(ptBg, { opacity: 0 })

    gsap.timeline()
      .to(ptBg, { opacity: 1, duration: 0.1, ease: 'none' })
      .call(() => { doScroll(); doEnter() })
      .to(ptBg, { opacity: 0, duration: 0.18, ease: 'power1.out' }, '+=0.04')
  }
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
    if (next === nearest) return   // already at boundary

    isSnapping = true

    runTransition(nearest, next, dir, snapPositions)

    // Release snapping lock after full animation completes
    // enter animations are ~0.8–1.0 s; lock for 1.3 s total from snap start
    gsap.delayedCall(1.3, () => { isSnapping = false })
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
