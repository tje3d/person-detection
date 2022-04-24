export default class FpsMeter {
  prev: number = undefined

  frames: number = 0
  lastFps: number = 0

  fps() {
    if (!this.prev) {
      this.prev = Date.now()
      return
    }

    const time = Date.now()

    this.frames++

    if (time > this.prev + 1000) {
      const fps = Math.round((this.frames * 1000) / (time - this.prev))

      this.prev = time
      this.frames = 0

      return (this.lastFps = fps)
    }

    return this.lastFps
  }
}
