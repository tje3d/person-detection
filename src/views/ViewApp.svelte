<script lang="ts">
  import AppState from 'src/states/AppState'
  import { onDestroy, onMount } from 'svelte'
  import { Route, Router } from 'svelte-routing'
  import Container from 'typedi'
  import PopupRenderer from '../components/PopupRenderer.svelte'
  import ViewHome from './ViewHome.svelte'

  export const url: string = ''

  const state = Container.get(AppState)
  const initialized = state.initialized
  const publicPath = '/'

  onMount(state.init)

  onDestroy(state.destroy)
</script>

<PopupRenderer />

{#if $initialized}
  <Router {url} basepath={publicPath}>
    <Route path="/" component={ViewHome} />
  </Router>
{/if}
