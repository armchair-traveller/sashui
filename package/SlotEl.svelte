<!-- @component
Takes a slot, gets the first el of the slotted content by using a trick of inserting and removing a hidden div, from 
the DOM. It checks for updates, so if you're attaching event handlers to the el and swap it with some other, make sure
to cleanup your handlers by reacting to the bound el.
-->
<script>
import { afterUpdate } from 'svelte'
/** bind to this prop */
export let el = null
let beforeEl,
  ready = true
$: if (beforeEl) {
  el = beforeEl.nextElementSibling
  ready = false
}
// ? consider alternative: mutation observer
afterUpdate(() => !el?.isConnected && (ready ||= true))
</script>

{#if $$slots.default}
  {#if ready}
    <div bind:this={beforeEl} style="display:none" />
  {/if}
  <slot />
{/if}
