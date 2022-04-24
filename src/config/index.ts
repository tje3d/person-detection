const yoloWidth = 640
const yoloHeight = 640

export default {
  yoloWidth,
  yoloHeight,
  camera: {
    audio: false,
    video: {
      width: {
        exact: yoloWidth,
      },
      height: {
        exact: yoloHeight,
      },
      facingMode: 'user',
    },
  },
}
