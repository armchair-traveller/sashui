import { onMount } from 'svelte'

/**
 * ? we've removed useIsoMorphicEffect from most calls, but it's likely useLayoutEffect is similar to onMount + tick (or afterUpdate)
 * + destroy b/c cleanup funcs returned from onMount can't be async (promise)
 * tick is async so it would change the onMount signature a little bit. Let's try it only if there're problems
 */
export const useIsoMorphicEffect =
  typeof window !== 'undefined' ? onMount : onMount
