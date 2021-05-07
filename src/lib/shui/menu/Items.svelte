<script>
  export let isOpen = false;
</script>

{#if isOpen}
  <slot />
{/if}
