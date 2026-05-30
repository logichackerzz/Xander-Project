import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// ── Row data ────────────────────────────────────────────────
const ROWS = [
  {
    dir: 1, dur: 38, size: '1.9rem',
    accent: '#6366F1',
    items: ['10 個外部資料來源', 'yfinance', 'BLS API', 'TWSE', 'TAIFEX', 'Groq AI', 'CNBC', 'NPR', 'Investing.com', 'Google News TW'],
  },
  {
    dir: -1, dur: 26, size: '3.4rem',
    accent: '#06B6D4',
    items: ['42 支後端 API', '/market', '/sentiment', '/macro', '/financials', '/portfolio', '/watchlist', '/calendar', '/ai'],
  },
  {
    dir: 1, dur: 48, size: '1.45rem',
    accent: '#8B5CF6',
    items: ['19 個即時財經指標', 'S&P 500', 'NASDAQ', '道瓊指數', 'VIX 恐慌指數', '市場廣度', 'Put/Call Ratio', '外資買賣超', '投信買賣超', '融資融券', '散戶多空比', 'US10Y', 'Fed Rate', '核心 CPI', 'DXY', 'ISM PMI', 'PPI', '失業率'],
  },
  {
    dir: -1, dur: 30, size: '2.8rem',
    accent: '#10B981',
    items: ['8 個功能頁面', 'Overview', 'Watchlist', 'Financials', 'Sentiment', 'Macro', 'Portfolio', 'Chart', 'Calendar'],
  },
  {
    dir: 1, dur: 40, size: '1.8rem',
    accent: '#F59E0B',
    items: ['7 個爬蟲來源', 'Wikipedia S&P500 名單', 'TWSE 三大法人', 'TAIFEX 散戶多空', 'CNBC RSS', 'NPR RSS', 'Investing.com RSS', 'Google News TW'],
  },
]

// ── Helpers ─────────────────────────────────────────────────
const SEP = '<span class="tck-sep" aria-hidden="true">✦</span>'

function buildItem(text, accent) {
  const html = text.replace(/^(\d+)/, `<em style="color:${accent}">$1</em>`)
  return `<span class="tck-item">${html}</span>${SEP}`
}

export function initMarquee() {
  const section = document.getElementById('s04')
  if (!section) return undefined

  const stage = section.querySelector('.tck-stage')

  // Always pin S04 to keep it in the snap system, even if blank
  if (!stage) {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=100%',
      pin: true,
      anticipatePin: 1,
    })
    return { enter: () => {} }
  }

  const rowEls  = []
  const innerEls = []
  const tweens  = []

  // ── Build rows ──────────────────────────────────────────
  ROWS.forEach((row) => {
    const rowEl  = document.createElement('div')
    const inner  = document.createElement('div')
    rowEl.className  = 'tck-row'
    inner.className  = 'tck-inner'
    rowEl.style.fontSize = row.size

    const itemsHTML = row.items.map(t => buildItem(t, row.accent)).join('')
    inner.innerHTML = itemsHTML + itemsHTML   // duplicate for seamless loop

    rowEl.appendChild(inner)
    stage.appendChild(rowEl)
    rowEls.push(rowEl)
    innerEls.push({ el: inner, dir: row.dir, dur: row.dur })
  })

  // ── Set initial state ───────────────────────────────────
  gsap.set(rowEls, { opacity: 0, y: 28 })

  const killScrolls = () => {
    tweens.forEach(t => t.kill())
    tweens.length = 0
  }

  // ── Start scroll tweens ─────────────────────────────────
  // Called via setTimeout so browser has finished layout before we measure
  const startScrolls = () => {
    innerEls.forEach(({ el, dir, dur }) => {
      const halfW = el.scrollWidth / 2 || 3000

      if (dir === 1) {
        gsap.set(el, { x: 0 })
        tweens.push(gsap.to(el, { x: -halfW, duration: dur, ease: 'none', repeat: -1 }))
      } else {
        gsap.set(el, { x: -halfW })
        tweens.push(gsap.to(el, { x: 0, duration: dur, ease: 'none', repeat: -1 }))
      }
    })
  }

  // ── Enter ────────────────────────────────────────────────
  // Fade-in fires immediately; scroll tweens wait 100ms for layout to settle
  const enter = () => {
    gsap.killTweensOf(rowEls)
    killScrolls()
    gsap.set(rowEls, { opacity: 0, y: 28 })

    gsap.fromTo(rowEls,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.1 }
    )

    setTimeout(startScrolls, 100)
  }

  // ── Reset ───────────────────────────────────────────────
  const reset = () => {
    killScrolls()
    gsap.killTweensOf(rowEls)
    gsap.set(rowEls, { opacity: 0, y: 28 })
  }

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: '+=100%',
    pin: true,
    anticipatePin: 1,
    onLeaveBack: () => reset(),
  })

  return { enter }
}
