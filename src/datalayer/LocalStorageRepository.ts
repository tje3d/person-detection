import { Service } from 'typedi'

@Service()
export default class LocalStorageRepository {
  set(key: string, value: string) {
    localStorage.setItem(key, value)
  }

  get(key: string, defaultValue?: any) {
    return localStorage.getItem(key) || defaultValue
  }

  remove(key: string) {
    localStorage.removeItem(key)
  }

  clear() {
    localStorage.clear()
  }
}
