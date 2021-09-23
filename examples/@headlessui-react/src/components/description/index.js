import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import { useId } from '../../hooks/use-id'
import { render } from '../../utils/render'
import { useIsoMorphicEffect } from '../../hooks/use-iso-morphic-effect'
let DescriptionContext = createContext(null)
function useDescriptionContext() {
  let context = useContext(DescriptionContext)
  if (context === null) {
    let err = new Error(
      'You used a <Description /> component, but it is not inside a relevant parent.'
    )
    if (Error.captureStackTrace)
      Error.captureStackTrace(err, useDescriptionContext)
    throw err
  }
  return context
}
export function useDescriptions() {
  let [descriptionIds, setDescriptionIds] = useState([])
  return [
    // The actual id's as string or undefined
    descriptionIds.length > 0 ? descriptionIds.join(' ') : undefined,
    // The provider component
    useMemo(() => {
      return function DescriptionProvider(props) {
        let register = useCallback((value) => {
          setDescriptionIds((existing) => [...existing, value])
          return () =>
            setDescriptionIds((existing) => {
              let clone = existing.slice()
              let idx = clone.indexOf(value)
              if (idx !== -1) clone.splice(idx, 1)
              return clone
            })
        }, [])
        let contextBag = useMemo(
          () => ({
            register,
            slot: props.slot,
            name: props.name,
            props: props.props,
          }),
          [register, props.slot, props.name, props.props]
        )
        return React.createElement(
          DescriptionContext.Provider,
          { value: contextBag },
          props.children
        )
      }
    }, [setDescriptionIds]),
  ]
}
// ---
let DEFAULT_DESCRIPTION_TAG = 'p'
export function Description(props) {
  let context = useDescriptionContext()
  let id = `headlessui-description-${useId()}`
  useIsoMorphicEffect(() => context.register(id), [id, context.register])
  let passThroughProps = props
  let propsWeControl = { ...context.props, id }
  return render({
    props: { ...passThroughProps, ...propsWeControl },
    slot: context.slot || {},
    defaultTag: DEFAULT_DESCRIPTION_TAG,
    name: context.name || 'Description',
  })
}
