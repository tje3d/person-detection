import { Inject, Service } from 'typedi'
import LocalStorageRepository from './LocalStorageRepository'

@Service()
export default class SettingsRepository {
  @Inject((type) => LocalStorageRepository)
  db: LocalStorageRepository

  // Storage key
  storageKey: string = 'settings'

  /**
   * Load settings from storage and fill undefined with defaultValues
   * @returns boolean
   */
  async load(): Promise<Settings> {
    const input: Settings = JSON.parse(this.db.get(this.storageKey, '{}'))

    const color = input.color || 'dark'

    return {
      color,
    }
  }

  /**
   * Save variables to storage
   * @returns void
   */
  async save(input: Settings) {
    return this.db.set(this.storageKey, JSON.stringify(input))
  }
}

export interface Settings {
  color: string
}
