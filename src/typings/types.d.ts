declare module '*.svg'
declare module '*.png'
declare module '*.jpg'

declare namespace svelte.JSX {
  declare interface HTMLAttributes extends SvelteRouting.AnchorAttributes {}
}
