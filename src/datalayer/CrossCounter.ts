import { get, Writable, writable } from 'svelte/store'

export default class CrossCounter {
  appearsIn: Map<number, TrackedObject> = new Map()
  countedIds: number[] = []

  countUp: Writable<number> = writable(0)
  countDown: Writable<number> = writable(0)

  countCrossedY(obs: TrackedObject[], y: number) {
    if (obs.length === 0) {
      return {
        toDown: this.countDown,
        toUp: this.countUp,
      }
    }

    for (let i = 0; i < obs.length; i++) {
      const item = obs[i]

      // Counted before? This should be first so the items that counted and removed from appearsIn wont add later again
      if (this.countedIds.indexOf(item.id) !== -1) {
        continue
      }

      // Doesn't appeared yet? Actually this is the first frame that object is appearing
      if (!this.appearsIn.has(item.id)) {
        this.appearsIn.set(item.id, item)
        continue
      }

      const appearsOb = this.appearsIn.get(item.id)
      const appearPosition: AppearPosition = appearsOb.y <= y ? 'UP' : 'DOWN'

      if (appearPosition === 'UP') {
        if (item.y > y) {
          this.countDown.update((val) => (val += 1))
          this.countedIds.push(item.id)
          this.appearsIn.delete(item.id)
        }
      } else {
        if (item.y + item.h <= y) {
          this.countUp.update((val) => (val += 1))
          this.countedIds.push(item.id)
          this.appearsIn.delete(item.id)
        }
      }
    }

    return {
      toDown: get(this.countDown),
      toUp: get(this.countUp),
    }
  }
}

export type AppearPosition = 'UP' | 'DOWN'
