<script>
  import Item from "./Item.svelte";
  import Items from "./Items.svelte";

  let isOpen = false;
</script>

<slot Shui={{ Item, Items }} />
