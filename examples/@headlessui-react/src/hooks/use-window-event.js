import { onMount } from 'svelte'

export function useWindowEvent(type, listener, options) {
  onMount(() => {
    var handler = listener.bind(window)
    window.addEventListener(type, handler, options)
    return () => window.removeEventListener(type, handler, options)
  })
}
