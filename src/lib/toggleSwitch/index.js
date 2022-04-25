import { addEvts } from '../utils/action'

/** @typedef {import('svelte/action').Action<HTMLButtonElement | HTMLInputElement | HTMLElement, boolean>} Toggle */

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
export const toggle = createToggleSwitch()
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
export const Switch = createToggleSwitch(false)

function createToggleSwitch(isToggle = true) {
  const aria = `aria-${isToggle ? 'pressed' : 'checked'}`

  /** @type {Toggle} */
  return function Switch(el, checked = false) {
    !isToggle && el.setAttribute('role', 'switch')
    update(checked)

    // ? Could easily pass in the event that caused the change to detail, but I don't see the point of doing so. Needs use case.
    function toggle() {
      el.dispatchEvent(new CustomEvent('change', { detail: !checked }))
    }
    function update(_checked = checked) {
      el.setAttribute(aria, !!(checked = _checked))
    }
    return {
      update,
      destroy: addEvts(el, {
        click(e) {
          e.preventDefault()
          toggle()
        },
        keyup(e) {
          if (e.key != 'Tab') e.preventDefault()
          if (e.key == ' ') toggle()
        },
        keypress: (e) => e.preventDefault(), // This is needed so that we can "cancel" the click event when we use the `Enter` key on a button.
      }),
    }
  }
}
