import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,

  // Types
  ContextType,
  Dispatch,
  ElementType,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  Ref,
  MutableRefObject,
} from 'react'

import { Props } from '../../types'
import { match } from '../../utils/match'
import { forwardRefWithAs, render, Features, PropsForFeatures } from '../../utils/render'
import { useSyncRefs } from '../../hooks/use-sync-refs'
import { useId } from '../../hooks/use-id'
import { Keys } from '../keyboard'
import { isDisabledReactIssue7711 } from '../../utils/bugs'
import {
  getFocusableElements,
  Focus,
  focusIn,
  FocusResult,
  isFocusableElement,
  FocusableMode,
} from '../../utils/focus-management'
import { useWindowEvent } from '../../hooks/use-window-event'
import { OpenClosedProvider, State, useOpenClosed } from '../../internal/open-closed'
import { useResolveButtonType } from '../../hooks/use-resolve-button-type'

enum PopoverStates {
  Open,
  Closed,
}

interface StateDefinition {
  popoverState: PopoverStates

  button: HTMLElement | null
  buttonId: string
  panel: HTMLElement | null
  panelId: string
}

enum ActionTypes {
  TogglePopover,
  ClosePopover,

  SetButton,
  SetButtonId,
  SetPanel,
  SetPanelId,
}

type Actions =
  | { type: ActionTypes.TogglePopover }
  | { type: ActionTypes.ClosePopover }
  | { type: ActionTypes.SetButton; button: HTMLElement | null }
  | { type: ActionTypes.SetButtonId; buttonId: string }
  | { type: ActionTypes.SetPanel; panel: HTMLElement | null }
  | { type: ActionTypes.SetPanelId; panelId: string }

let reducers: {
  [P in ActionTypes]: (
    state: StateDefinition,
    action: Extract<Actions, { type: P }>
  ) => StateDefinition
} = {
  [ActionTypes.TogglePopover]: state => ({
    ...state,
    popoverState: match(state.popoverState, {
      [PopoverStates.Open]: PopoverStates.Closed,
      [PopoverStates.Closed]: PopoverStates.Open,
    }),
  }),
  [ActionTypes.ClosePopover](state) {
    if (state.popoverState === PopoverStates.Closed) return state
    return { ...state, popoverState: PopoverStates.Closed }
  },
  [ActionTypes.SetButton](state, action) {
    if (state.button === action.button) return state
    return { ...state, button: action.button }
  },
  [ActionTypes.SetButtonId](state, action) {
    if (state.buttonId === action.buttonId) return state
    return { ...state, buttonId: action.buttonId }
  },
  [ActionTypes.SetPanel](state, action) {
    if (state.panel === action.panel) return state
    return { ...state, panel: action.panel }
  },
  [ActionTypes.SetPanelId](state, action) {
    if (state.panelId === action.panelId) return state
    return { ...state, panelId: action.panelId }
  },
}

let PopoverContext = createContext<[StateDefinition, Dispatch<Actions>] | null>(null)
PopoverContext.displayName = 'PopoverContext'

function usePopoverContext(component: string) {
  let context = useContext(PopoverContext)
  if (context === null) {
    let err = new Error(`<${component} /> is missing a parent <${Popover.name} /> component.`)
    if (Error.captureStackTrace) Error.captureStackTrace(err, usePopoverContext)
    throw err
  }
  return context
}

let PopoverAPIContext = createContext<{
  close(focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>): void
} | null>(null)
PopoverAPIContext.displayName = 'PopoverAPIContext'

function usePopoverAPIContext(component: string) {
  let context = useContext(PopoverAPIContext)
  if (context === null) {
    let err = new Error(`<${component} /> is missing a parent <${Popover.name} /> component.`)
    if (Error.captureStackTrace) Error.captureStackTrace(err, usePopoverAPIContext)
    throw err
  }
  return context
}

let PopoverGroupContext = createContext<{
  registerPopover(registerbag: PopoverRegisterBag): void
  unregisterPopover(registerbag: PopoverRegisterBag): void
  isFocusWithinPopoverGroup(): boolean
  closeOthers(buttonId: string): void
} | null>(null)
PopoverGroupContext.displayName = 'PopoverGroupContext'

