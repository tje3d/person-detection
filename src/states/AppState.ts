import { Service } from 'typedi'
import AppService from '../services/AppService'
import IState from './IState'

@Service()
export default class AppState extends IState {
  constructor(private appService: AppService) {
    super()

    this.init = this.init.bind(this)
    this.destroy = this.destroy.bind(this)

    this.initialized = this.appService.initialized
  }

  async init() {
    return this.appService.init()
  }

  async destroy() {
    return this.appService.destroy()
  }
}
