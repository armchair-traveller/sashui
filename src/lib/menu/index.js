import { tick } from 'svelte'
import { get, writable } from 'svelte/store'
import { addEvts } from '../utils/action'
import { elWalker } from '../utils/elWalker'
import { createId } from '../stores/createId'
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
export function useMenu(initOpen = false) {
  var buttonEl,
    menuEl,
    isMounted = initOpen
  const selected = writable(null),
    menuId = createId(),
    buttonId = createId()
  // TODO initial state for item commands should be initialized here, important for refactor with no need for TS declaration file because all functions are available

  // When using Object.assign, TS only infers types at return, not for intermediary code. That doesn't mean anything in
  // this case because we're using a declaration file, but it's still good to know.
  return Object.assign(Menu, {
    menuId,
    selected,
    ...writable(initOpen),
    open,
    close,
    button(node) {
      buttonEl = node
      buttonEl.ariaHasPopup = true
      buttonId.set(buttonEl, 'menubutton')
      const MenuUnsub = Menu.subscribe((isOpen) => (buttonEl.ariaExpanded = isOpen)),
        menuIdUnsub = menuId(buttonEl, 'aria-controls')
      const cleanup = addEvts(buttonEl, {
        click(e) {
          if (isMounted) close()
          else {
            e.preventDefault()
            e.stopPropagation()
            open()
          }
        },
        async keydown(e) {
          switch (e.key) {
            // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13
            case ' ':
            case 'Enter':
            case 'ArrowDown':
              await openTick()
              Menu.gotoItem?.()
              break
            case 'ArrowUp':
              await openTick()
              Menu.gotoItem?.(-1)
              break
          }
          function openTick() {
            e.preventDefault()
            e.stopPropagation()
            return open()
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
    Item:
      typeof window == 'undefined'
        ? Item // prevent SSR from tripping
        : class MenuItem extends Item {
            constructor(options) {
              options.props = options.props || {}
              options.props._Menu = Menu // pass in Menu action store to component, _Menu means internal use only
              super(options)
            }
          },
  })
  // === Main shared functionality
  async function open() {
    Menu.set(true)
    await tick()
    menuEl?.focus({ preventScroll: true })
  }
  async function close() {
    Menu.set(false)
    await tick()
    buttonEl?.focus({ preventScroll: true })
  }

  /** @type {import('svelte/action').Action<HTMLMenuElement | HTMLElement, { autofocus?: boolean }>} */
  function Menu(node, { autofocus = true } = {}) {
    menuEl = node
    isMounted = true
    // Attach helpers to Menu, used for programmatic purposes e.g. passed to `Item.svelte` & button handlers, consumer API
    // These helpers are always available once set, but should only be run if the menu element is on the DOM!
    // They don't do any checks, helprs aren't removed on destroy but considered it if it causes problems with the consumer API.
    Object.assign(Menu, { reset, gotoItem, nextItem, prevItem, search })

    const itemsWalker = elWalker(menuEl, (el) => el.getAttribute('role') == 'menuitem' && !el.disabled)

    menuId.set(menuEl, 'menu')
    menuEl.setAttribute('role', 'menu')
    menuEl.setAttribute('tabindex', 0)
    const selectedUnsub = selected.subscribe((el) =>
        el?.id ? menuEl.setAttribute('aria-activedescendant', el.id) : menuEl.removeAttribute('aria-activedescendant')
      ),
      buttonIdUnsub = buttonId(menuEl, 'aria-labelledby')

    autofocus && menuEl.focus({ preventScroll: true }) // a little redundant, but just in case consumer sets the menu state manually

    function clickOutside(e) {
      if (menuEl.contains(e.target) || buttonEl?.contains(e.target)) return
      close()
    }
    window.addEventListener('click', clickOutside)

    let searchQuery = '',
      cancelClearSearch = null
    const cleanup = addEvts(menuEl, {
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
            close()
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
            close()
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
        isMounted = false
        window.removeEventListener('click', clickOutside)
        cleanup()
        selectedUnsub()
        buttonIdUnsub()
        menuId.set()
      },
    }

    function search(char = '', timeout = 0) {
      clearTimeout(cancelClearSearch)
      searchQuery += char.toLowerCase()
      const matchedEl = Array.prototype.find.call(menuEl.querySelectorAll('[role=menuitem]:not([disabled])'), (el) =>
        el.textContent.trim().toLowerCase().startsWith(searchQuery)
      )
      if (matchedEl) reset(matchedEl)
      if (timeout) cancelClearSearch = setTimeout(() => (searchQuery = ''), timeout)
    }

    function nextItem() {
      return reset(itemsWalker.next())
    }
    function prevItem() {
      return reset(itemsWalker.prev())
    }

    // ==== Helpers attached to the menuEl
    function reset(curEl = null) {
      selected.set(curEl)
      return (itemsWalker.currentNode = curEl || menuEl)
    }

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
