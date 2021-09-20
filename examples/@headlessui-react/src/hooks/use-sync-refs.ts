import { useRef, useEffect, useCallback } from 'react'

export function useSyncRefs<TType>(
  ...refs: (React.MutableRefObject<TType | null> | ((instance: TType) => void) | null)[]
) {
  let cache = useRef(refs)

  useEffect(() => {
    cache.current = refs
  }, [refs])

  return useCallback(
    (value: TType) => {
      for (let ref of cache.current) {
        if (ref == null) continue
        if (typeof ref === 'function') ref(value)
        else ref.current = value
      }
    },
    [cache]
  )
}
