import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initMission() {
  const section = document.getElementById('s03')
  if (!section) return

  const eyebrow = section.querySelector('.s__eyebrow')
  const heading = section.querySelector('.feat-heading')
  const cards   = section.querySelectorAll('.feat-card')

  gsap.set(eyebrow, { opacity: 0, y: 14 })
  gsap.set(heading, { opacity: 0, y: 20 })
  gsap.set(cards,   { opacity: 0, y: 32 })

  const tl = gsap.timeline({ paused: true })
  tl
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
    .to(heading, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.3')
    .to(cards, {
      opacity: 1, y: 0,
      duration: 0.75, stagger: 0.12,
      ease: 'expo.out',
    }, '-=0.35')

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
