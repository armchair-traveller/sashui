import { onMount } from 'svelte'

export function useWindowEvent(type, listener, options) {
  onMount(() => {
    function handler(event) {
      listener.call(window, event)
    }
    window.addEventListener(type, handler, options)
    return () => window.removeEventListener(type, handler, options)
  })
}
