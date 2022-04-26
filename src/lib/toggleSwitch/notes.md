# Toggle / Switch Notes

Toggles are distinct from switches in that switches have on/off text indicators.

## Toggle Spec

`<button>`

```ts
type Toggle {
  'aria-pressed': 'true' | 'false'
}
```

## Switch Spec

`<button>`

```ts
type Switch {
  role: 'switch'
  'aria-checked': 'true' | 'false'
}
```

**Events**

`click`

- dispatch custom `change` event on the element with details of the change

## Legacy

Plans
Markup:
button
label (optional)
group (optional, use description which isn't actually present in the markup, just for context state)

Toggle (button)
props + events:
id, // `headlessui-switch${$useId}`
role: 'switch',
tabIndex: 0,
'aria-checked': checked, // boolean, exposed prop
onClick: handleClick,
(event) => {
event.preventDefault()
toggle()
let toggle = () => onChange(!checked)
}
onKeyUp: handleKeyUp,
(event) => {
if (event.key !== Keys.Tab) event.preventDefault()
if (event.key === Keys.Space) toggle()
}
onKeyPress: handleKeyPress,
// This is needed so that we can "cancel" the click event when we use the `Enter` key on a button.
(event) => event.preventDefault()

unnecessary props
type: useResolveButtonType(props, internalSwitchRef), // irrelevant
'aria-labelledby': groupContext?.labelledby,
'aria-describedby': groupContext?.describedby,
