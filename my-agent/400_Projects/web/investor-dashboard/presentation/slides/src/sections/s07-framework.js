import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initFramework() {
  const section = document.getElementById('s07')
  if (!section) return

  const eyebrow    = section.querySelector('.s__eyebrow')
  const heading    = section.querySelector('.collab-heading')
  const steps      = section.querySelectorAll('.collab-step')
  const connectors = section.querySelectorAll('.collab-connector')
  const note       = section.querySelector('.collab-note')

  gsap.set(eyebrow,    { opacity: 0, y: 14 })
  gsap.set(heading,    { opacity: 0, y: 16 })
  gsap.set(steps,      { opacity: 0, y: 20 })
  gsap.set(connectors, { scaleX: 0, transformOrigin: 'left center' })
  gsap.set(note,       { opacity: 0, y: 12 })

  const tl = gsap.timeline({ paused: true })
  tl
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
    .to(heading, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.3')

  steps.forEach((step, i) => {
    const connector = connectors[i]
    tl.to(step, { opacity: 1, y: 0, duration: 0.65, ease: 'expo.out' }, i === 0 ? '-=0.3' : '-=0.45')
    if (connector) {
      tl.to(connector, { scaleX: 1, duration: 0.4, ease: 'power2.out' }, '-=0.2')
    }
  })

  tl.to(note, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' }, '-=0.2')

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
