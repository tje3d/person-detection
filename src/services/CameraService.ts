import { get, writable, Writable } from 'svelte/store'
import { Service } from 'typedi'
import config from '../config'
import BaseService from './Base'

@Service()
export default class CameraService extends BaseService {
  camera: Writable<MediaStream | undefined> = writable(undefined)

  constructor() {
    super()

    this.init = this.init.bind(this)
    this.destroy = this.destroy.bind(this)
  }

  async init() {
    if (get(this.initialized)) {
      return
    }

    await this.loadCamera()

    this.initialized.set(true)
  }

  async destroy() {
    this.destroyCamera()
    this.initialized.set(false)
  }

  //
  // ─── METHODS ────────────────────────────────────────────────────────────────────
  //

  async loadCamera() {
    const media = await navigator.mediaDevices.getUserMedia(config.camera)

    this.camera.set(media)
  }

  destroyCamera() {
    const media = get(this.camera)

    if (media) {
      media.getTracks().forEach((t) => t.stop())
      this.camera.set(undefined)
    }
  }
}
