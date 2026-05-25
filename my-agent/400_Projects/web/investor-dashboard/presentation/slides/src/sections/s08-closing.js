import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

function typewriter(el, text, duration = 1100) {
  el.textContent = ''
  const perChar = duration / text.length
  let i = 0
  const tick = setInterval(() => {
    el.textContent += text[i]
    i++
    if (i >= text.length) clearInterval(tick)
  }, perChar)
}

export function initClosing() {
  const section = document.getElementById('s08')
  if (!section) return

  const eyebrow = section.querySelector('.s__eyebrow')
  const quote   = section.querySelector('.closing-quote')
  const line    = section.querySelector('.closing-line')
  const credit  = section.querySelector('.closing-credit')

  gsap.set(eyebrow, { opacity: 0, y: 14 })
  gsap.set(quote,   { opacity: 0 })
  gsap.set(line,    { scaleX: 0, transformOrigin: 'left center' })
  gsap.set(credit,  { opacity: 0 })

  let played = false

  const play = () => {
    if (played) return
    played = true

    gsap.to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })

    setTimeout(() => {
      gsap.set(quote, { opacity: 1 })
      typewriter(quote, '協作不是依賴，是放大。', 1100)
    }, 400)

    setTimeout(() => {
      gsap.to(line,   { scaleX: 1, duration: 0.9, ease: 'expo.out' })
      gsap.to(credit, { opacity: 1, duration: 0.6, ease: 'expo.out', delay: 0.4 })
    }, 1700)
  }

  const reset = () => {
    played = false
    gsap.set(eyebrow, { opacity: 0, y: 14 })
    gsap.set(quote,   { opacity: 0 })
    gsap.set(line,    { scaleX: 0 })
    gsap.set(credit,  { opacity: 0 })
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=100%',
    pin: true,
    anticipatePin: 1,
    onEnter:     play,
    onLeaveBack: reset,
  })
}
