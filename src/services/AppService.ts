import { get, Readable, readable } from 'svelte/store'
import { Service } from 'typedi'
import { safeInterval } from '../helpers/timers'
import BaseService from './Base'

@Service()
export default class AppService extends BaseService {
  currentTime: Readable<number>

  constructor() {
    super()

    this.init = this.init.bind(this)
    this.destroy = this.destroy.bind(this)
    this._calculateCurrentTime = this._calculateCurrentTime.bind(this)
  }

  async init() {
    if (get(this.initialized)) {
      return
    }

    this.currentTime = readable(Date.now(), this._calculateCurrentTime)

    this.initialized.set(true)
  }

  async destroy() {
    // ...
  }

  //
  // ─── CALCULATORS ────────────────────────────────────────────────────────────────
  //

  _calculateCurrentTime(set: Function) {
    return safeInterval(function () {
      set(Date.now())
    }, 1000)
  }

  //
  // ─── EVENTS ─────────────────────────────────────────────────────────────────────
  //

  // ...
}