function usePopoverGroupContext() {
  return useContext(PopoverGroupContext)
}

let PopoverPanelContext = createContext<string | null>(null)
PopoverPanelContext.displayName = 'PopoverPanelContext'

function usePopoverPanelContext() {
  return useContext(PopoverPanelContext)
}

interface PopoverRegisterBag {
  buttonId: string
  panelId: string
  close(): void
}
function stateReducer(state: StateDefinition, action: Actions) {
  return match(action.type, reducers, state, action)
}

// ---

let DEFAULT_POPOVER_TAG = 'div' as const
interface PopoverRenderPropArg {
  open: boolean
  close(focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>): void
}

export function Popover<TTag extends ElementType = typeof DEFAULT_POPOVER_TAG>(
  props: Props<TTag, PopoverRenderPropArg>
) {
  let buttonId = `headlessui-popover-button-${useId()}`
  let panelId = `headlessui-popover-panel-${useId()}`

  let reducerBag = useReducer(stateReducer, {
    popoverState: PopoverStates.Closed,
    button: null,
    buttonId,
    panel: null,
    panelId,
  } as StateDefinition)
  let [{ popoverState, button, panel }, dispatch] = reducerBag

  useEffect(() => dispatch({ type: ActionTypes.SetButtonId, buttonId }), [buttonId, dispatch])
  useEffect(() => dispatch({ type: ActionTypes.SetPanelId, panelId }), [panelId, dispatch])

  let registerBag = useMemo(
    () => ({ buttonId, panelId, close: () => dispatch({ type: ActionTypes.ClosePopover }) }),
    [buttonId, panelId, dispatch]
  )

  let groupContext = usePopoverGroupContext()
  let registerPopover = groupContext?.registerPopover
  let isFocusWithinPopoverGroup = useCallback(() => {
    return (
      groupContext?.isFocusWithinPopoverGroup() ??
      (button?.contains(document.activeElement) || panel?.contains(document.activeElement))
    )
  }, [groupContext, button, panel])

  useEffect(() => registerPopover?.(registerBag), [registerPopover, registerBag])

  // Handle focus out
  useWindowEvent(
    'focus',
    () => {
      if (popoverState !== PopoverStates.Open) return
      if (isFocusWithinPopoverGroup()) return
      if (!button) return
      if (!panel) return

      dispatch({ type: ActionTypes.ClosePopover })
    },
    true
  )

  // Handle outside click
  useWindowEvent('mousedown', event => {
    let target = event.target as HTMLElement

    if (popoverState !== PopoverStates.Open) return

    if (button?.contains(target)) return
    if (panel?.contains(target)) return

    dispatch({ type: ActionTypes.ClosePopover })

    if (!isFocusableElement(target, FocusableMode.Loose)) {
      event.preventDefault()
      button?.focus()
    }
  })

  let close = useCallback(
    (focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>) => {
      dispatch({ type: ActionTypes.ClosePopover })

      let restoreElement = (() => {
        if (!focusableElement) return button
        if (focusableElement instanceof HTMLElement) return focusableElement
        if (focusableElement.current instanceof HTMLElement) return focusableElement.current

        return button
      })()

      restoreElement?.focus()
    },
    [dispatch, button]
  )

  let api = useMemo<ContextType<typeof PopoverAPIContext>>(() => ({ close }), [close])

  let slot = useMemo<PopoverRenderPropArg>(
    () => ({ open: popoverState === PopoverStates.Open, close }),
    [popoverState, close]
  )

  return (
    <PopoverContext.Provider value={reducerBag}>
      <PopoverAPIContext.Provider value={api}>
        <OpenClosedProvider
          value={match(popoverState, {
            [PopoverStates.Open]: State.Open,
            [PopoverStates.Closed]: State.Closed,
          })}
        >
          {render({
            props,
            slot,
            defaultTag: DEFAULT_POPOVER_TAG,
            name: 'Popover',
          })}
        </OpenClosedProvider>
      </PopoverAPIContext.Provider>
    </PopoverContext.Provider>
  )
}

// ---

