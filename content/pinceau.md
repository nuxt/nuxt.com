---
title: Pinceau Docs
description: Docs for use pinceau & goos practices
---

# Script

In Balise `script` you must import two things:
- **computedStyle**: To use a computed in css properties
- **cssProp**: A prop to be used on any component to enable `:css` prop.

Both from `pinceau/runtime`

```js
import { computedStyle, cssProp } from 'pinceau/runtime'
```

If you want to use `variants`, you must define this in `defineProps`.

```
defineProps({
  ...
  css: cssProp,
  ...variants,
})
```

-------

# Template
Nothing to add on template.

-------

# Style

### How to use computed style ?

Computed style can be use on any css properties.

Be careful, if you can use a simple style, do it. Becasue computed style will create a computed.

```js
backgroundColor: (props) => {
  return props.bgColor
},
```

Computed Style allows you to use `utils` from pinceau.

eg:
```js
backgroundColor: (props, utils) => utils.scale(
  'colors',
  props.palette,
  { light: '600', dark: '200' }
),
```

Utils gives you access to a multitude of useful functions.

For exemple, `scale` Allows you to handles a scale of tokens easily. Like the exemple with the colors.
You can pass any type of colors (tokens, css color...)

### variants

Variants will create props, so no need to define them in `defineProps`

eg:
```js
variants: {
  position: {
    left: {
      ...
    },
    right: {
      ...
    },
    options: {
      default: 'left'
    }
  }
}
```

This will create this props:
```js
position: {
  type: String as PropType<'left' | 'right'>,
  default: 'left'
}
```

### Exemple


`@light` / `@ dark``

```js
'.block': {
  color: 'black',
  backgroundColor: 'white',
  '@light': {
    color: 'grey'
  },
  '@dark': {
    backgroundColor: 'black'
  }
}
```

`@mq` => breakpoints

```js
'@mq.sm': {
  width: '{space.300}'
},
```

#### color management

To define a props color you must use `computedStyle`.

It takes as a parameter:
- Attribute
- Default value
- required

```js
defineProps({
  palette: computedStyle('color', 'green', false),
  css: cssProp,
  ...variants,
})
```

After that you can use a `computed style` in css({}) to manage your prop color

```js
backgroundColor: (props, utils) => utils.scale(
  'colors',
  props.palette,
  { light: '600', dark: '200' }
),
```
