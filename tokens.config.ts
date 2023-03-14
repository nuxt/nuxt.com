import { defineTheme } from 'pinceau'

// See Typography config on https://github.com/nuxt-themes/typography/blob/main/tokens.config.ts
export default defineTheme({
  color: {
    transparent: 'transparent',
    current: 'currentColor',
    white: '#fff',
    black: '#0c0c0d',
    primary: {
      50: '#d9f1ff',
      100: '#b3e4ff',
      200: '#8dd6ff',
      300: '#66c8ff',
      400: '#40bbff',
      500: '#1aadff',
      600: '#0090e1',
      700: '#006ca9',
      800: '#004870',
      900: '#002438'
    },
    gray: {
      50: '#FAFAFA',
      100: '#F4F4F5',
      200: '#E4E4E7',
      300: '#D4D4D8',
      400: '#A1A1AA',
      500: '#71717A',
      600: '#52525B',
      700: '#3F3F46',
      800: '#27272A',
      900: '#18181B'
    },
    green: {
      50: '#d6ffee',
      100: '#acffdd',
      200: '#83ffcc',
      300: '#30ffaa',
      400: '#00dc82',
      500: '#00bd6f',
      600: '#009d5d',
      700: '#007e4a',
      800: '#005e38',
      900: '#003f25'
    },
    yellow: {
      50: '#fdf6db',
      100: '#fcedb7',
      200: '#fae393',
      300: '#f8da70',
      400: '#f7d14c',
      500: '#f5c828',
      600: '#daac0a',
      700: '#a38108',
      800: '#6d5605',
      900: '#362b03'
    },
    orange: {
      50: '#ffe9d9',
      100: '#ffd3b3',
      200: '#ffbd8d',
      300: '#ffa666',
      400: '#ff9040',
      500: '#ff7a1a',
      600: '#e15e00',
      700: '#a94700',
      800: '#702f00',
      900: '#381800'
    },
    red: {
      50: '#ffdbd9',
      100: '#ffb7b3',
      200: '#ff948d',
      300: '#ff7066',
      400: '#ff4c40',
      500: '#ff281a',
      600: '#e10e00',
      700: '#a90a00',
      800: '#700700',
      900: '#380300'
    },
    pear: {
      50: '#f7f8dc',
      100: '#eff0ba',
      200: '#e8e997',
      300: '#e0e274',
      400: '#d8da52',
      500: '#d0d32f',
      600: '#a8aa24',
      700: '#7e801b',
      800: '#545512',
      900: '#2a2b09'
    },
    teal: {
      50: '#d7faf8',
      100: '#aff4f0',
      200: '#87efe9',
      300: '#5fe9e1',
      400: '#36e4da',
      500: '#1cd1c6',
      600: '#16a79e',
      700: '#117d77',
      800: '#0b544f',
      900: '#062a28'
    },
    lightblue: {
      50: '#d9f8ff',
      100: '#b3f1ff',
      200: '#8deaff',
      300: '#66e4ff',
      400: '#40ddff',
      500: '#1ad6ff',
      600: '#00b9e1',
      700: '#008aa9',
      800: '#005c70',
      900: '#002e38'
    },
    blue: {
      50: '#d9f1ff',
      100: '#b3e4ff',
      200: '#8dd6ff',
      300: '#66c8ff',
      400: '#40bbff',
      500: '#1aadff',
      600: '#0090e1',
      700: '#006ca9',
      800: '#004870',
      900: '#002438'
    },
    indigoblue: {
      50: '#d9e5ff',
      100: '#b3cbff',
      200: '#8db0ff',
      300: '#6696ff',
      400: '#407cff',
      500: '#1a62ff',
      600: '#0047e1',
      700: '#0035a9',
      800: '#002370',
      900: '#001238'
    },
    royalblue: {
      50: '#dfdbfb',
      100: '#c0b7f7',
      200: '#a093f3',
      300: '#806ff0',
      400: '#614bec',
      500: '#4127e8',
      600: '#2c15c4',
      700: '#211093',
      800: '#160a62',
      900: '#0b0531'
    },
    purple: {
      50: '#ead9ff',
      100: '#d5b3ff',
      200: '#c08dff',
      300: '#ab66ff',
      400: '#9640ff',
      500: '#811aff',
      600: '#6500e1',
      700: '#4c00a9',
      800: '#330070',
      900: '#190038'
    },
    pink: {
      50: '#ffd9f2',
      100: '#ffb3e5',
      200: '#ff8dd8',
      300: '#ff66cc',
      400: '#ff40bf',
      500: '#ff1ab2',
      600: '#e10095',
      700: '#a90070',
      800: '#70004b',
      900: '#380025'
    },
    ruby: {
      50: '#ffd9e4',
      100: '#ffb3c9',
      200: '#ff8dae',
      300: '#ff6694',
      400: '#ff4079',
      500: '#ff1a5e',
      600: '#e10043',
      700: '#a90032',
      800: '#700021',
      900: '#380011'
    }
  },
  typography: {
    verticalMargin: {
      base: '18px'
    },
    color: {
      primary: {
        50: '#d6ffee',
        100: '#acffdd',
        200: '#83ffcc',
        300: '#30ffaa',
        400: '#00dc82',
        500: '#00bd6f',
        600: '#009d5d',
        700: '#007e4a',
        800: '#005e38',
        900: '#003f25'
      }
    },
    font: {
      body: '"RoobertPRO", "RoobertPRO override", sans-serif',
      display: '"RoobertPRO", "RoobertPRO override", sans-serif'
    }
  },
  size: {
    0: '0px',
    1: '1px',
    2: '2px',
    3: '3px',
    4: '4px',
    5: '5px',
    6: '6px',
    7: '7px',
    8: '8px',
    9: '9px',
    10: '10px',
    12: '12px',
    14: '14px',
    16: '16px',
    18: '18px',
    20: '20px',
    24: '24px',
    28: '28px',
    32: '32px',
    40: '40px',
    48: '48px',
    56: '56px',
    64: '64px',
    80: '80px',
    96: '96px',
    104: '104px',
    200: '200px',
    xs: '20rem',
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    full: '100%'
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem'
  },

  button: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '0.875rem',
      lg: '1rem',
      xl: '1rem'
    }
  },

  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    none: '0px 0px 0px 0px transparent',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)'
  },

  transition: {
    background: 'background-color .2s ease-in-out'
  },

  utils: {
    py: (value: PropertyValue<'padding'>) => ({
      paddingTop: value,
      paddingBottom: value
    }),
    my: (value: PropertyValue<'margin'>) => ({
      marginTop: value,
      marginBottom: value
    }),
    px: (value: PropertyValue<'padding'>) => ({
      paddingLeft: value,
      paddingRight: value
    }),
    mx: (value: PropertyValue<'margin'>) => ({
      marginLeft: value,
      marginRight: value
    }),
    ringColor: (value: string) => ({
      '--ring-color': value
    }),
    ringOffsetColor: (value: string) => ({
      '--ring-offset-color': value
    }),
    ringOffset: (value: string | number) => ({
      '--ring-offset': typeof value === 'string' ? value : `${value}px`
    }),
    ring: (value: (number | string) | [padding: number | string, inset: boolean]) => {
      // Support `css({ ring: [3, true] })` or `css({ ring: 1 })`
      let padding = Array.isArray(value) ? value[0] : value
      padding = typeof padding === 'string' ? padding : `${padding}px`
      let inset: string | boolean = Array.isArray(value) && value[1]
      inset = inset ? inset + ' ' : ''

      return {
        '--ring-box-shadow': `${inset}0 0 0 calc(${padding} + var(--ring-offset, 3px)) var(--ring-color, currentColor)`,
        boxShadow: '0 0 0 var(--ring-offset, 3px) var(--ring-offset-color, transparent), {ring.box.shadow}'
      }
    }
  }
})
