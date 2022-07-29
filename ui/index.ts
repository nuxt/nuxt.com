import { safeColors } from './colors'

const badge = {
  variant: {
    primary: 'u-bg-gray-800 u-text-white',
    secondary: 'u-bg-white u-text-gray-700',
    ...safeColors.reduce((acc: any, color) => {
      acc[color] = `bg-${color}-400 text-white`
      return acc
    }, {})
  }
}

const button = {
  rounded: 'rounded-lg',
  variant: {
    primary: 'border border-transparent u-text-white u-bg-gray-900 hover:u-bg-gray-800 disabled:u-bg-gray-900 focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900',
    secondary: 'border u-border-gray-200 u-text-gray-700 u-bg-white hover:u-bg-gray-50 disabled:u-bg-white focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900',
    gray: 'border border-transparent u-text-gray-700 u-bg-gray-100 hover:u-bg-gray-200 disabled:u-bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900',
    link: 'border border-transparent u-text-gray-900 hover:underline focus:underline',
    'transparent-hover': 'border border-transparent u-text-gray-500 hover:u-text-white focus:u-text-white bg-transparent hover:u-bg-gray-900 focus:u-bg-gray-900 disabled:u-text-gray-500',
    'input-group': 'shadow-sm border u-border-gray-200 u-text-gray-700 u-bg-gray-50 hover:u-bg-gray-100 disabled:u-bg-gray-50 focus:ring-1 focus:u-ring-gray-900 focus:u-border-gray-900',
    'primary-gradient': 'relative text-white gradient-border-2 border-gradient-br-gradient-gray-900 hover:border-gradient-br-gradient-black before:absolute before:transition before:duration-200 before:rounded-lg before:opacity-0 hover:before:opacity-75 before:-inset-0.5 before:bg-gradient-to-r before:from-green-400 before:via-teal-400 before:to-indigoblue-400 before:blur-md before:z-[-1]',
    // Override all button variants to reduce bg from `600` to `500`
    ...safeColors.reduce((acc: any, color) => {
      acc[color] = `border border-transparent text-white bg-${color}-500 hover:bg-${color}-400 disabled:bg-${color}-500 focus:ring-2 focus:ring-offset-2 focus:ring-${color}-400`
      return acc
    }, {})
  },
  icon: {
    loading: 'uil:refresh'
  }
}

const input = {
  appearance: {
    default: 'focus:ring-1 focus:u-ring-gray-900 focus:u-border-gray-900 bg-white dark:bg-gray-900 border u-border-gray-200 rounded-lg shadow-sm focus:ring-offset-white dark:focus:ring-offset-black',
    invert: 'focus:ring-2 focus:u-ring-gray-900 focus:ring-offset-2 bg-gray-900 dark:bg-white u-text-white border u-border-gray-900 rounded-lg shadow-sm focus:ring-offset-white dark:focus:ring-offset-black font-semibold',
    darken: 'focus:ring-1 focus:u-ring-gray-900 focus:u-border-gray-900 u-bg-white border u-border-gray-200 rounded-lg shadow-sm focus:ring-offset-white dark:focus:ring-offset-black'
  },
  icon: {
    loading: 'uil:refresh'
  }
}

const textarea = {
  appearance: input.appearance
}

const select = {
  appearance: input.appearance
}

const selectCustom = {
  appearance: input.appearance,
  icon: {
    name: 'uil:angle-down'
  },
  list: {
    base: 'u-bg-white shadow-lg rounded-md ring-1 u-ring-gray-200 border border-transparent focus:outline-none overflow-y-auto p-1 max-h-60',
    option: {
      base: 'cursor-default select-none relative py-1.5 pl-2 pr-8 rounded-md text-sm',
      active: 'u-text-gray-900 bg-gray-100 dark:bg-gray-900',
      inactive: 'u-text-gray-900',
      icon: {
        name: 'uil:check',
        base: 'absolute inset-y-0 right-0 flex items-center pr-2',
        active: '',
        inactive: '',
        size: 'h-4 w-4'
      }
    }
  }
}

const toggle = {
  base: 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900 focus:ring-offset-white dark:focus:ring-offset-black',
  active: 'bg-gray-100 dark:bg-gray-800',
  inactive: 'bg-gray-100 dark:bg-gray-800',
  container: {
    base: 'pointer-events-none relative inline-block h-5 w-5 rounded-full u-bg-white shadow transform ring-0 transition ease-in-out duration-200'
  },
  icon: {
    on: 'h-3 w-3 u-text-gray-600',
    off: 'h-3 w-3 u-text-gray-400'
  }
}

const radio = {
  base: 'h-4 w-4 text-gray-800 focus:ring-2 focus:ring-offset-2 dark:bg-gray-900 dark:checked:bg-current focus:u-ring-gray-900 focus:ring-offset-white dark:focus:ring-offset-black u-border-gray-200 hover:u-border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
}

const checkbox = {
  base: `${radio.base} rounded`
}

const card = {
  rounded: 'rounded-xl',
  background: 'bg-white dark:bg-gray-900'
}

const modal = {
  rounded: 'rounded-xl'
}

const container = {
  constrained: 'max-w-7xl'
}

export default {
  badge,
  button,
  input,
  textarea,
  select,
  selectCustom,
  toggle,
  radio,
  checkbox,
  card,
  modal,
  container
}
