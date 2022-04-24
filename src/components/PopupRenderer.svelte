<script lang="ts">
  import { fade, scale } from 'svelte/transition'
  import Container from 'typedi'
  import { AlertPopup, ConfirmPopup } from '../models/Popup'
  import PopupService from '../services/PopupService'

  const popupService = Container.get(PopupService)
  const popup = popupService.popup

  function close() {
    popupService.hide()
  }

  function backdropClick() {
    close()
  }
</script>

{#if $popup}
  <div
    class="bg-black bg-opacity-25 fixed left-0 top-0 right-0 bottom-0 z-50 backdrop-filter backdrop-blur-sm"
    on:mousedown={backdropClick}
    on:touchstart={backdropClick}
    in:fade|local={{ duration: 150 }}
    out:fade|local={{ duration: 150, delay: 250 }}
  />

  <div class="fixed top-10 left-0 right-0 z-50 text-center pointer-events-none">
    {#if $popup instanceof AlertPopup}
      <div
        class="inline-block widget widget-popup border-0 rounded-lg min-w-[450px] py-4 px-8 text-center pointer-events-auto"
        in:scale={{ delay: 150, duration: 250, start: 0.8 }}
        out:scale={{ duration: 250, start: 0.8 }}
      >
        <h1 class="font-bold">{$popup.title}</h1>
        <p class="mb-4">{$popup.description}</p>
        <button
          type="button"
          class="text-white bg-blue-500 rounded-lg inline-block py-1 px-12 cursor-pointer select-none focus:outline-none hover:ring focus:ring"
          on:click={close}
          autofocus
        >
          {$popup.btn_text}
        </button>
      </div>
    {:else if $popup instanceof ConfirmPopup}
      <div
        class="inline-block widget widget-popup border-0 rounded-lg min-w-[450px] py-4 px-8 text-center pointer-events-auto"
        in:scale={{ delay: 150, duration: 250, start: 0.8 }}
        out:scale={{ duration: 250, start: 0.8 }}
      >
        <h1 class="font-bold">{$popup.title}</h1>
        <p class="mb-4">{$popup.description}</p>
        <div class="flex justify-center">
          <button
            type="button"
            class="rounded-lg inline-block py-1 px-12 cursor-pointer select-none opacity-50 focus:outline-none hover:opacity-100 mx-1"
            on:click={() => $popup.on_cancel() && close()}
          >
            {$popup.cancel_text}
          </button>
          <button
            type="button"
            class="text-white bg-blue-500 rounded-lg inline-block py-1 px-12 cursor-pointer select-none focus:outline-none hover:ring focus:ring mx-1"
            on:click={() => $popup.on_ok() && close()}
            autofocus
          >
            {$popup.ok_text}
          </button>
        </div>
      </div>
    {:else}
      <div
        class="inline-block widget widget-popup border-0 rounded-lg min-w-[350px] py-4 px-8 text-center pointer-events-auto bg-red-400 text-white"
        in:scale={{ delay: 150, duration: 250, start: 0.8 }}
        out:scale={{ duration: 250, start: 0.8 }}
      >
        این پیام پشتیبانی نمیشود
      </div>
    {/if}
  </div>
{/if}
