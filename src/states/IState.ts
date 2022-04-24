import { Writable, writable } from 'svelte/store'

export default abstract class IState {
  initialized: Writable<boolean> = writable(false)

  abstract init(input?: any): Promise<any>

  async destroy() {
    for (const key in this) {
      delete this[key]
    }
  }
}
