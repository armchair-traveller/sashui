// WAI-ARIA: https://www.w3.org/TR/wai-aria-practices-1.2/#dialog_modal
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { match } from '../../utils/match'
import { forwardRefWithAs, render, Features } from '../../utils/render'
import { useSyncRefs } from '../../hooks/use-sync-refs'
import { Keys } from '../keyboard'
import { isDisabledReactIssue7711 } from '../../utils/bugs'
import { useId } from '../../hooks/use-id'
import { useFocusTrap, Features as FocusTrapFeatures } from '../../hooks/use-focus-trap'
import { useInertOthers } from '../../hooks/use-inert-others'
import { Portal } from '../../components/portal/portal'
import { ForcePortalRoot } from '../../internal/portal-force-root'
import { Description, useDescriptions } from '../description/description'
import { useWindowEvent } from '../../hooks/use-window-event'
import { useOpenClosed, State } from '../../internal/open-closed'
import { StackProvider, StackMessage } from '../../internal/stack-context'
var DialogStates
;(function (DialogStates) {
  DialogStates[(DialogStates['Open'] = 0)] = 'Open'
  DialogStates[(DialogStates['Closed'] = 1)] = 'Closed'
})(DialogStates || (DialogStates = {}))
var ActionTypes
;(function (ActionTypes) {
  ActionTypes[(ActionTypes['SetTitleId'] = 0)] = 'SetTitleId'
})(ActionTypes || (ActionTypes = {}))
let reducers = {
  [ActionTypes.SetTitleId](state, action) {
    if (state.titleId === action.id) return state
    return Object.assign(Object.assign({}, state), { titleId: action.id })
  },
}
let DialogContext = createContext(null)
DialogContext.displayName = 'DialogContext'
function useDialogContext(component) {
  let context = useContext(DialogContext)
  if (context === null) {
    let err = new Error(`<${component} /> is missing a parent <${Dialog.displayName} /> component.`)
    if (Error.captureStackTrace) Error.captureStackTrace(err, useDialogContext)
    throw err
  }
  return context
}
function stateReducer(state, action) {
  return match(action.type, reducers, state, action)
}
// ---
let DEFAULT_DIALOG_TAG = 'div'
let DialogRenderFeatures = Features.RenderStrategy | Features.Static
let DialogRoot = forwardRefWithAs(function Dialog(props, ref) {
  let { open, onClose, initialFocus } = props,
    rest = __rest(props, ['open', 'onClose', 'initialFocus'])
  let [nestedDialogCount, setNestedDialogCount] = useState(0)
  let usesOpenClosedState = useOpenClosed()
  if (open === undefined && usesOpenClosedState !== null) {
    // Update the `open` prop based on the open closed state
    open = match(usesOpenClosedState, {
      [State.Open]: true,
      [State.Closed]: false,
    })
  }
  let containers = useRef(new Set())
  let internalDialogRef = useRef(null)
  let dialogRef = useSyncRefs(internalDialogRef, ref)

  let [state, dispatch] = useReducer(stateReducer, {
    titleId: null,
    descriptionId: null,
  })
  function close() {}
  let setTitleId = useCallback((id) => dispatch({ type: ActionTypes.SetTitleId, id }), [dispatch])

  let hasNestedDialogs = nestedDialogCount > 1 // 1 is the current dialog
  let hasParentDialog = useContext(DialogContext) !== null
  // If there are multiple dialogs, then you can be the root, the leaf or one
  // in between. We only care abou whether you are the top most one or not.
  let position = !hasNestedDialogs ? 'leaf' : 'parent'
  useFocusTrap(
    internalDialogRef,
    enabled
      ? match(position, {
          parent: FocusTrapFeatures.RestoreFocus,
          leaf: FocusTrapFeatures.All,
        })
      : FocusTrapFeatures.None,
    { initialFocus, containers }
  )
  useInertOthers(internalDialogRef, hasNestedDialogs ? enabled : false)
  // Handle outside click
  useWindowEvent('mousedown', (event) => {
    var _a
    let target = event.target
    if (dialogState !== DialogStates.Open) return
    if (hasNestedDialogs) return
    if ((_a = internalDialogRef.current) === null || _a === void 0 ? void 0 : _a.contains(target)) return
    close()
  })
  // Handle `Escape` to close
  useWindowEvent('keydown', (event) => {
    if (event.key !== Keys.Escape) return
    if (dialogState !== DialogStates.Open) return
    if (hasNestedDialogs) return
    event.preventDefault()
    event.stopPropagation()
    close()
  })
  // Scroll lock
  useEffect(() => {
    if (dialogState !== DialogStates.Open) return
    if (hasParentDialog) return
    let overflow = document.documentElement.style.overflow
    let paddingRight = document.documentElement.style.paddingRight
    let scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.documentElement.style.overflow = overflow
      document.documentElement.style.paddingRight = paddingRight
    }
  }, [dialogState, hasParentDialog])
  // Trigger close when the FocusTrap gets hidden
  useEffect(() => {
    if (dialogState !== DialogStates.Open) return
    if (!internalDialogRef.current) return
    let observer = new IntersectionObserver((entries) => {
      for (let entry of entries) {
        if (
          entry.boundingClientRect.x === 0 &&
          entry.boundingClientRect.y === 0 &&
          entry.boundingClientRect.width === 0 &&
          entry.boundingClientRect.height === 0
        ) {
          close()
        }
      }
    })
    observer.observe(internalDialogRef.current)
    return () => observer.disconnect()
  }, [dialogState, internalDialogRef, close])
  let [describedby, DescriptionProvider] = useDescriptions()
  let id = `headlessui-dialog-${useId()}`
  let contextBag = useMemo(() => [{ dialogState, close, setTitleId }, state], [dialogState, state, close, setTitleId])
  let slot = useMemo(() => ({ open: dialogState === DialogStates.Open }), [dialogState])
  let propsWeControl = {
    ref: dialogRef,
    id,
    role: 'dialog',
    'aria-modal': dialogState === DialogStates.Open ? true : undefined,
    'aria-labelledby': state.titleId,
    'aria-describedby': describedby,
    onClick(event) {
      event.stopPropagation()
    },
  }
  let passthroughProps = rest
  return React.createElement(
    StackProvider,
    {
      type: 'Dialog',
      element: internalDialogRef,
      onUpdate: useCallback((message, type, element) => {
        if (type !== 'Dialog') return
        match(message, {
          [StackMessage.Add]() {
            containers.current.add(element)
            setNestedDialogCount((count) => count + 1)
          },
          [StackMessage.Remove]() {
            containers.current.add(element)
            setNestedDialogCount((count) => count - 1)
          },
        })
      }, []),
    },
    React.createElement(
      ForcePortalRoot,
      { force: true },
      React.createElement(
        Portal,
        null,
        React.createElement(
          DialogContext.Provider,
          { value: contextBag },
          React.createElement(
            Portal.Group,
            { target: internalDialogRef },
            React.createElement(
              ForcePortalRoot,
              { force: false },
              React.createElement(
                DescriptionProvider,
                { slot: slot, name: 'Dialog.Description' },
                render({
                  props: Object.assign(Object.assign({}, passthroughProps), propsWeControl),
                  slot,
                  defaultTag: DEFAULT_DIALOG_TAG,
                  features: DialogRenderFeatures,
                  visible,
                  name: 'Dialog',
                })
              )
            )
          )
        )
      )
    )
  )
})
// ---
let DEFAULT_OVERLAY_TAG = 'div'
let Overlay = forwardRefWithAs(function Overlay(props, ref) {
  let [{ dialogState, close }] = useDialogContext([Dialog.displayName, Overlay.name].join('.'))
  let overlayRef = useSyncRefs(ref)
  let id = `headlessui-dialog-overlay-${useId()}`
  let handleClick = useCallback(
    (event) => {
      if (isDisabledReactIssue7711(event.currentTarget)) return event.preventDefault()
      event.preventDefault()
      event.stopPropagation()
      close()
    },
    [close]
  )
  let slot = useMemo(() => ({ open: dialogState === DialogStates.Open }), [dialogState])
  let propsWeControl = {
    ref: overlayRef,
    id,
    'aria-hidden': true,
    onClick: handleClick,
  }
  let passthroughProps = props
  return render({
    props: Object.assign(Object.assign({}, passthroughProps), propsWeControl),
    slot,
    defaultTag: DEFAULT_OVERLAY_TAG,
    name: 'Dialog.Overlay',
  })
})
// ---
let DEFAULT_TITLE_TAG = 'h2'
function Title(props) {
  let [{ dialogState, setTitleId }] = useDialogContext([Dialog.displayName, Title.name].join('.'))
  let id = `headlessui-dialog-title-${useId()}`
  useEffect(() => {
    setTitleId(id)
    return () => setTitleId(null)
  }, [id, setTitleId])
  let slot = useMemo(() => ({ open: dialogState === DialogStates.Open }), [dialogState])
  let propsWeControl = { id }
  let passthroughProps = props
  return render({
    props: Object.assign(Object.assign({}, passthroughProps), propsWeControl),
    slot,
    defaultTag: DEFAULT_TITLE_TAG,
    name: 'Dialog.Title',
  })
}
// ---
export let Dialog = Object.assign(DialogRoot, { Overlay, Title, Description })
