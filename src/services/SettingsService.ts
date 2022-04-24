import debounce from 'lodash/debounce'
import { get, Writable, writable } from 'svelte/store'
import { Inject, Service } from 'typedi'
import SettingsRepository, { Settings } from '../datalayer/SettingsRepository'
import BaseService from './Base'
import ThemeService from './ThemeService'

@Service()
export default class SettingsService extends BaseService {
  color: Writable<string> = writable('dark')

  constructor(
    private repository: SettingsRepository,
    @Inject((type) => ThemeService) private themeService: ThemeService,
  ) {
    super()

    this.init = this.init.bind(this)
    this.destroy = this.destroy.bind(this)

    this.save = debounce(this.save.bind(this), 300, { maxWait: 2000 })
  }

  async init() {
    if (get(this.initialized)) {
      return
    }

    //
    // ─── LOAD SETTING ────────────────────────────────────────────────
    //

    await this.load()

    //
    // ─── APPLY SETTINGS ──────────────────────────────────────────────
    //

    this.switchColor(get(this.color))

    this.initialized.set(true)
  }

  /**
   * Load settings from storage and set variables
   * @returns boolean
   */
  async load() {
    const input = await this.repository.load()

    this.color.set(input.color)

    return true
  }

  /**
   * Save variables to storage
   * @returns void
   */
  async save() {
    const input: Settings = {
      color: get(this.color),
    }

    return this.repository.save(input)
  }

  //
  // ────────────────────────────────────────────────────── I ──────────
  //   :::::: M E T H O D S : :  :   :    :     :        :          :
  // ────────────────────────────────────────────────────────────────
  //

  switchColor(name: string) {
    this.color.set(name)

    this.themeService.applyByName(name)

    document.documentElement.className = name

    this.save()
  }

  toggleColor() {
    const name = get(this.color) === 'dark' ? 'light' : 'dark'

    this.switchColor(name)
  }
}
