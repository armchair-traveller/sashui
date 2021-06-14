<script>
  import { Menu } from "@headlessui/svelte";
</script>

<Menu let:ui={{ Button, Items, Item }}>
  <Button>More</Button>
  <Items>
    <Item let:active>
      <a class={active && "bg-blue-500"} href="/account-settings">
        Account settings
      </a>
    </Item>
    <Item let:active>
      <a class={active && "bg-blue-500"} href="/account-settings">
        Documentation
      </a>
    </Item>
    <Item disabled>
      <span class="opacity-75">Invite a friend (coming soon!)</span>
    </Item>
  </Items>
</Menu>
