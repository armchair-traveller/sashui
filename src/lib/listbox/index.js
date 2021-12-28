import { tick } from 'svelte'
import { get, writable } from 'svelte/store'
import { addEvts } from '$lib/utils/action'
import { elWalker } from '$lib/utils/elWalker'
import { createId } from '$lib/stores/createId'
import Option from '$lib/listbox/Option.svelte'

/**
 * Creates a new listbox instance. Refer to menu API.
 * Main differences: `aria-orientation` capability and `aria-disabled` instead of `disabled for options.
 * @returns `Listbox` action store, w/ additional actions, components, and helpers. If not destructured, MUST be capitalized
 * for Svelte to recognize the component(s) attached to it.
 */
export function useListbox(initOpen = false) {
  let isMounted = initOpen,
    buttonEl,
    listboxEl
  const selected = writable(),
    buttonId = createId(),
    listboxId = createId()

  return Object.assign(Listbox, {
    listboxId,
    /** store for currently selected element */
    selected,
    ...writable(initOpen),
    open,
    close,
    /** Button action, expected to be used on a `<button>`-like el. Opens and closes the menu. */
    button(node) {
      buttonEl = node
      buttonEl.ariaHasPopup = true
      buttonId.set(buttonEl, 'listboxbutton')
      // ! unnecessary ?TODO aria-labelledby id of label el
      const ListboxUnsub = Listbox.subscribe((isOpen) => (buttonEl.ariaExpanded = isOpen)),
        listboxIdUnsub = listboxId(buttonEl, 'aria-controls')
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
              Listbox.gotoItem?.()
              break
            case 'ArrowUp':
              await openTick()
              Listbox.gotoItem?.(-1)
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
          listboxIdUnsub()
          ListboxUnsub()
          buttonId.set(null)
        },
      }
    },
    // ! Seems like label is unnecessary.
    // ?TODO skipping this unless it's needed, remove later if not label(){}
    /** A renderless component for an option. default child: `<li>`. Exposes an active slot prop for whether the current item is active.
     * Set `aria-disabled` attribute to disable an option.
     */
    Option:
      typeof window == 'undefined'
        ? Option // prevent SSR from tripping
        : class ListboxOption extends Option {
            constructor(options) {
              options.props = options.props || {}
              options.props.Listbox = Listbox // pass in Listbox action store to component
              super(options)
            }
          },
  })
  // === Main shared functionality
  async function open() {
    Listbox.set(true)
    await tick()
    listboxEl?.focus({ preventScroll: true })
  }
  async function close() {
    Listbox.set(false)
    await tick()
    buttonEl?.focus({ preventScroll: true })
  }

  /** default tag: `<ul>`.
   * Similar API to menu. Only additions: `aria-orientation` for potential horizontal listboxes, and `aria-disabled` instead of `disabled` for each individual option.
   * As for why aria attributes are usable by the consumer, it made more sense as they are valid attributes, and would have been set internally even if they weren't exposed.
   * aria-orientation can be set by to 'horizontal' by user for left/right keyboard nav. */
  function Listbox(node, { autofocus = true } = {}) {
    listboxEl = node // AKA container
    isMounted = true
    // Attach helpers to Listbox, which is on listbox el as if it's a context, used for programmatic purposes e.g. `Item.svelte` & button handlers, consumer API
    // These helpers are always available once set, but should only be run if the listbox element is on the DOM! (They don't do any checks)
    listboxEl.Listbox = Object.assign(Listbox, { reset, gotoItem, nextItem, prevItem, search })

    const itemsWalker = elWalker(listboxEl, (el) => el.getAttribute('role') == 'option' && el.ariaDisabled == null)

    listboxId.set(listboxEl, 'listbox-options')
    listboxEl.setAttribute('role', 'listbox')
    listboxEl.setAttribute('tabindex', 0)
    // aria-orientation = Default 'vertical', else 'horizontal'. Impact: keyboard up/down to left/right.
    listboxEl.ariaOrientation ||= 'vertical'

    const selectedUnsub = selected.subscribe((el) =>
        el?.id
          ? listboxEl.setAttribute('aria-activedescendant', el.id)
          : listboxEl.removeAttribute('aria-activedescendant')
      ),
      // ? labelledby is either by the label, or if doesn't exist, then the button. Currently it's by the button only.
      buttonIdUnsub = buttonId(listboxEl, 'aria-labelledby')

    autofocus && listboxEl.focus({ preventScroll: true }) // a little redundant, but just in case consumer sets the listbox state manually

    function clickOutside(e) {
      if (listboxEl.contains(e.target) || buttonEl?.contains(e.target)) return
      close()
    }
    window.addEventListener('click', clickOutside)

    const cleanup = addEvts(listboxEl, {
      keydown(e) {
        function keyModifier() {
          e.preventDefault()
          e.stopPropagation()
        }
        const isVertical = listboxEl.ariaOrientation == 'vertical'
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

          case isVertical ? 'ArrowDown' : 'ArrowRight':
            keyModifier()
            return nextItem()

          case isVertical ? 'ArrowUp' : 'ArrowLeft':
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
        listboxId.set(null)
      },
    }

    /** Search by str, clears timeout but doesn't set it on invoke.
     * @param {number} timeout - if not set, won't clear timeout. Resets timeout if invoked again before clear
     */
    function search(char = '', timeout = null) {
      clearTimeout(cancelClearSearch)
      searchQuery += char.toLowerCase()
      const matchedEl = Array.prototype.find.call(listboxEl.querySelectorAll('[role=option]:not([disabled])'), (el) =>
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

    // ==== Helpers attached to the listboxEl
    /** resets currently selected option, or sets it to the el passed in */
    function reset(curEl = null) {
      selected.set(curEl)
      return (itemsWalker.currentNode = curEl || listboxEl)
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
