<script>
import { useMenu } from '$lib'
const Menu = useMenu()
const NestedMenu = useMenu()
</script>

<button use:Menu.button> Open Menu </button>

{#if $Menu}
  <menu use:Menu>
    <Menu.Item nested>
      <button use:NestedMenu.button>Open Nested Menu</button>
    </Menu.Item>
  </menu>
{/if}

{#if $NestedMenu}
  <menu use:NestedMenu>
    <NestedMenu.Item>
      <button>Nested Menu Item</button>
    </NestedMenu.Item>
  </menu>
{/if}
