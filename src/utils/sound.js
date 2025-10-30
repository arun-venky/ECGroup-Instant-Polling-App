export function playVoteSound() {
  try {
    new Audio('/assets/sounds/vote.mp3').play()
  } catch {}
}

export function playRevealSound() {
  try {
    new Audio('/assets/sounds/reveal.mp3').play()
  } catch {}
}

export function setBackgroundMusic(src, rate = 1) {
  const el = document.getElementById('bg-music')
  if (!el) return
  el.src = src
  el.playbackRate = rate
}

export function playBackgroundMusic(volume = 0.2) {
  const el = document.getElementById('bg-music')
  if (!el) return
  el.volume = volume
  el.play().catch(() => {})
}

export function stopBackgroundMusic() {
  const el = document.getElementById('bg-music')
  if (!el) return
  el.pause()
}


