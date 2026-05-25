import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export function initArchitecture() {
  const section = document.getElementById('s05')
  if (!section) return

  const eyebrow    = section.querySelector('.s__eyebrow')
  const heading    = section.querySelector('.stack-heading')
  const rows       = section.querySelectorAll('.stack-row')
  const connectors = section.querySelectorAll('.stack-connector')

  gsap.set(eyebrow,    { opacity: 0, y: 14 })
  gsap.set(heading,    { opacity: 0, y: 16 })
  gsap.set(rows,       { opacity: 0, x: -20 })
  gsap.set(connectors, { scaleY: 0, opacity: 0, transformOrigin: 'top center' })

  const tl = gsap.timeline({ paused: true })
  tl
    .to(eyebrow, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out' })
    .to(heading, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out' }, '-=0.3')

  rows.forEach((row, i) => {
    const connector = connectors[i]
    tl.to(row, { opacity: 1, x: 0, duration: 0.65, ease: 'expo.out' }, i === 0 ? '-=0.3' : '-=0.4')
    if (connector) {
      tl.to(connector, { scaleY: 1, opacity: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2')
    }
  })

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
