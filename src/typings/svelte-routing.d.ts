namespace SvelteRouting {
  interface Location {
    hash?: string
    host?: string // "127.0.0.1:8080"
    hostname?: string // "127.0.0.1"
    href?: string // "https://127.0.0.1:8080/mytests"
    key?: string // "1599508777696"
    origin?: string // "https://127.0.0.1:8080"
    pathname?: string
    port?: string
    protocol?: 'http' | 'https'
    reload?: Function
    replace?: Function
    search?: ''
    state?: { key: string }
    toString?: Function
  }

  interface AnchorAttributes {
    noroute?: boolean
    replace?: boolean
  }
}

declare module 'svelte-routing' {
  export const Router: any
  export const Route: any
  export const Link: any
  export const navigate: (to: string, options: NavigateOptions) => void
  export const link: (node: Element) => { destroy(): void }
  export const links: (node: Element) => { destroy(): void }

  export interface NavigateOptions {
    replace?: boolean
    state: object
  }
}

declare module 'svelte-routing/src/history.js' {
  declare const globalHistory: {
    location: SvelteRouting.Location
    listen: (listener: Function) => void
  }
}
