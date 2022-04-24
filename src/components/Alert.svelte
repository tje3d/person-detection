<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { slide } from 'svelte/transition'
  import WidgetAlert from '../models/widgets/WidgetAlert'
  import Icon from './Icon.svelte'

  export let widget: WidgetAlert

  const dispatcher = createEventDispatcher()

  function remove() {
    dispatcher('remove')
  }
</script>

<div
  class={`widget-alert py-4 px-4 mb-4 flex rounded items-center border-r-8 shadow-md ${widget.borderColor}`}
  transition:slide|local={{ duration: 150 }}
>
  <div class="flex-1">
    {@html widget.title}
  </div>

  {#if widget.closable}
    <div
      class="mr-4 w-8 h-8 cursor-pointer flex items-center justify-center opacity-25 hover:opacity-100"
      on:click={remove}
    >
      <div class="w-3 h-3">
        <Icon name="close" />
      </div>
    </div>
  {/if}
</div>
