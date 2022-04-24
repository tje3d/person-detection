import dependencyInjector from './LoaderDependencyInjector'
import services from './LoaderServices'

export default async () => {
  await dependencyInjector()

  console.log('dependencyInjector loaded')

  await services()

  console.log('services loaded')

  // Initialize global plugins

  // ...

  console.log('global plugins initialized')
}