let DEFAULT_BUTTON_TAG = 'button' as const
interface ButtonRenderPropArg {
  open: boolean
}
type ButtonPropsWeControl =
  | 'id'
  | 'type'
  | 'aria-expanded'
  | 'aria-controls'
  | 'onKeyDown'
  | 'onClick'

let Button = forwardRefWithAs(function Button<TTag extends ElementType = typeof DEFAULT_BUTTON_TAG>(
  props: Props<TTag, ButtonRenderPropArg, ButtonPropsWeControl>,
  ref: Ref<HTMLButtonElement>
) {
  let [state, dispatch] = usePopoverContext([Popover.name, Button.name].join('.'))
  let internalButtonRef = useRef<HTMLButtonElement | null>(null)

  let groupContext = usePopoverGroupContext()
  let closeOthers = groupContext?.closeOthers

  let panelContext = usePopoverPanelContext()
  let isWithinPanel = panelContext === null ? false : panelContext === state.panelId

  let buttonRef = useSyncRefs(
    internalButtonRef,
    ref,
    isWithinPanel ? null : button => dispatch({ type: ActionTypes.SetButton, button })
  )
  let withinPanelButtonRef = useSyncRefs(internalButtonRef, ref)

  // TODO: Revisit when handling Tab/Shift+Tab when using Portal's
  let activeElementRef = useRef<Element | null>(null)
  let previousActiveElementRef = useRef<Element | null>(
    typeof window === 'undefined' ? null : document.activeElement
  )
  useWindowEvent(
    'focus',
    () => {
      previousActiveElementRef.current = activeElementRef.current
      activeElementRef.current = document.activeElement
    },
    true
  )

  let handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (isWithinPanel) {
        if (state.popoverState === PopoverStates.Closed) return
        switch (event.key) {
          case Keys.Space:
          case Keys.Enter:
            event.preventDefault() // Prevent triggering a *click* event
            event.stopPropagation()
            dispatch({ type: ActionTypes.ClosePopover })
            state.button?.focus() // Re-focus the original opening Button
            break
        }
      } else {
        switch (event.key) {
          case Keys.Space:
          case Keys.Enter:
            event.preventDefault() // Prevent triggering a *click* event
            event.stopPropagation()
            if (state.popoverState === PopoverStates.Closed) closeOthers?.(state.buttonId)
            dispatch({ type: ActionTypes.TogglePopover })
            break

          case Keys.Escape:
            if (state.popoverState !== PopoverStates.Open) return closeOthers?.(state.buttonId)
            if (!internalButtonRef.current) return
            if (!internalButtonRef.current.contains(document.activeElement)) return
            dispatch({ type: ActionTypes.ClosePopover })
            break

          case Keys.Tab:
            if (state.popoverState !== PopoverStates.Open) return
            if (!state.panel) return
            if (!state.button) return

            // TODO: Revisit when handling Tab/Shift+Tab when using Portal's
            if (event.shiftKey) {
              // Check if the last focused element exists, and check that it is not inside button or panel itself
              if (!previousActiveElementRef.current) return
              if (state.button?.contains(previousActiveElementRef.current)) return
              if (state.panel.contains(previousActiveElementRef.current)) return

              // Check if the last focused element is *after* the button in the DOM
              let focusableElements = getFocusableElements()
              let previousIdx = focusableElements.indexOf(
                previousActiveElementRef.current as HTMLElement
              )
              let buttonIdx = focusableElements.indexOf(state.button)
              if (buttonIdx > previousIdx) return

              event.preventDefault()
              event.stopPropagation()

              focusIn(state.panel, Focus.Last)
            } else {
              event.preventDefault()
              event.stopPropagation()

              focusIn(state.panel, Focus.First)
            }

            break
        }
      }
    },
    [
      dispatch,
      state.popoverState,
      state.buttonId,
      state.button,
      state.panel,
      internalButtonRef,
      closeOthers,
      isWithinPanel,
    ]
  )

  let handleKeyUp = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      if (isWithinPanel) return
      if (event.key === Keys.Space) {
        // Required for firefox, event.preventDefault() in handleKeyDown for
        // the Space key doesn't cancel the handleKeyUp, which in turn
        // triggers a *click*.
        event.preventDefault()
      }
      if (state.popoverState !== PopoverStates.Open) return
      if (!state.panel) return
      if (!state.button) return

      // TODO: Revisit when handling Tab/Shift+Tab when using Portal's
      switch (event.key) {
        case Keys.Tab:
          // Check if the last focused element exists, and check that it is not inside button or panel itself
          if (!previousActiveElementRef.current) return
          if (state.button?.contains(previousActiveElementRef.current)) return
          if (state.panel.contains(previousActiveElementRef.current)) return

          // Check if the last focused element is *after* the button in the DOM
          let focusableElements = getFocusableElements()
          let previousIdx = focusableElements.indexOf(
            previousActiveElementRef.current as HTMLElement
          )
          let buttonIdx = focusableElements.indexOf(state.button)
          if (buttonIdx > previousIdx) return

          event.preventDefault()
          event.stopPropagation()
          focusIn(state.panel, Focus.Last)
          break
      }
    },
    [state.popoverState, state.panel, state.button, isWithinPanel]
  )

  let handleClick = useCallback(
    (event: ReactMouseEvent) => {
      if (isDisabledReactIssue7711(event.currentTarget)) return
      if (props.disabled) return
      if (isWithinPanel) {
        dispatch({ type: ActionTypes.ClosePopover })
        state.button?.focus() // Re-focus the original opening Button
      } else {
        if (state.popoverState === PopoverStates.Closed) closeOthers?.(state.buttonId)
        state.button?.focus()
        dispatch({ type: ActionTypes.TogglePopover })
      }
    },
    [
      dispatch,
      state.button,
      state.popoverState,
      state.buttonId,
      props.disabled,
      closeOthers,
      isWithinPanel,
    ]
  )

  let slot = useMemo<ButtonRenderPropArg>(
    () => ({ open: state.popoverState === PopoverStates.Open }),
    [state]
  )

  let type = useResolveButtonType(props, internalButtonRef)
  let passthroughProps = props
  let propsWeControl = isWithinPanel
    ? {
        ref: withinPanelButtonRef,
        type,
        onKeyDown: handleKeyDown,
        onClick: handleClick,
      }
    : {
        ref: buttonRef,
        id: state.buttonId,
        type,
        'aria-expanded': props.disabled ? undefined : state.popoverState === PopoverStates.Open,
        'aria-controls': state.panel ? state.panelId : undefined,
        onKeyDown: handleKeyDown,
        onKeyUp: handleKeyUp,
        onClick: handleClick,
      }

  return render({
    props: { ...passthroughProps, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_BUTTON_TAG,
    name: 'Popover.Button',
  })
})

