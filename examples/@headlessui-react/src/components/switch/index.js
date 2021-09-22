import React, {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from 'react'
import { render } from '../../utils/render'
import { useId } from '../../hooks/use-id'
import { Keys } from '../keyboard'
import { isDisabledReactIssue7711 } from '../../utils/bugs'
import { Label, useLabels } from '../label/label'
import { Description, useDescriptions } from '../description/description'
import { useResolveButtonType } from '../../hooks/use-resolve-button-type'
import { useSyncRefs } from '../../hooks/use-sync-refs'
let GroupContext = createContext(null)
GroupContext.displayName = 'GroupContext'
// ---
let DEFAULT_GROUP_TAG = Fragment
function Group(props) {
  let [switchElement, setSwitchElement] = useState(null)
  let [labelledby, LabelProvider] = useLabels()
  let [describedby, DescriptionProvider] = useDescriptions()
  let context = useMemo(
    () => ({
      switch: switchElement,
      setSwitch: setSwitchElement,
      labelledby,
      describedby,
    }),
    [switchElement, setSwitchElement, labelledby, describedby]
  )
  return React.createElement(
    DescriptionProvider,
    { name: 'Switch.Description' },
    React.createElement(
      LabelProvider,
      {
        name: 'Switch.Label',
        props: {
          onClick() {
            if (!switchElement) return
            switchElement.click()
            switchElement.focus({ preventScroll: true })
          },
        },
      },
      React.createElement(
        GroupContext.Provider,
        { value: context },
        render({ props, defaultTag: DEFAULT_GROUP_TAG, name: 'Switch.Group' })
      )
    )
  )
}
// ---
let DEFAULT_SWITCH_TAG = 'button'
export function Switch(props) {
  let { checked, onChange, ...passThroughProps } = props
  let id = `headlessui-switch-${useId()}`
  let groupContext = useContext(GroupContext)
  let internalSwitchRef = useRef(null)
  let switchRef = useSyncRefs(
    internalSwitchRef,
    groupContext === null ? null : groupContext.setSwitch
  )
  let toggle = useCallback(() => onChange(!checked), [onChange, checked])
  let handleClick = useCallback(
    (event) => {
      if (isDisabledReactIssue7711(event.currentTarget))
        return event.preventDefault()
      event.preventDefault()
      toggle()
    },
    [toggle]
  )
  let handleKeyUp = useCallback(
    (event) => {
      if (event.key !== Keys.Tab) event.preventDefault()
      if (event.key === Keys.Space) toggle()
    },
    [toggle]
  )
  // This is needed so that we can "cancel" the click event when we use the `Enter` key on a button.
  let handleKeyPress = useCallback((event) => event.preventDefault(), [])
  let slot = useMemo(() => ({ checked }), [checked])
  let propsWeControl = {
    id,
    ref: switchRef,
    role: 'switch',
    type: useResolveButtonType(props, internalSwitchRef),
    tabIndex: 0,
    'aria-checked': checked,
    'aria-labelledby': groupContext?.labelledby,
    'aria-describedby': groupContext?.describedby,
    onClick: handleClick,
    onKeyUp: handleKeyUp,
    onKeyPress: handleKeyPress,
  }
  return render({
    props: { ...passThroughProps, ...propsWeControl },
    slot,
    defaultTag: DEFAULT_SWITCH_TAG,
    name: 'Switch',
  })
}
// ---
Switch.Group = Group
Switch.Label = Label
Switch.Description = Description
