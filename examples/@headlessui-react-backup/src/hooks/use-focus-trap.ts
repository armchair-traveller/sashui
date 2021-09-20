import {
  useRef,
  // Types
  MutableRefObject,
  useEffect,
} from 'react'

import { Keys } from '../components/keyboard'
import { focusElement, focusIn, Focus, FocusResult } from '../utils/focus-management'
import { useWindowEvent } from './use-window-event'
import { useIsMounted } from './use-is-mounted'

export enum Features {
  /** No features enabled for the `useFocusTrap` hook. */
  None = 1 << 0,

  /** Ensure that we move focus initially into the container. */
  InitialFocus = 1 << 1,

  /** Ensure that pressing `Tab` and `Shift+Tab` is trapped within the container. */
  TabLock = 1 << 2,

  /** Ensure that programmatically moving focus outside of the container is disallowed. */
  FocusLock = 1 << 3,

  /** Ensure that we restore the focus when unmounting the component that uses this `useFocusTrap` hook. */
  RestoreFocus = 1 << 4,

  /** Enable all features. */
  All = InitialFocus | TabLock | FocusLock | RestoreFocus,
}

export function useFocusTrap(
  container: MutableRefObject<HTMLElement | null>,
  features: Features = Features.All,
  {
    initialFocus,
    containers,
  }: {
    initialFocus?: MutableRefObject<HTMLElement | null>
    containers?: MutableRefObject<Set<MutableRefObject<HTMLElement | null>>>
  } = {}
) {
  let restoreElement = useRef<HTMLElement | null>(
    typeof window !== 'undefined' ? (document.activeElement as HTMLElement) : null
  )
  let previousActiveElement = useRef<HTMLElement | null>(null)
  let mounted = useIsMounted()

  let featuresRestoreFocus = Boolean(features & Features.RestoreFocus)
  let featuresInitialFocus = Boolean(features & Features.InitialFocus)

  // Capture the currently focused element, before we enable the focus trap.
  useEffect(() => {
    if (!featuresRestoreFocus) return

    restoreElement.current = document.activeElement as HTMLElement
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

    let activeElement = document.activeElement as HTMLElement

    if (initialFocus?.current) {
      if (initialFocus?.current === activeElement) {
        previousActiveElement.current = activeElement
        return // Initial focus ref is already the active element
      }
    } else if (container.current.contains(activeElement)) {
      previousActiveElement.current = activeElement
      return // Already focused within Dialog
    }

    // Try to focus the initialFocus ref
    if (initialFocus?.current) {
      focusElement(initialFocus.current)
    } else {
      if (focusIn(container.current, Focus.First) === FocusResult.Error) {
        console.warn('There are no focusable elements inside the <FocusTrap />')
      }
    }

    previousActiveElement.current = document.activeElement as HTMLElement
  }, [container, initialFocus, featuresInitialFocus])

  // Handle `Tab` & `Shift+Tab` keyboard events
  useWindowEvent('keydown', event => {
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
      previousActiveElement.current = document.activeElement as HTMLElement
    }
  })

  // Prevent programmatically escaping the container
  useWindowEvent(
    'focus',
    event => {
      if (!(features & Features.FocusLock)) return

      let allContainers = new Set(containers?.current)
      allContainers.add(container)

      if (!allContainers.size) return

      let previous = previousActiveElement.current
      if (!previous) return
      if (!mounted.current) return

      let toElement = event.target as HTMLElement | null

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

function contains(containers: Set<MutableRefObject<HTMLElement | null>>, element: HTMLElement) {
  for (let container of containers) {
    if (container.current?.contains(element)) return true
  }

  return false
}
