import { get, writable, Writable } from 'svelte/store'
import { Service } from 'typedi'
import Popup, { AlertPopup, ConfirmPopup } from '../models/Popup'
import BaseService from './Base'

@Service()
export default class PopupService extends BaseService {
  popup: Writable<Popup | undefined> = writable()

  constructor() {
    super()

    this.init = this.init.bind(this)
    this.destroy = this.destroy.bind(this)
  }

  async init() {
    if (get(this.initialized)) {
      return
    }

    // ...

    this.initialized.set(true)
  }

  async destroy() {
    // ...
  }

  /**
   * Show a Popup
   * @param popup Popup
   */
  show(popup: Popup) {
    this.popup.set(popup)
  }

  /**
   * Hide the ∏Popup
   */
  hide() {
    this.popup.set(undefined)
  }

  /**
   * Create and show a alert popup
   */
  alert(title: string, description: string, btn_text: string = 'باشه') {
    const popup = new AlertPopup(title, description, btn_text)
    this.show(popup)
  }

  /**
   * Create and show a confirm popup
   */
  confirm(
    title: string,
    description: string,
    on_ok: Function,
    on_cancel: Function = () => true,
    ok_text: string = 'تایید',
    cancel_text: string = 'لغو',
  ) {
    const popup = new ConfirmPopup(
      title,
      description,
      on_ok,
      on_cancel,
      ok_text,
      cancel_text,
    )
    this.show(popup)
  }
}
