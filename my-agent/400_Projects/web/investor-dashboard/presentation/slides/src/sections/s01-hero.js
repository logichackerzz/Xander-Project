import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scramble } from '../utils/scramble.js'

export function initHero() {
  const section   = document.getElementById('s01')
  if (!section) return null

  const inner     = section.querySelector('.s__inner')
  const titleWrap = section.querySelector('.hero-title-wrap')
  const eyebrow   = section.querySelector('.hero-eyebrow')
  const title     = section.querySelector('.hero-title')
  const line      = section.querySelector('.hero-line')
  const tagline   = section.querySelector('.hero-tagline')
  const sticker   = section.querySelector('.sticker')

  // ── Hidden state ─────────────────────────────
  const reset = () => {
    // Restore overflow so enter animation clips correctly
    inner.style.overflow    = 'hidden'
    titleWrap.style.overflow = 'hidden'
    gsap.set(title,   { x: 0, yPercent: 110, filter: 'blur(0px)', opacity: 1 })
    gsap.set(eyebrow, { clipPath: 'inset(0% 100% 0% 0%)', opacity: 1 })
    gsap.set(line,    { scaleX: 0, transformOrigin: 'left center' })
    gsap.set(tagline, { opacity: 0, scale: 0.92, filter: 'blur(16px)' })
    if (sticker) {
      gsap.set(sticker, { opacity: 0, scale: 0.6, rotation: -24 })
      sticker.style.animationPlayState = 'paused'
    }
  }
  reset()

  // ── PIN only ──────────────────────────────────
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=100%',
    pin: true,
    anticipatePin: 1,
  })

  // ── Controller ───────────────────────────────
  return {
    enter(dir = 1) {
      reset()
      const tl = gsap.timeline()
      tl
        // ① Eyebrow: clip-path wipe left→right
        .to(eyebrow, {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.7, ease: 'power3.out',
        })
        // ② Title: slides up from clip (overflow:hidden on wrap = natural clip reveal)
        .to(title, {
          yPercent: 0,
          duration: 1.1, ease: 'expo.out',
        }, '-=0.5')
        // ③ Line: draws right from left
        .to(line, {
          scaleX: 1,
          duration: 0.9, ease: 'expo.out',
        }, '-=0.55')
        // ④ Tagline: fog materialise + scramble
        .to(tagline, {
          opacity: 1, scale: 1, filter: 'blur(0px)',
          duration: 0.85, ease: 'power3.out',
          onStart: () => scramble(tagline, 'Markets, made readable.', { duration: 800 }),
        }, '-=0.4')
        // ⑤ Sticker: bounces in
        .to(sticker, {
          opacity: 1, scale: 1, rotation: -14,
          duration: 0.9, ease: 'back.out(1.4)',
          onComplete: () => {
            if (sticker) sticker.style.animationPlayState = 'running'
          },
        }, '-=0.5')

      return tl
    },

    // ─────────────────────────────────────────────
    // exit(): The "Folio" title itself IS the transition.
    //
    // Forward  (dir=1):  support elements vanish fast →
    //                    title LAUNCHES to the right (exits stage right)
    // Backward (dir=-1): title launches to the left
    //
    // overflow:hidden is released so the title can escape the container.
    // main.js fires the instant-scroll at ~t=0.28 (mid-flight).
    // reset() restores overflow before enter() replays.
    // ─────────────────────────────────────────────
    exit(dir = 1) {
      if (sticker) sticker.style.animationPlayState = 'paused'

      // Release overflow so title can fly beyond container bounds
      inner.style.overflow     = 'visible'
      titleWrap.style.overflow = 'visible'
      section.style.overflow   = 'visible'

      const tl = gsap.timeline()

      // ① Support elements vanish quickly
      tl
        .to(sticker, {
          opacity: 0, scale: 0.75,
          duration: 0.14, ease: 'power2.in',
        })
        .to([tagline, eyebrow], {
          opacity: 0,
          duration: 0.16, ease: 'power2.in',
        }, '<')
        .to(line, {
          scaleX: 0,
          transformOrigin: dir === 1 ? 'right center' : 'left center',
          duration: 0.18, ease: 'power2.in',
        }, '<0.04')

      // ② "Folio" title launches horizontally — this IS the transition
      tl.to(title, {
        x: dir === 1 ? '130vw' : '-130vw',
        // slight y lift gives it a "taking off" feel
        y: dir === 1 ? -18 : 18,
        duration: 0.44,
        ease: 'power3.in',
      }, '-=0.08')

      return tl
    },
  }
}
