import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scramble } from '../utils/scramble.js'

export function initDemo() {
  const section = document.getElementById('s04')
  if (!section) return

  const eyebrow = section.querySelector('.s__eyebrow')
  const browser = section.querySelector('.demo-browser')
  const urlEl   = section.querySelector('.demo-browser__url')

  gsap.set(eyebrow, { opacity: 0, y: 14 })
  gsap.set(browser, { opacity: 0, y: 28, scale: 0.97 })

  const tl = gsap.timeline({ paused: true })
  tl
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
    .to(browser, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.9, ease: 'expo.out',
    }, '-=0.2')
    .call(() => {
      scramble(urlEl, 'folio-dashboard.vercel.app', { duration: 700, delay: 0 })
    }, null, '-=0.1')

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=100%',
    pin: true,
    anticipatePin: 1,
    onEnter:     () => tl.play(),
    onLeaveBack: () => tl.pause(0),
  })
}
