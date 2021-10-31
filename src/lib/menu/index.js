import { onMount, tick } from 'svelte'
import { get, writable } from 'svelte/store'
import { addEvts } from '../utils/action'
import { elWalker } from '../utils/elWalker'
import { generateId } from '../utils/generateId'
import Item from './Item.svelte'

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
export function useMenu(initOpen = false) {
  var buttonEl,
    menuEl,
    isOpen = false
  const selected = writable(null),
    menuId = writable(null),
    buttonId = writable(null)

  onMount(() => Menu.subscribe((open) => (isOpen = open)))

  // When using Object.assign, TS only infers types at return, not for intermediary code.
  return Object.assign(Menu, {
    id: menuId,
    /** store for currently selected element */
    selected,
    ...writable(initOpen),
    openMenu,
    closeMenu,
    /** Button action, expected to be used on a `<button>`-like el. Opens and closes the menu. */
    button(el) {
      buttonEl = el
      buttonEl.ariaHasPopup = true
      buttonId.set((buttonEl.id = `sashui-menubutton-${generateId()}`))
      const MenuUnsub = Menu.subscribe((isOpen) => (buttonEl.ariaExpanded = isOpen)),
        menuIdUnsub = menuId.subscribe((id) =>
          id ? buttonEl.setAttribute('aria-controls', id) : buttonEl.removeAttribute('aria-controls')
        )
      const cleanup = addEvts(buttonEl, {
        click(e) {
          if (isOpen) closeMenu()
          else {
            e.preventDefault()
            e.stopPropagation()
            openMenu()
          }
        },
        async keydown(e) {
          switch (e.key) {
            // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13
            case ' ':
            case 'Enter':
            case 'ArrowDown':
              await openTick()
              Menu?.gotoItem()
              break
            case 'ArrowUp':
              await openTick()
              Menu?.gotoItem(-1)
              break
          }
          function openTick() {
            e.preventDefault()
            e.stopPropagation()
            return openMenu()
          }
        },
        keyup(e) {
          // Required for firefox, event.preventDefault() in handleKeyDown for the Space key doesn't cancel the handleKeyUp,
          // which in turn triggers a *click*.
          e.key == ' ' && e.preventDefault()
        },
      })

      return {
        destroy() {
          cleanup()
          menuIdUnsub()
          MenuUnsub()
          buttonId.set(null)
        },
      }
    },
    /** A renderless component for a menu item. Generally, it should be wrapped around a button. Exposes an active slot prop for whether the current item is active. */
    Item:
      typeof window == 'undefined'
        ? Item // prevent SSR from tripping
        : class MenuItem extends Item {
            constructor(options) {
              options.props = options.props || {}
              options.props.Menu = Menu // pass in Menu action store to component
              super(options)
            }
          },
  })
  // === Main shared functionality
  async function openMenu() {
    Menu.set(true)
    await tick()
    menuEl?.focus({ preventScroll: true })
  }
  async function closeMenu() {
    Menu.set(false)
    await tick()
    buttonEl?.focus({ preventScroll: true })
  }

  /** Menu action store. Ideal tag: `<menu>`
   *
   * Menu store gives open state, which can be set to manually manage open/close if desired. It also has many helpers usable both programmatically and internally.
   *
   * * Theoretically, actions make it easy to incorporate options via params. No options are obvious at the moment, so none are present. And custom stores/methods can be used to easily manage that, too.
   */
  function Menu(node) {
    menuEl = node
    // Attach helpers to Menu, which is on menu el as if it's a context, used for programmatic purposes e.g. `Item.svelte` & button handlers, consumer API
    // These helpers are always available once set, but should only be run if the menu element is on the DOM! (They don't do any checks)
    menuEl.Menu = Object.assign(Menu, { reset, gotoItem, nextItem, prevItem, search })

    const itemsWalker = elWalker(menuEl, (el) => el.getAttribute('role') == 'menuitem' && !el.disabled)

    menuId.set((menuEl.id = `sashui-menu-${generateId()}`))
    menuEl.setAttribute('role', 'menu')
    menuEl.setAttribute('tabindex', 0)
    const selectedUnsub = selected.subscribe((el) =>
        el?.id ? menuEl.setAttribute('aria-activedescendant', el.id) : menuEl.removeAttribute('aria-activedescendant')
      ),
      buttonIdUnsub = buttonId.subscribe((id) =>
        id ? menuEl.setAttribute('aria-labelledby', id) : menuEl.removeAttribute('aria-labelledby')
      )

    menuEl.focus({ preventScroll: true }) // a little redundant, but just in case consumer sets the menu state manually

    function clickOutside(e) {
      if (menuEl.contains(e.target) || buttonEl?.contains(e.target)) return
      closeMenu()
    }
    window.addEventListener('click', clickOutside)

    let searchQuery = '',
      cancelClearSearch = null
    const rmEvts = addEvts(menuEl, {
      keydown(e) {
        function keyModifier() {
          e.preventDefault()
          e.stopPropagation()
        }
        switch (e.key) {
          // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-12

          case ' ':
            if (searchQuery != '') {
              keyModifier()
              return search(e.key)
            }
          // When in type ahead mode, fallthrough
          case 'Enter':
            keyModifier()
            get(selected)?.click()
            closeMenu()
            break

          case 'ArrowDown':
            keyModifier()
            return nextItem()

          case 'ArrowUp':
            keyModifier()
            return prevItem()

          case 'Home':
          case 'PageUp':
            keyModifier()
            return gotoItem()

          case 'End':
          case 'PageDown':
            keyModifier()
            return gotoItem(-1)

          case 'Escape':
            keyModifier()
            closeMenu()
            break

          // Nullify tab for focus trapping purposes
          case 'Tab':
            keyModifier()
            break

          default:
            if (e.key.length == 1) search(e.key, 350)
            break
        }
      },
      keyup(e) {
        // Required for firefox, event.preventDefault() in handleKeyDown for the Space key doesn't cancel the handleKeyUp,
        // which in turn triggers a *click*.
        e.key == ' ' && e.preventDefault()
      },
    })
    return {
      destroy() {
        window.removeEventListener('click', clickOutside)
        rmEvts()
        selectedUnsub()
        buttonIdUnsub()
        menuId.set(null)
      },
    }

    /** Search by str, clears timeout but doesn't set it on invoke.
     * @param {number} timeout - if not set, won't clear timeout. Resets timeout if invoked again before clear
     */
    function search(char = '', timeout = null) {
      clearTimeout(cancelClearSearch)
      searchQuery += char.toLowerCase()
      const matchedEl = Array.prototype.find.call(menuEl.querySelectorAll('[role=menuitem]:not([disabled])'), (el) =>
        el.textContent.trim().toLowerCase().startsWith(searchQuery)
      )
      if (matchedEl) reset(matchedEl)
      if (typeof timeout == 'number') cancelClearSearch = setTimeout(() => (searchQuery = ''), timeout)
    }

    function nextItem() {
      return reset(itemsWalker.next())
    }
    function prevItem() {
      return reset(itemsWalker.prev())
    }

    // ==== Helpers attached to the menuEl
    /** resets currently selected menuitem, or sets it to the el passed in */
    function reset(curEl = null) {
      selected.set(curEl)
      return (itemsWalker.currentNode = curEl || menuEl)
    }
    /** @param idx default first item, accepts negative indexing. */
    function gotoItem(idx = 0) {
      if (idx < 0) {
        // negative idx, start from last item
        itemsWalker.last()
        while (idx < -1) {
          idx++
          itemsWalker.prev()
        }
      } else {
        itemsWalker.first()
        while (idx > 0) {
          idx--
          itemsWalker.next()
        }
      }
      return reset(itemsWalker.currentNode)
    }
  }
}
