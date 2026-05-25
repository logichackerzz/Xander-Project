import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ── Idle float: each letter has a unique yoyo phase ─
// dy = extra y offset, dr = extra rotation, dur / delay vary
const IDLE = [
  { dy: -14, dr: -4,  dur: 3.6, delay: 0.0  },  // F — confident drift up-left
  { dy:  11, dr:  3,  dur: 4.1, delay: 0.7  },  // O — lazy drift down-right
  { dy:  -9, dr: -2,  dur: 4.8, delay: 0.25 },  // L — slowest, heaviest
  { dy:  16, dr:  5,  dur: 3.1, delay: 1.0  },  // I — quickest, lightest
  { dy: -10, dr: -3,  dur: 4.3, delay: 1.3  },  // O — relaxed drift
]

// ── Scatter target per letter (forward exit) ──────
// Each letter flies to a completely different corner
const SCATTER = [
  { x: '-65vw', y: '-50vh' },  // F — upper left
  { x:  '75vw', y: '-35vh' },  // O — upper right
  { x: '-28vw', y:  '72vh' },  // L — down
  { x: '-80vw', y:  '55vh' },  // I — lower left
  { x:  '85vw', y:  '65vh' },  // O — lower right
]

// ── Resting rotation for each letter (visual tilt) ─
const BASE_ROT = [-8, 7, -14, 5, -9]

// ── Badge resting tilts ───────────────────────────
const BADGE_ROT = [0, 3, -4]  // A, B, C

export function initNaming() {
  const section  = document.getElementById('s02')
  if (!section) return null

  const question = section.querySelector('.s02-question')
  const chars    = section.querySelectorAll('.s02-l')
  const badgeA   = section.querySelector('.s02-badge--a')
  const badgeB   = section.querySelector('.s02-badge--b')
  const badgeC   = section.querySelector('.s02-badge--c')
  const badges   = [badgeA, badgeB, badgeC].filter(Boolean)

  // Live idle tweens — killed on every exit / reset
  let idleTweens = []

  // ── Helpers ─────────────────────────────────────
  const stopBadgeA = () => {
    const ring = badgeA?.querySelector('.s02-badge__ring')
    const icon = badgeA?.querySelector('.s02-badge__icon')
    if (ring) ring.style.animationPlayState = 'paused'
    if (icon) icon.style.animationPlayState = 'paused'
  }
  const startBadgeA = () => {
    const ring = badgeA?.querySelector('.s02-badge__ring')
    const icon = badgeA?.querySelector('.s02-badge__icon')
    if (ring) ring.style.animationPlayState = 'running'
    if (icon) icon.style.animationPlayState = 'running'
  }

  const killIdle = () => {
    idleTweens.forEach(t => t.kill())
    idleTweens = []
    stopBadgeA()
  }

  // All elements snapped back to invisible hidden state
  const reset = () => {
    killIdle()

    gsap.set(question, { clipPath: 'inset(0% 100% 0% 0%)', opacity: 1 })

    chars.forEach((c, i) => {
      const rot = BASE_ROT[i] || 0
      gsap.set(c, {
        x: 0,
        y: -88,
        opacity: 0,
        rotation: rot + (rot >= 0 ? 22 : -22),  // exaggerated start tilt
        scale: 0.82,
        filter: 'blur(20px)',
      })
    })

    badges.forEach(b => gsap.set(b, { opacity: 0, scale: 0, rotation: -16 }))
  }
  reset()

  // ── PIN only (coordinator handles enter/exit) ────
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=100%',
    pin: true,
    anticipatePin: 1,
  })

  // ── Idle float — fires after enter completes ─────
  const startIdle = () => {
    chars.forEach((c, i) => {
      const cfg = IDLE[i] || { dy: -10, dr: -3, dur: 4, delay: 0 }
      idleTweens.push(
        gsap.to(c, {
          y: `+=${cfg.dy}`,
          rotation: `+=${cfg.dr}`,
          duration: cfg.dur,
          delay: cfg.delay,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })
      )
    })
    startBadgeA()
  }

  // ── Controller ───────────────────────────────────
  return {
    // ─────────────────────────────────────────────
    // enter(dir):
    //   1. "What is Folio?" clips in left→right
    //   2. Letters drop from above: blur clears,
    //      rotation springs to BASE_ROT via back.out
    //   3. Badges pop in with back.out bounce
    //   4. Idle float starts
    // ─────────────────────────────────────────────
    enter(dir = 1) {
      reset()

      // For back-navigation, letters come from below
      const yFrom = dir === -1 ? 88 : -88

      chars.forEach((c, i) => {
        const rot = BASE_ROT[i] || 0
        gsap.set(c, {
          x: 0,
          y: yFrom,
          opacity: 0,
          rotation: rot + (rot >= 0 ? 22 : -22),
          scale: 0.82,
          filter: 'blur(20px)',
        })
      })

      const tl = gsap.timeline({ onComplete: startIdle })

      tl
        // ① Question clip-path wipe
        .to(question, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.65,
          ease: 'power3.out',
        })

        // ② Letters: blur clear + fall + rotation spring
        //    GSAP function-based `rotation` applies per-index
        .to(chars, {
          opacity: 1,
          y: 0,
          rotation: (i) => BASE_ROT[i] ?? 0,
          scale: 1,
          filter: 'blur(0px)',
          duration: 1.0,
          stagger: { each: 0.09, ease: 'power1.out' },
          ease: 'back.out(1.7)',
        }, '-=0.3')

        // ③ Badges pop in, each with own resting tilt
        .to(badges, {
          opacity: 1,
          scale: 1,
          rotation: (i) => BADGE_ROT[i] ?? 0,
          duration: 0.55,
          stagger: 0.1,
          ease: 'back.out(2.2)',
        }, '-=0.55')

      return tl
    },

    // ─────────────────────────────────────────────
    // exit(dir):
    //   Forward (1):  letters scatter outward in
    //                 unique diagonal directions
    //   Backward (-1): letters fly back upward
    //
    // main.js fires instant-scroll at t=0.32
    // ─────────────────────────────────────────────
    exit(dir = 1) {
      killIdle()
      const tl = gsap.timeline()

      if (dir === 1) {
        // ── Forward: big scatter ──────────────────
        tl
          .to(question, { opacity: 0, duration: 0.18, ease: 'power2.in' })
          .to(badges,   { opacity: 0, scale: 0.75, duration: 0.22, stagger: 0.06, ease: 'power2.in' }, '<')

        // Each letter flies to its own corner
        chars.forEach((c, i) => {
          const sc = SCATTER[i] || { x: '60vw', y: '40vh' }
          tl.to(c, {
            x: sc.x,
            y: sc.y,
            opacity: 0,
            scale: 0.65,
            filter: 'blur(14px)',
            duration: 0.44,
            ease: 'power3.in',
          }, i === 0 ? '-=0.08' : '<0.05')   // cascade 0.05 s apart
        })

      } else {
        // ── Backward: reverse gravity (fly up) ───
        tl
          .to(question, { opacity: 0, duration: 0.18, ease: 'power2.in' })
          .to(badges,   { opacity: 0, scale: 0.8, duration: 0.2, stagger: 0.05 }, '<')
          .to(chars, {
            y: -110,
            opacity: 0,
            scale: 0.8,
            filter: 'blur(18px)',
            rotation: (i) => {
              const rot = BASE_ROT[i] ?? 0
              return rot + (rot >= 0 ? 20 : -20)
            },
            duration: 0.4,
            stagger: { each: 0.055, from: 'end' },
            ease: 'power3.in',
          }, '-=0.08')
      }

      return tl
    },
  }
}
