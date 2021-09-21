import { useRef, useEffect } from 'react'
import { Keys } from '../components/keyboard'
import {
  focusElement,
  focusIn,
  Focus,
  FocusResult,
} from '../utils/focus-management'
import { useWindowEvent } from './use-window-event'
import { useIsMounted } from './use-is-mounted'

export var Features
;(function (Features) {
  /** No features enabled for the `useFocusTrap` hook. */
  Features[(Features['None'] = 1)] = 'None'
  /** Ensure that we move focus initially into the container. */
  Features[(Features['InitialFocus'] = 2)] = 'InitialFocus'
  /** Ensure that pressing `Tab` and `Shift+Tab` is trapped within the container. */
  Features[(Features['TabLock'] = 4)] = 'TabLock'
  /** Ensure that programmatically moving focus outside of the container is disallowed. */
  Features[(Features['FocusLock'] = 8)] = 'FocusLock'
  /** Ensure that we restore the focus when unmounting the component that uses this `useFocusTrap` hook. */
  Features[(Features['RestoreFocus'] = 16)] = 'RestoreFocus'
  /** Enable all features. */
  Features[(Features['All'] = 30)] = 'All'
})(Features || (Features = {}))

export function useFocusTrap(
  container,
  features = Features.All,
  { initialFocus, containers } = {}
) {
  let restoreElement = useRef(
    typeof window !== 'undefined' ? document.activeElement : null
  )
  let previousActiveElement = useRef(null)
  let mounted = useIsMounted()
  let featuresRestoreFocus = Boolean(features & Features.RestoreFocus)
  let featuresInitialFocus = Boolean(features & Features.InitialFocus)
  // Capture the currently focused element, before we enable the focus trap.
  useEffect(() => {
    if (!featuresRestoreFocus) return
    restoreElement.current = document.activeElement
  }, [featuresRestoreFocus])
  // Restore the focus when we unmount the component.
  useEffect(() => {
    if (!featuresRestoreFocus) return
    return () => {
      focusElement(restoreElement.current)
      restoreElement.current = null
    }
  }, [featuresRestoreFocus])
  // Handle initial focus
  useEffect(() => {
    if (!featuresInitialFocus) return
    if (!container.current) return
    let activeElement = document.activeElement
    if (
      initialFocus === null || initialFocus === void 0
        ? void 0
        : initialFocus.current
    ) {
      if (
        (initialFocus === null || initialFocus === void 0
          ? void 0
          : initialFocus.current) === activeElement
      ) {
        previousActiveElement.current = activeElement
        return // Initial focus ref is already the active element
      }
    } else if (container.current.contains(activeElement)) {
      previousActiveElement.current = activeElement
      return // Already focused within Dialog
    }
    // Try to focus the initialFocus ref
    if (
      initialFocus === null || initialFocus === void 0
        ? void 0
        : initialFocus.current
    ) {
      focusElement(initialFocus.current)
    } else {
      if (focusIn(container.current, Focus.First) === FocusResult.Error) {
        console.warn('There are no focusable elements inside the <FocusTrap />')
      }
    }
    previousActiveElement.current = document.activeElement
  }, [container, initialFocus, featuresInitialFocus])
  // Handle `Tab` & `Shift+Tab` keyboard events
  useWindowEvent('keydown', (event) => {
    if (!(features & Features.TabLock)) return
    if (!container.current) return
    if (event.key !== Keys.Tab) return
    event.preventDefault()
    if (
      focusIn(
        container.current,
        (event.shiftKey ? Focus.Previous : Focus.Next) | Focus.WrapAround
      ) === FocusResult.Success
    ) {
      previousActiveElement.current = document.activeElement
    }
  })
  // Prevent programmatically escaping the container
  useWindowEvent(
    'focus',
    (event) => {
      if (!(features & Features.FocusLock)) return
      let allContainers = new Set(
        containers === null || containers === void 0
          ? void 0
          : containers.current
      )
      allContainers.add(container)
      if (!allContainers.size) return
      let previous = previousActiveElement.current
      if (!previous) return
      if (!mounted.current) return
      let toElement = event.target
      if (toElement && toElement instanceof HTMLElement) {
        if (!contains(allContainers, toElement)) {
          event.preventDefault()
          event.stopPropagation()
          focusElement(previous)
        } else {
          previousActiveElement.current = toElement
          focusElement(toElement)
        }
      } else {
        focusElement(previousActiveElement.current)
      }
    },
    true
  )
}
function contains(containers, element) {
  var _a
  for (let container of containers) {
    if (
      (_a = container.current) === null || _a === void 0
        ? void 0
        : _a.contains(element)
    )
      return true
  }
  return false
}
