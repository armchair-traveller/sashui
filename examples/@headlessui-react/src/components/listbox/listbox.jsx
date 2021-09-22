import React, {
  Fragment,
  createContext,
  createRef,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { useDisposables } from '../../hooks/use-disposables'
import { useId } from '../../hooks/use-id'
import { useIsoMorphicEffect } from '../../hooks/use-iso-morphic-effect'
import { useComputed } from '../../hooks/use-computed'
import { useSyncRefs } from '../../hooks/use-sync-refs'
import { Features, forwardRefWithAs, render } from '../../utils/render'
import { match } from '../../utils/match'
import { disposables } from '../../utils/disposables'
import { Keys } from '../keyboard'
import { Focus, calculateActiveIndex } from '../../utils/calculate-active-index'
import { isDisabledReactIssue7711 } from '../../utils/bugs'
import { isFocusableElement, FocusableMode } from '../../utils/focus-management'
import { useWindowEvent } from '../../hooks/use-window-event'
import {
  useOpenClosed,
  State,
  OpenClosedProvider,
} from '../../internal/open-closed'
import { useResolveButtonType } from '../../hooks/use-resolve-button-type'
var ListboxStates
;(function (ListboxStates) {
  ListboxStates[(ListboxStates['Open'] = 0)] = 'Open'
  ListboxStates[(ListboxStates['Closed'] = 1)] = 'Closed'
})(ListboxStates || (ListboxStates = {}))
var ActionTypes
;(function (ActionTypes) {
  ActionTypes[(ActionTypes['OpenListbox'] = 0)] = 'OpenListbox'
  ActionTypes[(ActionTypes['CloseListbox'] = 1)] = 'CloseListbox'
  ActionTypes[(ActionTypes['SetDisabled'] = 2)] = 'SetDisabled'
  ActionTypes[(ActionTypes['SetOrientation'] = 3)] = 'SetOrientation'
  ActionTypes[(ActionTypes['GoToOption'] = 4)] = 'GoToOption'
  ActionTypes[(ActionTypes['Search'] = 5)] = 'Search'
  ActionTypes[(ActionTypes['ClearSearch'] = 6)] = 'ClearSearch'
  ActionTypes[(ActionTypes['RegisterOption'] = 7)] = 'RegisterOption'
  ActionTypes[(ActionTypes['UnregisterOption'] = 8)] = 'UnregisterOption'
})(ActionTypes || (ActionTypes = {}))
let reducers = {
  [ActionTypes.CloseListbox](state) {
    if (state.disabled) return state
    if (state.listboxState === ListboxStates.Closed) return state
    return {
      ...state,
      activeOptionIndex: null,
      listboxState: ListboxStates.Closed,
    }
  },
  [ActionTypes.OpenListbox](state) {
    if (state.disabled) return state
    if (state.listboxState === ListboxStates.Open) return state
    return { ...state, listboxState: ListboxStates.Open }
  },
  [ActionTypes.SetDisabled](state, action) {
    if (state.disabled === action.disabled) return state
    return { ...state, disabled: action.disabled }
  },
  [ActionTypes.SetOrientation](state, action) {
    if (state.orientation === action.orientation) return state
    return { ...state, orientation: action.orientation }
  },
  [ActionTypes.GoToOption](state, action) {
    if (state.disabled) return state
    if (state.listboxState === ListboxStates.Closed) return state
    let activeOptionIndex = calculateActiveIndex(action, {
      resolveItems: () => state.options,
      resolveActiveIndex: () => state.activeOptionIndex,
      resolveId: (item) => item.id,
      resolveDisabled: (item) => item.dataRef.current.disabled,
    })
    if (
      state.searchQuery === '' &&
      state.activeOptionIndex === activeOptionIndex
    )
      return state
    return { ...state, searchQuery: '', activeOptionIndex }
  },
  [ActionTypes.Search]: (state, action) => {
    if (state.disabled) return state
    if (state.listboxState === ListboxStates.Closed) return state
    let searchQuery = state.searchQuery + action.value.toLowerCase()
    let match = state.options.findIndex(
      (option) =>
        !option.dataRef.current.disabled &&
        option.dataRef.current.textValue?.startsWith(searchQuery)
    )
    if (match === -1 || match === state.activeOptionIndex)
      return { ...state, searchQuery }
    return { ...state, searchQuery, activeOptionIndex: match }
  },
  [ActionTypes.ClearSearch](state) {
    if (state.disabled) return state
    if (state.listboxState === ListboxStates.Closed) return state
    if (state.searchQuery === '') return state
    return { ...state, searchQuery: '' }
  },
  [ActionTypes.RegisterOption]: (state, action) => ({
    ...state,
    options: [...state.options, { id: action.id, dataRef: action.dataRef }],
  }),
  [ActionTypes.UnregisterOption]: (state, action) => {
    let nextOptions = state.options.slice()
    let currentActiveOption =
      state.activeOptionIndex !== null
        ? nextOptions[state.activeOptionIndex]
        : null
    let idx = nextOptions.findIndex((a) => a.id === action.id)
    if (idx !== -1) nextOptions.splice(idx, 1)
    return {
      ...state,
      options: nextOptions,
      activeOptionIndex: (() => {
        if (idx === state.activeOptionIndex) return null
        if (currentActiveOption === null) return null
        // If we removed the option before the actual active index, then it would be out of sync. To
        // fix this, we will find the correct (new) index position.
        return nextOptions.indexOf(currentActiveOption)
      })(),
    }
  },
}
let ListboxContext = createContext(null)
ListboxContext.displayName = 'ListboxContext'
function useListboxContext(component) {
  let context = useContext(ListboxContext)
  if (context === null) {
    let err = new Error(
      `<${component} /> is missing a parent <${Listbox.name} /> component.`
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useListboxContext)
    throw err
  }
  return context
}
function stateReducer(state, action) {
  return match(action.type, reducers, state, action)
}
// ---
let DEFAULT_LISTBOX_TAG = Fragment
export function Listbox(props) {
  let {
    value,
    onChange,
    disabled = false,
    horizontal = false,
    ...passThroughProps
  } = props
  const orientation = horizontal ? 'horizontal' : 'vertical'
  let reducerBag = useReducer(stateReducer, {
    listboxState: ListboxStates.Closed,
    propsRef: { current: { value, onChange } },
    labelRef: createRef(),
    buttonRef: createRef(),
    optionsRef: createRef(),
    disabled,
    orientation,
    options: [],
    searchQuery: '',
    activeOptionIndex: null,
  })
  let [{ listboxState, propsRef, optionsRef, buttonRef }, dispatch] = reducerBag
  useIsoMorphicEffect(() => {
    propsRef.current.value = value
  }, [value, propsRef])
  useIsoMorphicEffect(() => {
    propsRef.current.onChange = onChange
  }, [onChange, propsRef])
  useIsoMorphicEffect(
    () => dispatch({ type: ActionTypes.SetDisabled, disabled }),
    [disabled]
  )
  useIsoMorphicEffect(
    () => dispatch({ type: ActionTypes.SetOrientation, orientation }),
    [orientation]
  )
  // Handle outside click
  useWindowEvent('mousedown', (event) => {
    let target = event.target
    if (listboxState !== ListboxStates.Open) return
    if (buttonRef.current?.contains(target)) return
    if (optionsRef.current?.contains(target)) return
    dispatch({ type: ActionTypes.CloseListbox })
    if (!isFocusableElement(target, FocusableMode.Loose)) {
      event.preventDefault()
      buttonRef.current?.focus()
    }
  })
  let slot = useMemo(
    () => ({ open: listboxState === ListboxStates.Open, disabled }),
    [listboxState, disabled]
  )
  return React.createElement(
    ListboxContext.Provider,
    { value: reducerBag },
    React.createElement(
      OpenClosedProvider,
      {
        value: match(listboxState, {
          [ListboxStates.Open]: State.Open,
          [ListboxStates.Closed]: State.Closed,
        }),
      },
      render({
        props: passThroughProps,
        slot,
        defaultTag: DEFAULT_LISTBOX_TAG,
        name: 'Listbox',
      })
    )
  )
}
// ---
let DEFAULT_BUTTON_TAG = 'button'
let Button = forwardRefWithAs(function Button(props, ref) {
  let [state, dispatch] = useListboxContext(
    [Listbox.name, Button.name].join('.')
  )
  let buttonRef = useSyncRefs(state.buttonRef, ref)
  let id = `headlessui-listbox-button-${useId()}`
  let d = useDisposables()
  let handleKeyDown = useCallback(
    (event) => {
      switch (event.key) {
        // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-13
        case Keys.Space:
        case Keys.Enter:
        case Keys.ArrowDown:
          event.preventDefault()
          dispatch({ type: ActionTypes.OpenListbox })
          d.nextFrame(() => {
            if (!state.propsRef.current.value)
              dispatch({ type: ActionTypes.GoToOption, focus: Focus.First })
          })
          break
        case Keys.ArrowUp:
          event.preventDefault()
          dispatch({ type: ActionTypes.OpenListbox })
          d.nextFrame(() => {
            if (!state.propsRef.current.value)
              dispatch({ type: ActionTypes.GoToOption, focus: Focus.Last })
          })
          break
      }
    },
    [dispatch, state, d]
  )
  let handleKeyUp = useCallback((event) => {
    switch (event.key) {
      case Keys.Space:
        // Required for firefox, event.preventDefault() in handleKeyDown for
        // the Space key doesn't cancel the handleKeyUp, which in turn
        // triggers a *click*.
        event.preventDefault()
        break
    }
  }, [])
  let handleClick = useCallback(
    (event) => {
      if (isDisabledReactIssue7711(event.currentTarget))
        return event.preventDefault()
      if (state.listboxState === ListboxStates.Open) {
        dispatch({ type: ActionTypes.CloseListbox })
        d.nextFrame(() =>
          state.buttonRef.current?.focus({ preventScroll: true })
        )
      } else {
        event.preventDefault()
        dispatch({ type: ActionTypes.OpenListbox })
      }
    },
    [dispatch, d, state]
  )
  let labelledby = useComputed(() => {
    if (!state.labelRef.current) return undefined
    return [state.labelRef.current.id, id].join(' ')
  }, [state.labelRef.current, id])
  let slot = useMemo(
    () => ({
      open: state.listboxState === ListboxStates.Open,
      disabled: state.disabled,
    }),
    [state]
  )
  let passthroughProps = props
  let propsWeControl = {
    ref: buttonRef,
    id,
    type: useResolveButtonType(props, state.buttonRef),
    'aria-haspopup': true,
    'aria-controls': state.optionsRef.current?.id,
    'aria-expanded': state.disabled
      ? undefined
      : state.listboxState === ListboxStates.Open,
    'aria-labelledby': labelledby,
    disabled: state.disabled,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    onClick: handleClick,
  }
  return render({
    props: { ...passthroughProps, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_BUTTON_TAG,
    name: 'Listbox.Button',
  })
})
// ---
let DEFAULT_LABEL_TAG = 'label'
function Label(props) {
  let [state] = useListboxContext([Listbox.name, Label.name].join('.'))
  let id = `headlessui-listbox-label-${useId()}`
  let handleClick = useCallback(
    () => state.buttonRef.current?.focus({ preventScroll: true }),
    [state.buttonRef]
  )
  let slot = useMemo(
    () => ({
      open: state.listboxState === ListboxStates.Open,
      disabled: state.disabled,
    }),
    [state]
  )
  let propsWeControl = { ref: state.labelRef, id, onClick: handleClick }
  return render({
    props: { ...props, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_LABEL_TAG,
    name: 'Listbox.Label',
  })
}
// ---
let DEFAULT_OPTIONS_TAG = 'ul'
let OptionsRenderFeatures = Features.RenderStrategy | Features.Static
let Options = forwardRefWithAs(function Options(props, ref) {
  let [state, dispatch] = useListboxContext(
    [Listbox.name, Options.name].join('.')
  )
  let optionsRef = useSyncRefs(state.optionsRef, ref)
  let id = `headlessui-listbox-options-${useId()}`
  let d = useDisposables()
  let searchDisposables = useDisposables()
  let usesOpenClosedState = useOpenClosed()
  let visible = (() => {
    if (usesOpenClosedState !== null) {
      return usesOpenClosedState === State.Open
    }
    return state.listboxState === ListboxStates.Open
  })()
  useIsoMorphicEffect(() => {
    let container = state.optionsRef.current
    if (!container) return
    if (state.listboxState !== ListboxStates.Open) return
    if (container === document.activeElement) return
    container.focus({ preventScroll: true })
  }, [state.listboxState, state.optionsRef])
  let handleKeyDown = useCallback(
    (event) => {
      searchDisposables.dispose()
      switch (event.key) {
        // Ref: https://www.w3.org/TR/wai-aria-practices-1.2/#keyboard-interaction-12
        // @ts-expect-error Fallthrough is expected here
        case Keys.Space:
          if (state.searchQuery !== '') {
            event.preventDefault()
            event.stopPropagation()
            return dispatch({ type: ActionTypes.Search, value: event.key })
          }
        // When in type ahead mode, fallthrough
        case Keys.Enter:
          event.preventDefault()
          event.stopPropagation()
          dispatch({ type: ActionTypes.CloseListbox })
          if (state.activeOptionIndex !== null) {
            let { dataRef } = state.options[state.activeOptionIndex]
            state.propsRef.current.onChange(dataRef.current.value)
          }
          disposables().nextFrame(() =>
            state.buttonRef.current?.focus({ preventScroll: true })
          )
          break
        case match(state.orientation, {
          vertical: Keys.ArrowDown,
          horizontal: Keys.ArrowRight,
        }):
          event.preventDefault()
          event.stopPropagation()
          return dispatch({ type: ActionTypes.GoToOption, focus: Focus.Next })
        case match(state.orientation, {
          vertical: Keys.ArrowUp,
          horizontal: Keys.ArrowLeft,
        }):
          event.preventDefault()
          event.stopPropagation()
          return dispatch({
            type: ActionTypes.GoToOption,
            focus: Focus.Previous,
          })
        case Keys.Home:
        case Keys.PageUp:
          event.preventDefault()
          event.stopPropagation()
          return dispatch({ type: ActionTypes.GoToOption, focus: Focus.First })
        case Keys.End:
        case Keys.PageDown:
          event.preventDefault()
          event.stopPropagation()
          return dispatch({ type: ActionTypes.GoToOption, focus: Focus.Last })
        case Keys.Escape:
          event.preventDefault()
          event.stopPropagation()
          dispatch({ type: ActionTypes.CloseListbox })
          return d.nextFrame(() =>
            state.buttonRef.current?.focus({ preventScroll: true })
          )
        case Keys.Tab:
          event.preventDefault()
          event.stopPropagation()
          break
        default:
          if (event.key.length === 1) {
            dispatch({ type: ActionTypes.Search, value: event.key })
            searchDisposables.setTimeout(
              () => dispatch({ type: ActionTypes.ClearSearch }),
              350
            )
          }
          break
      }
    },
    [d, dispatch, searchDisposables, state]
  )
  let labelledby = useComputed(
    () => state.labelRef.current?.id ?? state.buttonRef.current?.id,
    [state.labelRef.current, state.buttonRef.current]
  )
  let slot = useMemo(
    () => ({ open: state.listboxState === ListboxStates.Open }),
    [state]
  )
  let propsWeControl = {
    'aria-activedescendant':
      state.activeOptionIndex === null
        ? undefined
        : state.options[state.activeOptionIndex]?.id,
    'aria-labelledby': labelledby,
    'aria-orientation': state.orientation,
    id,
    onKeyDown: handleKeyDown,
    role: 'listbox',
    tabIndex: 0,
    ref: optionsRef,
  }
  let passthroughProps = props
  return render({
    props: { ...passthroughProps, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_OPTIONS_TAG,
    features: OptionsRenderFeatures,
    visible,
    name: 'Listbox.Options',
  })
})
// ---
let DEFAULT_OPTION_TAG = 'li'
function Option(props) {
  let { disabled = false, value, ...passthroughProps } = props
  let [state, dispatch] = useListboxContext(
    [Listbox.name, Option.name].join('.')
  )
  let id = `headlessui-listbox-option-${useId()}`
  let active =
    state.activeOptionIndex !== null
      ? state.options[state.activeOptionIndex].id === id
      : false
  let selected = state.propsRef.current.value === value
  let bag = useRef({ disabled, value })
  useIsoMorphicEffect(() => {
    bag.current.disabled = disabled
  }, [bag, disabled])
  useIsoMorphicEffect(() => {
    bag.current.value = value
  }, [bag, value])
  useIsoMorphicEffect(() => {
    bag.current.textValue = document
      .getElementById(id)
      ?.textContent?.toLowerCase()
  }, [bag, id])
  let select = useCallback(
    () => state.propsRef.current.onChange(value),
    [state.propsRef, value]
  )
  useIsoMorphicEffect(() => {
    dispatch({ type: ActionTypes.RegisterOption, id, dataRef: bag })
    return () => dispatch({ type: ActionTypes.UnregisterOption, id })
  }, [bag, id])
  useIsoMorphicEffect(() => {
    if (state.listboxState !== ListboxStates.Open) return
    if (!selected) return
    dispatch({ type: ActionTypes.GoToOption, focus: Focus.Specific, id })
    document.getElementById(id)?.focus?.()
  }, [state.listboxState])
  useIsoMorphicEffect(() => {
    if (state.listboxState !== ListboxStates.Open) return
    if (!active) return
    let d = disposables()
    d.nextFrame(() =>
      document.getElementById(id)?.scrollIntoView?.({ block: 'nearest' })
    )
    return d.dispose
  }, [id, active, state.listboxState])
  let handleClick = useCallback(
    (event) => {
      if (disabled) return event.preventDefault()
      select()
      dispatch({ type: ActionTypes.CloseListbox })
      disposables().nextFrame(() =>
        state.buttonRef.current?.focus({ preventScroll: true })
      )
    },
    [dispatch, state.buttonRef, disabled, select]
  )
  let handleFocus = useCallback(() => {
    if (disabled)
      return dispatch({ type: ActionTypes.GoToOption, focus: Focus.Nothing })
    dispatch({ type: ActionTypes.GoToOption, focus: Focus.Specific, id })
  }, [disabled, id, dispatch])
  let handleMove = useCallback(() => {
    if (disabled) return
    if (active) return
    dispatch({ type: ActionTypes.GoToOption, focus: Focus.Specific, id })
  }, [disabled, active, id, dispatch])
  let handleLeave = useCallback(() => {
    if (disabled) return
    if (!active) return
    dispatch({ type: ActionTypes.GoToOption, focus: Focus.Nothing })
  }, [disabled, active, dispatch])
  let slot = useMemo(
    () => ({ active, selected, disabled }),
    [active, selected, disabled]
  )
  let propsWeControl = {
    id,
    role: 'option',
    tabIndex: disabled === true ? undefined : -1,
    'aria-disabled': disabled === true ? true : undefined,
    'aria-selected': selected === true ? true : undefined,
    disabled: undefined,
    onClick: handleClick,
    onFocus: handleFocus,
    onPointerMove: handleMove,
    onMouseMove: handleMove,
    onPointerLeave: handleLeave,
    onMouseLeave: handleLeave,
  }
  return render({
    props: { ...passthroughProps, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_OPTION_TAG,
    name: 'Listbox.Option',
  })
}
// ---
Listbox.Button = Button
Listbox.Label = Label
Listbox.Options = Options
