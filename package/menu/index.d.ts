/**
 * Implementation differences:
 * - No auto-removal of non-menuitem roles via tree walker
 * - Tree walker used to navigate items instead of by a manually managed list of data
 *   - selected check is performed by menuitem element equality check instead of id
 * - button/input disabled uses native `disabled` attribute.
 * - Significantly less opinionated about where you place your markup, except where required, due to lack of context
 * - Next item after reaching last item loops back to the first item, and vice versa for first item to previous item = last item.
 */
/**
 * Creates a new menu instance.
Usage:
```svelte
<script>
import { useMenu } from 'sashui'
const Menu = useMenu()
</script>

<button use:Menu.button>open</button>

{#if $Menu}
  <menu use:Menu>
    <Menu.Item let:active>
      <button class="{active ? 'bg-red-400' : ''} text-black">hi</button>
    </Menu.Item>
  </menu>
{/if}
```
* Uses closures, stores, and elements to handle state. Doesn't use context so theoretically you could use it outside
* the script tag... but not recommended.
*
* Note: button/input disabled uses native `disabled` attribute. Please use elements that have valid disabled attributes if you plan to disable them.
* Otherwise you'll have to set the disabled prop on the el obj itself and add the disabled attribute.
* @returns `Menu` action store, w/ additional actions, components, and helpers. If not destructured, MUST be capitalized
* for Svelte to recognize the component(s) attached to it.
*/
export function useMenu(): {
    (node: any): {
        destroy(): void;
    };
    selected: import("svelte/store").Writable<any>;
    /** Subscribe to menu open state */
    subscribe: (this: void, run: import("svelte/store").Subscriber<boolean>, invalidate?: (value?: boolean) => void) => import("svelte/store").Unsubscriber;
    /** Set menu open state */
    set: (this: void, value: boolean) => void;
    /** Update menu open state */
    update: (this: void, updater: import("svelte/store").Updater<boolean>) => void;
    openMenu: () => Promise<void>;
    closeMenu: () => Promise<void>;
    /** Button action */
    button(el: any): {
        destroy(): void;
    };
    Item: typeof Item;
};
import Item from "./Item.svelte";
