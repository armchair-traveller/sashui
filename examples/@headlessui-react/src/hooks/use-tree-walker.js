import { useRef, useEffect } from 'react'
import { useIsoMorphicEffect } from './use-iso-morphic-effect'
export function useTreeWalker({ container, accept, walk, enabled = true }) {
  let acceptRef = useRef(accept)
  let walkRef = useRef(walk)
  // TODO: understand which lifecycle func this needs, replace isomorphic effect
  useEffect(() => {
    acceptRef.current = accept
    walkRef.current = walk
  }, [accept, walk])
  // TODO: understand which lifecycle func this needs, replace isomorphic effect
  useIsoMorphicEffect(() => {
    if (!container) return
    if (!enabled) return
    let accept = acceptRef.current
    let walk = walkRef.current
    let acceptNode = Object.assign((node) => accept(node), {
      acceptNode: accept,
    })
    let walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      acceptNode,
      false
    )
    while (walker.nextNode()) walk(walker.currentNode)
  }, [container, enabled, acceptRef, walkRef])
}
