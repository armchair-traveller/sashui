import type { Writable } from 'svelte/types/runtime/store'
import type Item from './Item.svelte'

/** Menu action store to create a dropdown menu. Ideal tag: `<menu>`
 *
 * Menu store gives open state, which can be set to manually manage open/close if desired. It also has many helpers usable both programmatically and internally.
 *
 * * Theoretically, actions make it easy to incorporate options via params. No options are obvious at the moment, so none are present. And custom stores/methods can be used to easily manage that, too.
 */
interface Menu extends Writable<?boolean> {
  (
    node: HTMLMenuElement | HTMLElement,
    params: {
      autofocus?: boolean
    }
  ): { destroy(): void }
  /** Button action, expected to be used on a `<button>`-like element. Opens and closes the menu. */
  button(node: HTMLButtonElement | HTMLInputElement): { destroy(): void }
  /** A renderless component for a menu item. Generally, it should be wrapped around a button. Exposes an active slot prop for whether the current item is active. */
  Item: Item
  /** Store for currently selected element */
  selected: Writable<?HTMLElement>
  menuId: Writable<?string>
  open(): Promise<void>
  close(): Promise<void>
  /** Resets currently selected menuitem, or sets it to the el passed in */
  reset?(curEl?: HTMLElement): HTMLElement
  gotoItem?(/** Default first item, accepts negative indexing. */ idx?: number): HTMLElement
  nextItem?(): HTMLElement
  prevItem?(): HTMLElement
  /** Search by str, clears timeout but doesn't set it on invoke. */
  search?(
    char?: string,
    /** If unset, won't clear timeout. Resets timeout if invoked again before clearing.  */
    timeout?: number
  ): void
}

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
* for Svelte to recognize the component(s) attached to it.
*/
export function useMenu(initOpen?: boolean): Menu
