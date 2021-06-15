<script>
  export let isOpen = false;
</script>

{#if isOpen}
  <!-- Expects slotted <Item/>s  -->
  <!-- Slots can accept multilple components at once, so this is fine. -->
  <slot />

  <!-- $$slots has no relevance here, as that's for conditionally rendering slots based on name prop provided -->
  <!-- ...unless you use computed properties to dynamically change ID/name of slots. Hmmm... an idea worth testing -->
{/if}
