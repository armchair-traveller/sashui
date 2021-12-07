import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,

  // Types
  ElementType,
  MutableRefObject,
  KeyboardEvent as ReactKeyboardEvent,
  ContextType,
} from 'react'

import { Props, Expand } from '../../types'
import { render } from '../../utils/render'
import { useId } from '../../hooks/use-id'
import { match } from '../../utils/match'
import { useIsoMorphicEffect } from '../../hooks/use-iso-morphic-effect'
import { Keys } from '../../components/keyboard'
import { focusIn, Focus, FocusResult } from '../../utils/focus-management'
import { useFlags } from '../../hooks/use-flags'
import { Label, useLabels } from '../../components/label/label'
import { Description, useDescriptions } from '../../components/description/description'
import { useTreeWalker } from '../../hooks/use-tree-walker'

interface Option {
  id: string
  element: MutableRefObject<HTMLElement | null>
  propsRef: MutableRefObject<{ value: unknown; disabled: boolean }>
}

interface StateDefinition {
  options: Option[]
}

enum ActionTypes {
  RegisterOption,
  UnregisterOption,
}

type Actions =
  | Expand<{ type: ActionTypes.RegisterOption } & Option>
  | { type: ActionTypes.UnregisterOption; id: Option['id'] }

let reducers: {
  [P in ActionTypes]: (
    state: StateDefinition,
    action: Extract<Actions, { type: P }>
  ) => StateDefinition
} = {
  [ActionTypes.RegisterOption](state, action) {
    return {
      ...state,
      options: [
        ...state.options,
        { id: action.id, element: action.element, propsRef: action.propsRef },
      ],
    }
  },
  [ActionTypes.UnregisterOption](state, action) {
    let options = state.options.slice()
    let idx = state.options.findIndex(radio => radio.id === action.id)
    if (idx === -1) return state
    options.splice(idx, 1)
    return { ...state, options }
  },
}

let RadioGroupContext = createContext<{
  registerOption(option: Option): () => void
  change(value: unknown): boolean
  value: unknown
  firstOption?: Option
  containsCheckedOption: boolean
  disabled: boolean
} | null>(null)
RadioGroupContext.displayName = 'RadioGroupContext'

function useRadioGroupContext(component: string) {
  let context = useContext(RadioGroupContext)
  if (context === null) {
    let err = new Error(`<${component} /> is missing a parent <${RadioGroup.name} /> component.`)
    if (Error.captureStackTrace) Error.captureStackTrace(err, useRadioGroupContext)
    throw err
  }
  return context
}

function stateReducer(state: StateDefinition, action: Actions) {
  return match(action.type, reducers, state, action)
}

// ---

let DEFAULT_RADIO_GROUP_TAG = 'div' as const
interface RadioGroupRenderPropArg {}
type RadioGroupPropsWeControl = 'role' | 'aria-labelledby' | 'aria-describedby' | 'id'

export function RadioGroup<
  TTag extends ElementType = typeof DEFAULT_RADIO_GROUP_TAG,
  TType = string
>(
  props: Props<
    TTag,
    RadioGroupRenderPropArg,
    RadioGroupPropsWeControl | 'value' | 'onChange' | 'disabled'
  > & {
    value: TType
    onChange(value: TType): void
    disabled?: boolean
  }
) {
  let { value, onChange, disabled = false, ...passThroughProps } = props
  let [{ options }, dispatch] = useReducer(stateReducer, {
    options: [],
  } as StateDefinition)
  let [labelledby, LabelProvider] = useLabels()
  let [describedby, DescriptionProvider] = useDescriptions()
  let id = `headlessui-radiogroup-${useId()}`
  let radioGroupRef = useRef<HTMLElement | null>(null)

  let firstOption = useMemo(
    () =>
      options.find(option => {
        if (option.propsRef.current.disabled) return false
        return true
      }),
    [options]
  )
  let containsCheckedOption = useMemo(
    () => options.some(option => option.propsRef.current.value === value),
    [options, value]
  )

  let triggerChange = useCallback(
    nextValue => {
      if (disabled) return false
      if (nextValue === value) return false
      let nextOption = options.find(option => option.propsRef.current.value === nextValue)?.propsRef
        .current
      if (nextOption?.disabled) return false

      onChange(nextValue)
      return true
    },
    [onChange, value, disabled, options]
  )

  useTreeWalker({
    container: radioGroupRef.current,
    accept(node) {
      if (node.getAttribute('role') === 'radio') return NodeFilter.FILTER_REJECT
      if (node.hasAttribute('role')) return NodeFilter.FILTER_SKIP
      return NodeFilter.FILTER_ACCEPT
    },
    walk(node) {
      node.setAttribute('role', 'none')
    },
  })

  let handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>) => {
      let container = radioGroupRef.current
      if (!container) return

      let all = options
        .filter(option => option.propsRef.current.disabled === false)
        .map(radio => radio.element.current) as HTMLElement[]

      switch (event.key) {
        case Keys.ArrowLeft:
        case Keys.ArrowUp:
          {
            event.preventDefault()
            event.stopPropagation()

            let result = focusIn(all, Focus.Previous | Focus.WrapAround)

            if (result === FocusResult.Success) {
              let activeOption = options.find(
                option => option.element.current === document.activeElement
              )
              if (activeOption) triggerChange(activeOption.propsRef.current.value)
            }
          }
          break

        case Keys.ArrowRight:
        case Keys.ArrowDown:
          {
            event.preventDefault()
            event.stopPropagation()

            let result = focusIn(all, Focus.Next | Focus.WrapAround)

            if (result === FocusResult.Success) {
              let activeOption = options.find(
                option => option.element.current === document.activeElement
              )
              if (activeOption) triggerChange(activeOption.propsRef.current.value)
            }
          }
          break

        case Keys.Space:
          {
            event.preventDefault()
            event.stopPropagation()

            let activeOption = options.find(
              option => option.element.current === document.activeElement
            )
            if (activeOption) triggerChange(activeOption.propsRef.current.value)
          }
          break
      }
    },
    [radioGroupRef, options, triggerChange]
  )

  let registerOption = useCallback(
    (option: Option) => {
      dispatch({ type: ActionTypes.RegisterOption, ...option })
      return () => dispatch({ type: ActionTypes.UnregisterOption, id: option.id })
    },
    [dispatch]
  )

  let api = useMemo<ContextType<typeof RadioGroupContext>>(
    () => ({
      registerOption,
      firstOption,
      containsCheckedOption,
      change: triggerChange,
      disabled,
      value,
    }),
    [registerOption, firstOption, containsCheckedOption, triggerChange, disabled, value]
  )

  let propsWeControl = {
    ref: radioGroupRef,
    id,
    role: 'radiogroup',
    'aria-labelledby': labelledby,
    'aria-describedby': describedby,
    onKeyDown: handleKeyDown,
  }

  return (
    <DescriptionProvider name="RadioGroup.Description">
      <LabelProvider name="RadioGroup.Label">
        <RadioGroupContext.Provider value={api}>
          {render({
            props: { ...passThroughProps, ...propsWeControl },
            defaultTag: DEFAULT_RADIO_GROUP_TAG,
            name: 'RadioGroup',
          })}
        </RadioGroupContext.Provider>
      </LabelProvider>
    </DescriptionProvider>
  )
}

