// WAI-ARIA: https://www.w3.org/TR/wai-aria-practices-1.2/#dialog_modal
// We use tree walkers and selector matching, however we will NOT implement any sort of nesting due to it being
// an antipattern, unless convinced otherwise.
// There is no internal open state. Whether to show or hide is handled by the consumer. If it renders, we assume it's open.
import { addEvts } from '$lib/utils/action'
import { elWalker } from '$lib/utils/elWalker'
import { createId } from '$lib/stores/createId'
import { writable } from 'svelte/store'
import { inertOthers } from './inertOthers'

const focusable =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable], audio[controls], video[controls], summary, [tabindex^="0"], [tabindex^="1"], [tabindex^="2"], [tabindex^="3"], [tabindex^="4"], [tabindex^="5"], [tabindex^="6"], [tabindex^="7"], [tabindex^="8"], [tabindex^="9"]'
/** Creates a new dialog instance.
 * * `aria-describedby` not implemented. To the consumer it's literally one attribute, and thus' not worth an action for.
 * * DO NOT NEST DIALOGS. Keep only one open at any particular moment. It's an antipattern to have more and this library intentionally doesn't support it.
 * If you need to display a different dialog either close the current one then open it, or change the contents of the currently opened dialog.
 * e.g. You should use alternative patterns like breadcrumbs for tracking progression or tabs to have different views.
 *
 * You should have at least one focusable element present in any dialogs you use for accessibility purposes. */
export function useDialog(initOpen = false) {
  let dialogEl,
    titleId = createId()
  const close = (detail) => dialogEl.dispatchEvent(new CustomEvent('close', { detail }))

  return Object.assign(dialog, {
    ...writable(initOpen),
    overlay(el) {
      el.setAttribute('aria-hidden', true)
      return {
        destroy: addEvts(el, {
          click(e) {
            e.preventDefault()
            if (el.getAttribute('disabled')) return
            e.stopPropagation()
            close('overlay')
          },
        }),
      }
    },
    title(el) {
      titleId.set(el, 'dialog-title')
      return {
        destroy() {
          titleId.set()
        },
      }
    },
  })

  /** @type {import('svelte/action').Action<HTMLElement, HTMLElement | null>} */
  function dialog(el, initialFocus = null) {
    dialogEl = el
    // move the dialog to the body via a portal
    document.body.append(dialogEl)
    const restoreEl = document.activeElement,
      titleUnsub = titleId(dialogEl, 'aria-labelledby'),
      inertCleanup = inertOthers(dialogEl)
    dialogEl.setAttribute('role', 'dialog')
    dialogEl.ariaModal = true

    // focusWalker walks through focusables in the dialog
    const focusWalker = elWalker(dialogEl, (el) => el.matches(focusable))

    /** keeps focus order in sync e.g. user clicks a random focusable then uses keyboard navigation */
    function setCurrent() {
      const focused = document.activeElement
      if (focused != focusWalker.currentNode)
        focusWalker.currentNode = dialogEl.contains(focused) && focused.matches(focusable) ? focused : dialogEl // edge case: resetting when focus is somehow outside the dialog. initialFocus isn't a valid reset node and is less reliable, too.
    }

    function focusNext() {
      setCurrent()
      focusWalker.next()?.focus({ preventScroll: true })
    }

    if (initialFocus) (focusWalker.currentNode = initialFocus).focus({ preventScroll: true })
    else focusNext()

    const rmvWinEvts = addEvts(window, {
        mousedown(e) {
          // ? Do we really need this click outside if we normally handle that with an overlay anyway?
          if (dialogEl.contains(e.target)) return
          close('clickoutside')
        },
        keydown(e) {
          switch (e.key) {
            case 'Escape':
              e.preventDefault()
              e.stopPropagation()
              close('escape')
              break
            // Handle `Tab` & `Shift+Tab` keyboard events
            case 'Tab':
              e.preventDefault()
              if (e.shiftKey) {
                setCurrent()
                focusWalker.prev()?.focus({ preventScroll: true })
              } else focusNext()
              break
          }
        },
      }),
      rmvEvts = addEvts(dialogEl, {
        click(e) {
          e.stopPropagation()
        },
      })

    // Scroll lock
    let overflow = document.documentElement.style.overflow
    let paddingRight = document.documentElement.style.paddingRight
    let scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`

    return {
      destroy() {
        titleUnsub()
        restoreEl.focus({ preventScroll: true })
        inertCleanup()
        // reset scroll lock
        document.documentElement.style.overflow = overflow
        document.documentElement.style.paddingRight = paddingRight
        rmvEvts()
        rmvWinEvts()
      },
    }
  }
}
