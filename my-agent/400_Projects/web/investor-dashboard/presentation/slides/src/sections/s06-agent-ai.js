import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initAgentAI() {
  const section = document.getElementById('s06')
  if (!section) return

  const eyebrow  = section.querySelector('.s__eyebrow')
  const panelGen = section.querySelector('.ai-panel--gen')
  const panelAgt = section.querySelector('.ai-panel--agent')
  const divider  = section.querySelector('.ai-divider-v')

  gsap.set(eyebrow,  { opacity: 0, y: 14 })
  gsap.set(panelGen, { opacity: 0, y: 24 })
  gsap.set(panelAgt, { opacity: 0, y: 24 })
  gsap.set(divider,  { scaleY: 0, transformOrigin: 'top center' })

  const tl = gsap.timeline({ paused: true })
  tl
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
    .to(panelGen, { opacity: 1, y: 0, duration: 0.75, ease: 'expo.out' }, '-=0.3')
    .to(divider,  { scaleY: 1, duration: 0.5, ease: 'expo.out' }, '-=0.5')
    .to(panelAgt, { opacity: 1, y: 0, duration: 0.75, ease: 'expo.out' }, '-=0.5')

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