// ---

enum OptionState {
  Empty = 1 << 0,
  Active = 1 << 1,
}

let DEFAULT_OPTION_TAG = 'div' as const
interface OptionRenderPropArg {
  checked: boolean
  active: boolean
  disabled: boolean
}
type RadioPropsWeControl =
  | 'aria-checked'
  | 'id'
  | 'onBlur'
  | 'onClick'
  | 'onFocus'
  | 'ref'
  | 'role'
  | 'tabIndex'

function Option<
  TTag extends ElementType = typeof DEFAULT_OPTION_TAG,
  // TODO: One day we will be able to infer this type from the generic in RadioGroup itself.
  // But today is not that day..
  TType = Parameters<typeof RadioGroup>[0]['value']
>(
  props: Props<TTag, OptionRenderPropArg, RadioPropsWeControl | 'value' | 'disabled'> & {
    value: TType
    disabled?: boolean
  }
) {
  let optionRef = useRef<HTMLElement | null>(null)
  let id = `headlessui-radiogroup-option-${useId()}`

  let [labelledby, LabelProvider] = useLabels()
  let [describedby, DescriptionProvider] = useDescriptions()
  let { addFlag, removeFlag, hasFlag } = useFlags(OptionState.Empty)

  let { value, disabled = false, ...passThroughProps } = props
  let propsRef = useRef({ value, disabled })

  useIsoMorphicEffect(() => {
    propsRef.current.value = value
  }, [value, propsRef])
  useIsoMorphicEffect(() => {
    propsRef.current.disabled = disabled
  }, [disabled, propsRef])

  let {
    registerOption,
    disabled: radioGroupDisabled,
    change,
    firstOption,
    containsCheckedOption,
    value: radioGroupValue,
  } = useRadioGroupContext([RadioGroup.name, Option.name].join('.'))

  useIsoMorphicEffect(() => registerOption({ id, element: optionRef, propsRef }), [
    id,
    registerOption,
    optionRef,
    props,
  ])

  let handleClick = useCallback(() => {
    if (!change(value)) return

    addFlag(OptionState.Active)
    optionRef.current?.focus()
  }, [addFlag, change, value])

  let handleFocus = useCallback(() => addFlag(OptionState.Active), [addFlag])
  let handleBlur = useCallback(() => removeFlag(OptionState.Active), [removeFlag])

  let isFirstOption = firstOption?.id === id
  let isDisabled = radioGroupDisabled || disabled

  let checked = radioGroupValue === value
  let propsWeControl = {
    ref: optionRef,
    id,
    role: 'radio',
    'aria-checked': checked ? 'true' : 'false',
    'aria-labelledby': labelledby,
    'aria-describedby': describedby,
    'aria-disabled': isDisabled ? true : undefined,
    tabIndex: (() => {
      if (isDisabled) return -1
      if (checked) return 0
      if (!containsCheckedOption && isFirstOption) return 0
      return -1
    })(),
    onClick: isDisabled ? undefined : handleClick,
    onFocus: isDisabled ? undefined : handleFocus,
    onBlur: isDisabled ? undefined : handleBlur,
  }
  let slot = useMemo<OptionRenderPropArg>(
    () => ({ checked, disabled: isDisabled, active: hasFlag(OptionState.Active) }),
    [checked, isDisabled, hasFlag]
  )

  return (
    <DescriptionProvider name="RadioGroup.Description">
      <LabelProvider name="RadioGroup.Label">
        {render({
          props: { ...passThroughProps, ...propsWeControl },
          slot,
          defaultTag: DEFAULT_OPTION_TAG,
          name: 'RadioGroup.Option',
        })}
      </LabelProvider>
    </DescriptionProvider>
  )
}

// ---

RadioGroup.Option = Option
RadioGroup.Label = Label
RadioGroup.Description = Description
