import { get } from 'svelte/store'
import { Service } from 'typedi'
import BaseService from './Base'

@Service()
export default class ThemeService extends BaseService {
  style?: HTMLStyleElement

  async init() {
    if (get(this.initialized)) {
      return
    }

    this.style = document.createElement('style')
    this.style.setAttribute('type', 'text/css')
    document.head.appendChild(this.style)

    this.initialized.set(true)
  }

  async destroy() {
    if (this.style) {
      document.head.removeChild(this.style)
    }

    for (const key in this) {
      delete this[key]
    }
  }

  //
  // ─── METHODS ────────────────────────────────────────────────────────────────────
  //

  /**
   * Turn an object to css variables
   * @param input object
   */
  apply(input: object) {
    const variables = Object.entries(input).map(function (item) {
      return `--${item[0]}: ${item[1]};`
    })

    if (this.style.firstChild) {
      this.style.removeChild(this.style.firstChild)
    }

    this.style.appendChild(
      document.createTextNode(`body {${variables.join('')}}`),
    )
  }

  /**
   * Loads color and apply
   * @param name string
   * @returns void
   */
  async applyByName(name: string) {
    const data = await import(`../assets/css/colors/${name}.ts`)

    return this.apply(data.default)
  }
}