// ---

let DEFAULT_OVERLAY_TAG = 'div' as const
interface OverlayRenderPropArg {
  open: boolean
}
type OverlayPropsWeControl = 'id' | 'aria-hidden' | 'onClick'

let OverlayRenderFeatures = Features.RenderStrategy | Features.Static

let Overlay = forwardRefWithAs(function Overlay<
  TTag extends ElementType = typeof DEFAULT_OVERLAY_TAG
>(
  props: Props<TTag, OverlayRenderPropArg, OverlayPropsWeControl> &
    PropsForFeatures<typeof OverlayRenderFeatures>,
  ref: Ref<HTMLDivElement>
) {
  let [{ popoverState }, dispatch] = usePopoverContext([Popover.name, Overlay.name].join('.'))
  let overlayRef = useSyncRefs(ref)

  let id = `headlessui-popover-overlay-${useId()}`

  let usesOpenClosedState = useOpenClosed()
  let visible = (() => {
    if (usesOpenClosedState !== null) {
      return usesOpenClosedState === State.Open
    }

    return popoverState === PopoverStates.Open
  })()

  let handleClick = useCallback(
    (event: ReactMouseEvent) => {
      if (isDisabledReactIssue7711(event.currentTarget)) return event.preventDefault()
      dispatch({ type: ActionTypes.ClosePopover })
    },
    [dispatch]
  )

  let slot = useMemo<OverlayRenderPropArg>(() => ({ open: popoverState === PopoverStates.Open }), [
    popoverState,
  ])
  let propsWeControl = {
    ref: overlayRef,
    id,
    'aria-hidden': true,
    onClick: handleClick,
  }
  let passthroughProps = props

  return render({
    props: { ...passthroughProps, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_OVERLAY_TAG,
    features: OverlayRenderFeatures,
    visible,
    name: 'Popover.Overlay',
  })
})

// ---

let DEFAULT_PANEL_TAG = 'div' as const
interface PanelRenderPropArg {
  open: boolean
  close: (focusableElement?: HTMLElement | MutableRefObject<HTMLElement | null>) => void
}
type PanelPropsWeControl = 'id' | 'onKeyDown'

let PanelRenderFeatures = Features.RenderStrategy | Features.Static

let Panel = forwardRefWithAs(function Panel<TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(
  props: Props<TTag, PanelRenderPropArg, PanelPropsWeControl> &
    PropsForFeatures<typeof PanelRenderFeatures> & {
      focus?: boolean
    },
  ref: Ref<HTMLDivElement>
) {
  let { focus = false, ...passthroughProps } = props

  let [state, dispatch] = usePopoverContext([Popover.name, Panel.name].join('.'))
  let { close } = usePopoverAPIContext([Popover.name, Panel.name].join('.'))

  let internalPanelRef = useRef<HTMLDivElement | null>(null)
  let panelRef = useSyncRefs(internalPanelRef, ref, panel => {
    dispatch({ type: ActionTypes.SetPanel, panel })
  })

  let usesOpenClosedState = useOpenClosed()
  let visible = (() => {
    if (usesOpenClosedState !== null) {
      return usesOpenClosedState === State.Open
    }

    return state.popoverState === PopoverStates.Open
  })()

  let handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case Keys.Escape:
          if (state.popoverState !== PopoverStates.Open) return
          if (!internalPanelRef.current) return
          if (!internalPanelRef.current.contains(document.activeElement)) return
          event.preventDefault()
          dispatch({ type: ActionTypes.ClosePopover })
          state.button?.focus()
          break
      }
    },
    [state, internalPanelRef, dispatch]
  )

  // Unlink on "unmount" myself
  useEffect(() => () => dispatch({ type: ActionTypes.SetPanel, panel: null }), [dispatch])

  // Unlink on "unmount" children
  useEffect(() => {
    if (state.popoverState === PopoverStates.Closed && (props.unmount ?? true)) {
      dispatch({ type: ActionTypes.SetPanel, panel: null })
    }
  }, [state.popoverState, props.unmount, dispatch])

  // Move focus within panel
  useEffect(() => {
    if (!focus) return
    if (state.popoverState !== PopoverStates.Open) return
    if (!internalPanelRef.current) return

    let activeElement = document.activeElement as HTMLElement
    if (internalPanelRef.current.contains(activeElement)) return // Already focused within Dialog

    focusIn(internalPanelRef.current, Focus.First)
  }, [focus, internalPanelRef, state.popoverState])

  // Handle Tab / Shift+Tab focus positioning
  useWindowEvent('keydown', event => {
    if (state.popoverState !== PopoverStates.Open) return
    if (!internalPanelRef.current) return
    if (event.key !== Keys.Tab) return
    if (!document.activeElement) return
    if (!internalPanelRef.current) return
    if (!internalPanelRef.current.contains(document.activeElement)) return

    // We will take-over the default tab behaviour so that we have a bit
    // control over what is focused next. It will behave exactly the same,
    // but it will also "fix" some issues based on whether you are using a
    // Portal or not.
    event.preventDefault()

    let result = focusIn(internalPanelRef.current, event.shiftKey ? Focus.Previous : Focus.Next)

    if (result === FocusResult.Underflow) {
      return state.button?.focus()
    } else if (result === FocusResult.Overflow) {
      if (!state.button) return

      let elements = getFocusableElements()
      let buttonIdx = elements.indexOf(state.button)

      let nextElements = elements
        .splice(buttonIdx + 1) // Elements after button
        .filter(element => !internalPanelRef.current?.contains(element)) // Ignore items in panel

      // Try to focus the next element, however it could fail if we are in a
      // Portal that happens to be the very last one in the DOM. In that
      // case we would Error (because nothing after the button is
      // focusable). Therefore we will try and focus the very first item in
      // the document.body.
      if (focusIn(nextElements, Focus.First) === FocusResult.Error) {
        focusIn(document.body, Focus.First)
      }
    }
  })

  // Handle focus out when we are in special "focus" mode
  useWindowEvent(
    'focus',
    () => {
      if (!focus) return
      if (state.popoverState !== PopoverStates.Open) return
      if (!internalPanelRef.current) return

      if (internalPanelRef.current?.contains(document.activeElement as HTMLElement)) return
      dispatch({ type: ActionTypes.ClosePopover })
    },
    true
  )

  let slot = useMemo<PanelRenderPropArg>(
    () => ({ open: state.popoverState === PopoverStates.Open, close }),
    [state, close]
  )
  let propsWeControl = {
    ref: panelRef,
    id: state.panelId,
    onKeyDown: handleKeyDown,
  }

  return (
    <PopoverPanelContext.Provider value={state.panelId}>
      {render({
        props: { ...passthroughProps, ...propsWeControl },
        slot,
        defaultTag: DEFAULT_PANEL_TAG,
        features: PanelRenderFeatures,
        visible,
        name: 'Popover.Panel',
      })}
    </PopoverPanelContext.Provider>
  )
})

