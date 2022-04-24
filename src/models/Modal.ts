export default class Modal {
  title: string
  componentName: string
  resizable?: boolean
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  draggable?: boolean
  keepRatio?: boolean
  data?: { [key: string]: any }

  static fromJson(input: { [key: string]: any }) {
    const instance = new Modal()

    instance.title = input['title']
    instance.componentName = input['componentName']
    instance.resizable = input['resizable']
    instance.width = input['width']
    instance.height = input['height']
    instance.minWidth = input['minWidth']
    instance.minHeight = input['minHeight']
    instance.draggable = input['draggable']
    instance.keepRatio = input['keepRatio']
    instance.data = input['data']

    return instance
  }
}
