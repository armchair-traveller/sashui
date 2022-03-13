/** Switch action
 *
 * Pass in current checked state.
 * Fires change event on press. `e.detail` contains desired change value.
 *
 *### Usage
 * ```svelte
 * <button on:change={()=>(checked = !checked)} use:Switch={checked} />
 * ```
 *
 * For labeling, default `<label>` will work as expected.
 *
 * Note for rare usecase: Ideal tag is `<button>`-like, but if this action is used on an element that isn't a button / input type=button/submit please add
 * `role="button" tabindex="0"`. In this scenario, `<label>`'s click event will also not work according to normal usage,
 * so if click behavior is desired just manually add a click event to set the press state.
 */
export function Switch(
  el: HTMLButtonElement | HTMLInputElement | HTMLElement,
  checked?: boolean
): {
  update: (curChecked?: boolean) => void
  destroy: () => void
}
/** Toggle action
 *
 * Pass in current pressed state.
 * Fires change event on press. `e.detail` contains desired change value.
 *
 *### Usage
 * ```svelte
 * <button on:change={()=>(pressed = !pressed)} use:toggle={pressed} />
 * ```
 *
 * For labeling, default `<label>` will work as expected.
 *
 * Note for rare usecase: Ideal tag is `<button>`-like, but if this action is used on an element that isn't a button / input type=button/submit please add
 * `role="button" tabindex="0"`. In this scenario, `<label>`'s click event will also not work according to normal usage,
 * so if click behavior is desired just manually add a click event to set the press state.
 */
export function toggle(
  el: HTMLButtonElement | HTMLInputElement | HTMLElement,
  checked?: boolean
): {
  update: (curChecked?: boolean) => void
  destroy: () => void
}
