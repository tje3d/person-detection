import * as tf from '@tensorflow/tfjs'

export default class ObjectDetector {
  url: string
  names: string[]
  width: number = 640
  height: number = 640

  model: tf.GraphModel

  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  // Font Options
  fontSize = 12

  /**
   * Initialize
   * @param url string
   * @param names string[]
   * @param canvasOpt HTMLCanvasElement
   * @param width number
   * @param height number
   */
  async init(
    url: string,
    names: string[],
    canvasOpt?: HTMLCanvasElement,
    width: number = 640,
    height: number = 640,
  ) {
    this.url = url
    this.names = names

    if (canvasOpt) {
      this.canvas = canvasOpt
    } else {
      this.canvas = document.createElement('canvas')
    }

    this.canvas.width = width
    this.canvas.height = height

    this.ctx = this.canvas.getContext('2d')
    this.ctx.font = `${this.fontSize}px sans-serif`
    this.ctx.textBaseline = 'top'
    this.ctx.textAlign = 'left'

    return this
  }

  /**
   * Load GraphModel and initiliaze model
   * @returns ObjectDetector
   */
  async load() {
    if (this.model) {
      return this
    }

    this.model = await tf.loadGraphModel(this.url)

    return this
  }

  /**
   * Take a element and resize it
   * @param input HTMLImageElement | HTMLVideoElement
   * @returns ObjectDetector
   */
  getImageFromEle(
    input: HTMLImageElement | HTMLVideoElement,
    naturalWidth: number,
    naturalHeight: number,
  ) {
    const _canvas = document.createElement('canvas')
    _canvas.width = this.width
    _canvas.height = this.height

    const _ctx = _canvas.getContext('2d')

    const ratio = Math.min(
      this.width / naturalWidth,
      this.height / naturalHeight,
    )
    const newWidth = Math.round(naturalWidth * ratio)
    const newHeight = Math.round(naturalHeight * ratio)

    _ctx.drawImage(
      input,
      0,
      0,
      naturalWidth,
      naturalHeight,
      (this.width - newWidth) / 2,
      (this.height - newHeight) / 2,
      newWidth,
      newHeight,
    )

    return _ctx.getImageData(0, 0, this.width, this.height)
  }

  /**
   * Resize canvas to our required size
   * @param pixels tf.PixelData | ImageData | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageBitmap
   * @param numChannels number
   */
  prepareData(
    pixels:
      | tf.PixelData
      | ImageData
      | HTMLImageElement
      | HTMLCanvasElement
      | HTMLVideoElement
      | ImageBitmap,
    numChannels?: number,
  ) {
    return tf.tidy(() => {
      return tf.browser.fromPixels(pixels, numChannels).div(255.0).expandDims(0)
      // return tf.image
      //   .resizeBilinear(tf.browser.fromPixels(pixels, numChannels), [
      //     this.width,
      //     this.height,
      //   ])
      //   .div(255.0)
      //   .expandDims(0)
    })
  }

  /**
   * Detect objects inside the image
   * @returns Promise<DetectedObject[]>
   */
  async detect(data: ImageData, only?: string): Promise<DetectedObject[]> {
    const result = (await this.model.executeAsync(
      this.prepareData(data),
    )) as tf.Tensor[]

    const output = []
    const [boxes, scores, classes, valid_detections] = result
    const validsCount = valid_detections.dataSync()[0]
    const boxesSync = boxes.dataSync()
    const classesSync = classes.dataSync()
    const scoresSync = scores.dataSync()

    tf.dispose(result)

    for (let i = 0; i < validsCount; ++i) {
      const name = this.names[classesSync[i]]
      const score = scoresSync[i].toFixed(2)

      if (only && name !== only) {
        continue
      }

      let [x1, y1, x2, y2] = boxesSync.slice(i * 4, (i + 1) * 4)
      x1 *= this.width
      x2 *= this.width
      y1 *= this.height
      y2 *= this.height
      const width = x2 - x1
      const height = y2 - y1

      output.push({
        x: x1,
        y: y1,
        w: width,
        h: height,
        name,
        confidence: score,
      })
    }

    return output
  }

  /**
   * Take array of tf.Tensor and draw it on
   * @param input tf.Tensor[]
   * @param minScore number
   */
  renderDetectResult(
    input: TrackedObject[],
    processedImageData: ImageData,
    minScore?: number,
  ) {
    this.ctx.clearRect(0, 0, this.width, this.height)
    this.ctx.putImageData(processedImageData, 0, 0)

    input.forEach((item) => {
      if (minScore && item.confidence < minScore) {
        return
      }

      const id = item.id + ''
      const label = item.confidence + ' ' + item.name

      this.ctx.beginPath()
      this.ctx.rect(item.x, item.y, item.w, item.h)
      this.ctx.lineWidth = 2
      this.ctx.strokeStyle = '#00FFFF'
      this.ctx.fillStyle = '#00FFFF'
      this.ctx.stroke()
      // this.ctx.fillText(label, item.x + item.w + 2, item.y)

      // this.ctx.fillText(id, item.x + item.w / 2 - 2, item.y + item.h / 2 - 2)
      // this.ctx.fillText(`${item.x}x${item.y}`, item.x, item.y - 10)
    })
  }
}
