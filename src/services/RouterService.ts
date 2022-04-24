import { navigate, NavigateOptions } from 'svelte-routing'
import { globalHistory } from 'svelte-routing/src/history.js'
import { writable } from 'svelte/store'
import { Service } from 'typedi'
import BaseService from './Base'

@Service()
export default class RouterService extends BaseService {
  location = writable<SvelteRouting.Location>({})

  constructor() {
    super()

    this._onLocationChanges = this._onLocationChanges.bind(this)
  }

  async init() {
    this.location.set(globalHistory.location)

    globalHistory.listen(this._onLocationChanges)
  }

  //
  // ─── METHODS ────────────────────────────────────────────────────────────────────
  //

  navigate(path: string, options?: NavigateOptions) {
    return navigate(path, options)
  }

  //
  // ─── EVENTS ─────────────────────────────────────────────────────────────────────
  //

  _onLocationChanges() {
    this.location.set(globalHistory.location)
  }

  //
  // ─── ROUTES ─────────────────────────────────────────────────────────────────────
  //

  toLogin() {
    location.href = '/panel/auth/login'
  }
}
