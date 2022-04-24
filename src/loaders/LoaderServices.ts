import Container from 'typedi'
import PopupService from '../services/PopupService'
import RouterService from '../services/RouterService'
import SettingsService from '../services/SettingsService'
import ThemeService from '../services/ThemeService'
import WindowService from '../services/WindowService'

export default async () => {
  await Container.get(SettingsService).init()
  console.log('SettingsService loaded')

  await Container.get(RouterService).init()
  console.log('RouterService loaded')

  await Container.get(WindowService).init()
  console.log('WindowService loaded')

  await Container.get(PopupService).init()
  console.log('PopupService loaded')

  await Container.get(ThemeService).init()
  console.log('ThemeService loaded')
}
