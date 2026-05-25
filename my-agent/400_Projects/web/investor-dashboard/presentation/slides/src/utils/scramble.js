const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789█▓▒░◆◇△▽'

/**
 * Scramble-then-reveal text effect.
 * @param {HTMLElement} el        - target element
 * @param {string}      finalText - real text to reveal
 * @param {object}      opts
 * @param {number}      opts.duration - total ms (default 900)
 * @param {number}      opts.delay    - start delay ms (default 0)
 */
export function scramble(el, finalText, { duration = 900, delay = 0 } = {}) {
  const FRAMES     = 30
  const MS_PER     = duration / FRAMES
  let   frame      = 0

  const run = () => {
    const interval = setInterval(() => {
      el.textContent = Array.from(finalText)
        .map((char, i) => {
          if (' ·—.,'.includes(char)) return char
          // reveal left-to-right as frames progress
          if (frame >= (i / finalText.length) * FRAMES * 0.88) return char
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        })
        .join('')

      frame++
      if (frame > FRAMES) {
        clearInterval(interval)
        el.textContent = finalText
      }
    }, MS_PER)
  }

  delay > 0 ? setTimeout(run, delay) : run()
}
