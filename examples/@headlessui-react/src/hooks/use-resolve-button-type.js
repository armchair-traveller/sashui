/**
 * This seems to be used w/ `as` functionality, which doesn't exist in Svelte
 *
 * `svelte:element` dynamic elements is a relevant issue https://github.com/sveltejs/svelte/issues/2324 but it seems like
 * it'll take a very long time before anyone actually implements it as it's quite niche and has many issues w/ its
 * current proposed implementation, except for the simplest use case.
 *
 * This isn't a dealbreaker. The feature has a myriad of alternatives, some better than `as`.
 * For example, an slot+/action-based API would be very suitable.
 *
 * Relevant: https://twitter.com/peduarte/status/1426181279293362176 thread has alternatives you can consider.
 * */
export function useResolveButtonType(type, ref) {
  if (
    !type &&
    ref &&
    ref instanceof HTMLButtonElement &&
    !ref.hasAttribute('type')
  ) {
    return 'button'
  }
  return type
}
