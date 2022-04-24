<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import { scale } from 'svelte/transition'
  import Container from 'typedi'
  import { Tracker } from '../../deps/moving-things-tracker.js'
  import Loading from '../components/Loading.svelte'
  import config from '../config'
  import CrossCounter from '../datalayer/CrossCounter'
  import FpsMeter from '../datalayer/FpsMeter'
  import ObjectDetector from '../datalayer/ObjectDetector'
  import { fileToDataUrl } from '../helpers/files'
  import CameraService from '../services/CameraService'

  const cameraService = Container.get(CameraService)

  const cameraInitial = cameraService.initialized
  const media = cameraService.camera
  const yoloWidth = config.yoloWidth
  const yoloHeight = config.yoloHeight
  const objectDetector = new ObjectDetector()
  const modelReady = writable(false)
  const crossCounter = new CrossCounter()
  const countDown = crossCounter.countDown
  const countUp = crossCounter.countUp
  const fpsMeter = new FpsMeter()
  const fps = writable(0)

  let prevFrameDetectedObjects: DetectedObject[] = undefined
  let videoEle: HTMLVideoElement
  let canvasEle: HTMLCanvasElement
  let inputFile: HTMLInputElement
  let imgEle: HTMLImageElement
  let onlyDetect = undefined
  let videoIsPlaying = false
  let isPauseVideo = false

  $: if ($cameraInitial && videoEle && $media) {
    videoEle.srcObject = $media
  }

  async function processImage(data: ImageData) {
    const frameDetectedObjects = await objectDetector.detect(data, onlyDetect)

    if (!prevFrameDetectedObjects) {
      prevFrameDetectedObjects = frameDetectedObjects
    }

    // Tracker
    Tracker.updateTrackedItemsWithNewFrame(
      prevFrameDetectedObjects,
      frameDetectedObjects,
    )

    prevFrameDetectedObjects = frameDetectedObjects

    const tracked = Tracker.getJSONOfTrackedItems() as TrackedObject[]

    objectDetector.renderDetectResult(
      tracked,
      // frameDetectedObjects
      //   .filter((_, index) => !!tracked[index])
      //   .map((item, index) => {
      //     return {
      //       ...item,
      //       id: tracked[index].id,
      //       isZombie: tracked[index].isZombie,
      //       bearing: tracked[index].bearing,
      //     }
      //   }),
      data,
      0.5,
    )

    crossCounter.countCrossedY(tracked, 420)
    fps.set(fpsMeter.fps())
  }

  async function startProcessVideo() {
    videoEle.play()
    isPauseVideo = false

    requestAnimationFrame(processVideo)
  }

  async function processVideo() {
    if (isPauseVideo) {
      return
    }

    const img = objectDetector.getImageFromEle(
      videoEle,
      videoEle.videoWidth,
      videoEle.videoHeight,
    )

    await processImage(img)

    // setTimeout(startProcessVideo, 1000 / 1)
    // setTimeout(startProcessVideo, 0)
    requestAnimationFrame(processVideo)
  }

  function pauseProcessVideo() {
    videoEle.pause()
  }

  function initCamera() {
    cameraService.init()
  }

  function uploadFile() {
    inputFile.value = ''
    inputFile.click()
  }

  async function onFileChoose() {
    const file = inputFile.files[0]
    prevFrameDetectedObjects = undefined

    if (file.type.match(/image\/.*/)) {
      // Image
      imgEle.src = await fileToDataUrl(file)
      imgEle.onload = async function () {
        const img = objectDetector.getImageFromEle(
          imgEle,
          imgEle.naturalWidth,
          imgEle.naturalHeight,
        )

        processImage(img)
      }
    } else if (file.type.match(/video\/*/)) {
      videoEle.src = await fileToDataUrl(file)
      videoEle.onloadedmetadata = startProcessVideo
      videoEle.onended = () => (videoIsPlaying = false)
      videoEle.onplay = () => {
        videoIsPlaying = true
        isPauseVideo = false
      }
      videoEle.onpause = () => (isPauseVideo = true)
      videoEle.play()
    }
  }

  onMount(async function () {
    await objectDetector.init(
      '/yolov5s_web_model/model.json',
      [
        'person',
        'bicycle',
        'car',
        'motorcycle',
        'airplane',
        'bus',
        'train',
        'truck',
        'boat',
        'traffic light',
        'fire hydrant',
        'stop sign',
        'parking meter',
        'bench',
        'bird',
        'cat',
        'dog',
        'horse',
        'sheep',
        'cow',
        'elephant',
        'bear',
        'zebra',
        'giraffe',
        'backpack',
        'umbrella',
        'handbag',
        'tie',
        'suitcase',
        'frisbee',
        'skis',
        'snowboard',
        'sports ball',
        'kite',
        'baseball bat',
        'baseball glove',
        'skateboard',
        'surfboard',
        'tennis racket',
        'bottle',
        'wine glass',
        'cup',
        'fork',
        'knife',
        'spoon',
        'bowl',
        'banana',
        'apple',
        'sandwich',
        'orange',
        'broccoli',
        'carrot',
        'hot dog',
        'pizza',
        'donut',
        'cake',
        'chair',
        'couch',
        'potted plant',
        'bed',
        'dining table',
        'toilet',
        'tv',
        'laptop',
        'mouse',
        'remote',
        'keyboard',
        'cell phone',
        'microwave',
        'oven',
        'toaster',
        'sink',
        'refrigerator',
        'book',
        'clock',
        'vase',
        'scissors',
        'teddy bear',
        'hair drier',
        'toothbrush',
      ],
      canvasEle,
      yoloWidth,
      yoloHeight,
    )
    await objectDetector.load()
    modelReady.set(true)
  })

  onDestroy(function () {
    cameraService.destroy()
  })
</script>

<div class="pt-10 text-center">
  <div class="inline-block relative">
    <div class="h-2 w-full bg-green-500 bg-opacity-75 absolute top-[420px]" />

    {#if $countDown || $countUp || $fps}
      <div
        class="absolute top-2 left-2 bg-white bg-opacity-25 backdrop-filter backdrop-blur-sm rounded-lg p-2 px-4 text-sm text-left font-sans min-w-[120px]"
        dir="ltr"
        in:scale|local
      >
        <div class="flex items-center">
          <div class="w-12">Enter</div>
          <div class="text-lg">{$countDown}</div>
        </div>
        <div class="flex items-center">
          <div class="w-12">Exit</div>
          <div class="text-lg">{$countUp}</div>
        </div>
        <div class="flex items-center mt-2 text-italic">
          <div class="w-12">FPS</div>
          <div>{$fps}</div>
        </div>
      </div>
    {/if}

    <canvas
      bind:this={canvasEle}
      width={yoloWidth}
      height={yoloHeight}
      class="block bg-black rounded-lg bg-cover"
    />
  </div>
</div>

<div class="text-center mt-4">
  {#if $modelReady}
    {#if $cameraInitial}
      <button
        class="py-1 px-6 bg-blue-500 rounded-lg"
        on:click={startProcessVideo}>پردازش تصویر دوربین</button
      >
    {:else}
      <button class="py-1 px-6 bg-blue-500 rounded-lg" on:click={initCamera}
        >فعال کردن دوربین</button
      >
    {/if}

    <button class="py-1 px-6 bg-blue-500 rounded-lg" on:click={uploadFile}
      >انتخاب عکس یا فیلم</button
    >

    {#if videoIsPlaying && !isPauseVideo}
      <button
        class="py-1 px-6 bg-red-400 rounded-lg w-32"
        on:click={pauseProcessVideo}
        in:scale|local>توقف</button
      >
    {:else if isPauseVideo}
      <button
        class="py-1 px-6 bg-green-500 rounded-lg w-32"
        on:click={startProcessVideo}
        in:scale|local>پخش</button
      >
    {/if}
  {:else}
    <div class="w-8 h-8 inline-block">
      <Loading />
    </div>
  {/if}
</div>

<!-- {#if $countDown || $countUp}
  <div class="flex items-center justify-center mt-4" in:slide>
    <div
      class="rounded-lg bg-black bg-opacity-50 w-28 h-28 mx-2 flex items-center justify-center text-5xl relative pt-6"
    >
      <div
        class="absolute top-0 left-0 right-0 pt-3 text-sm text-center opacity-50"
      >
        خروج(پایین)
      </div>
      {$countDown}
    </div>
    <div
      class="rounded-lg bg-black bg-opacity-50 w-28 h-28 mx-2 flex items-center justify-center text-5xl relative pt-6"
    >
      <div
        class="absolute top-0 left-0 right-0 pt-3 text-sm text-center opacity-50"
      >
        ورود(بالا)
      </div>
      {$countUp}
    </div>
  </div>
{/if} -->

<video
  bind:this={videoEle}
  width={yoloWidth}
  height={yoloHeight}
  muted={true}
  autoplay={true}
  class="rounded-lg bg-black mx-2 w-0 h-0 overflow-hidden"
/>

<input
  bind:this={inputFile}
  type="file"
  class="hidden"
  on:change={onFileChoose}
  accept="image/*, video/*"
/>

<img
  bind:this={imgEle}
  width={yoloWidth}
  height={yoloHeight}
  class="hidden"
  alt=""
/>
