// See: https://github.com/facebook/react/issues/7711
// See: https://github.com/facebook/react/pull/20612
// See: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#concept-fe-disabled (2.)
export function isDisabledReactIssue7711(element) {
  var _a
  let parent = element.parentElement
  let legend = null
  while (parent && !(parent instanceof HTMLFieldSetElement)) {
    if (parent instanceof HTMLLegendElement) legend = parent
    parent = parent.parentElement
  }
  let isParentDisabled =
    (_a =
      (parent === null || parent === void 0
        ? void 0
        : parent.getAttribute('disabled')) === '') !== null && _a !== void 0
      ? _a
      : false
  if (isParentDisabled && isFirstLegend(legend)) return false
  return isParentDisabled
}
function isFirstLegend(element) {
  if (!element) return false
  let previous = element.previousElementSibling
  while (previous !== null) {
    if (previous instanceof HTMLLegendElement) return false
    previous = previous.previousElementSibling
  }
  return true
}
