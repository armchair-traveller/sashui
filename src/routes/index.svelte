<script>
  import Menu from "$lib/shui/menu/Menu.svelte";
  console.log(Menu.I);
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

<Menu let:Shui={Menu}>
  <div>
    <Menu.Item />
    <Menu.Items />
    <!-- <svelte:component this={Item} /> -->
    <!-- <Item /> -->
    <!-- <Items>hello</Items> -->
  </div>
</Menu>