// ---

let DEFAULT_GROUP_TAG = 'div' as const
interface GroupRenderPropArg {}
type GroupPropsWeControl = 'id'

function Group<TTag extends ElementType = typeof DEFAULT_PANEL_TAG>(
  props: Props<TTag, GroupRenderPropArg, GroupPropsWeControl>
) {
  let groupRef = useRef<HTMLElement | null>(null)
  let [popovers, setPopovers] = useState<PopoverRegisterBag[]>([])

  let unregisterPopover = useCallback(
    (registerbag: PopoverRegisterBag) => {
      setPopovers(existing => {
        let idx = existing.indexOf(registerbag)
        if (idx !== -1) {
          let clone = existing.slice()
          clone.splice(idx, 1)
          return clone
        }
        return existing
      })
    },
    [setPopovers]
  )

  let registerPopover = useCallback(
    (registerbag: PopoverRegisterBag) => {
      setPopovers(existing => [...existing, registerbag])
      return () => unregisterPopover(registerbag)
    },
    [setPopovers, unregisterPopover]
  )

  let isFocusWithinPopoverGroup = useCallback(() => {
    let element = document.activeElement as HTMLElement

    if (groupRef.current?.contains(element)) return true

    // Check if the focus is in one of the button or panel elements. This is important in case you are rendering inside a Portal.
    return popovers.some(bag => {
      return (
        document.getElementById(bag.buttonId)?.contains(element) ||
        document.getElementById(bag.panelId)?.contains(element)
      )
    })
  }, [groupRef, popovers])

  let closeOthers = useCallback(
    (buttonId: string) => {
      for (let popover of popovers) {
        if (popover.buttonId !== buttonId) popover.close()
      }
    },
    [popovers]
  )

  let contextBag = useMemo<ContextType<typeof PopoverGroupContext>>(
    () => ({
      registerPopover: registerPopover,
      unregisterPopover: unregisterPopover,
      isFocusWithinPopoverGroup,
      closeOthers,
    }),
    [registerPopover, unregisterPopover, isFocusWithinPopoverGroup, closeOthers]
  )

  let slot = useMemo<GroupRenderPropArg>(() => ({}), [])
  let propsWeControl = { ref: groupRef }
  let passthroughProps = props

  return (
    <PopoverGroupContext.Provider value={contextBag}>
      {render({
        props: { ...passthroughProps, ...propsWeControl },
        slot,
        defaultTag: DEFAULT_GROUP_TAG,
        name: 'Popover.Group',
      })}
    </PopoverGroupContext.Provider>
  )
}

// ---

Popover.Button = Button
Popover.Overlay = Overlay
Popover.Panel = Panel
Popover.Group = Group
