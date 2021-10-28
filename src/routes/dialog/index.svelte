<script>
import { useDialog } from '$lib/dialog'
import { fade } from 'svelte/transition'
const dialog = useDialog()
</script>

<button on:click={() => ($dialog = true)}>Open dialog</button>
{#if $dialog}
  <div
    class="fixed z-10 inset-0 overflow-y-auto"
    use:dialog
    on:close={() => ($dialog = false)}
    aria-describedby="dialog-desc"
    transition:fade
  >
    <div class="min-h-screen px-4 text-center">
      <div class="fixed inset-0" use:dialog.overlay />
      <div
        class="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl"
      >
        <h2 use:dialog.title>Deactivate account</h2>
        <div id="dialog-desc">This will permanently deactivate your account</div>

        <p>
          Are you sure you want to deactivate your account? All of your data will be permanently removed. This action
          cannot be undone.
        </p>

        <button on:click={() => ($dialog = false)}>Deactivate</button>
        <button on:click={() => ($dialog = false)}>Cancel</button>
      </div>
    </div>
  </div>
{/if}
