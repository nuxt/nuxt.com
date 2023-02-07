const radio: any = {
  wrapper: 'relative flex items-start',
  base: 'h-4 w-4 text-primary-600 focus:ring-2 focus:ring-offset-2 u-bg-white dark:checked:bg-current dark:checked:border-transparent focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-black u-border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
  label: 'font-medium u-text-gray-700',
  required: 'text-red-400',
  help: 'u-text-gray-500'
}

const inputPreset: any = {
  wrapper: 'relative',
  base: 'relative block w-full disabled:cursor-not-allowed disabled:opacity-75 focus:outline-none',
  size: {
    xxs: 'text-xs',
    xs: 'text-xs',
    sm: 'text-sm leading-4',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-base'
  },
  spacing: {
    xxs: 'px-1 py-0.5',
    xs: 'px-2.5 py-1.5',
    sm: 'px-3 py-2',
    md: 'px-4 py-2',
    lg: 'px-4 py-2',
    xl: 'px-6 py-3'
  },
  leading: {
    spacing: {
      xxs: 'pl-7',
      xs: 'pl-7',
      sm: 'pl-10',
      md: 'pl-10',
      lg: 'pl-10',
      xl: 'pl-10'
    }
  },
  trailing: {
    spacing: {
      xxs: 'pr-7',
      xs: 'pr-7',
      sm: 'pr-10',
      md: 'pr-10',
      lg: 'pr-10',
      xl: 'pr-10'
    }
  },
  appearance: {
    default: 'focus:ring-1 focus:u-ring-gray-900 focus:u-border-gray-900 bg-white dark:bg-gray-900 border u-border-gray-200 rounded-lg shadow-sm focus:ring-offset-white dark:focus:ring-offset-black',
    none: 'border-0 bg-transparent focus:ring-0 focus:shadow-none',
    invert: 'focus:ring-2 focus:u-ring-gray-900 focus:ring-offset-2 bg-gray-900 dark:bg-white u-text-white border u-border-gray-900 rounded-lg shadow-sm focus:ring-offset-white dark:focus:ring-offset-black font-semibold',
    darken: 'focus:ring-1 focus:u-ring-gray-900 focus:u-border-gray-900 u-bg-white border u-border-gray-200 rounded-lg shadow-sm focus:ring-offset-white dark:focus:ring-offset-black'
  },
  icon: {
    base: 'u-text-gray-400',
    loading: 'uil:sync',
    size: {
      xxs: 'h-3 w-3',
      xs: 'h-4 w-4',
      sm: 'h-5 w-5',
      md: 'h-5 w-5',
      lg: 'h-5 w-5',
      xl: 'h-5 w-5'
    },
    leading: {
      wrapper: 'absolute inset-y-0 left-0 flex items-center pointer-events-none',
      spacing: {
        xxs: 'ml-2',
        xs: 'ml-2',
        sm: 'ml-2',
        md: 'ml-3',
        lg: 'ml-3',
        xl: 'ml-3'
      }
    },
    trailing: {
      wrapper: 'absolute inset-y-0 right-0 flex items-center pointer-events-none',
      spacing: {
        xxs: 'mr-2',
        xs: 'mr-2',
        sm: 'mr-2',
        md: 'mr-3',
        lg: 'mr-3',
        xl: 'mr-3'
      }
    }
  }
}

export const uiPreset: any = {
  button: {
    base: 'font-medium focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 focus:ring-offset-white dark:focus:ring-offset-black',
    rounded: 'rounded-lg',
    size: {
      xxs: 'text-xs',
      xs: 'text-xs',
      sm: 'text-sm leading-4',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-base'
    },
    spacing: {
      xxs: 'px-2 py-1',
      xs: 'px-2.5 py-1.5',
      sm: 'px-3 py-2',
      md: 'px-4 py-2',
      lg: 'px-4 py-2',
      xl: 'px-6 py-3'
    },
    square: {
      xxs: 'p-1',
      xs: 'p-1.5',
      sm: 'p-2',
      md: 'p-2',
      lg: 'p-2',
      xl: 'p-3'
    },
    variant: {
      green: 'border border-transparent text-white bg-green-500 hover:bg-green-400 disabled:bg-green-500 focus:ring-2 focus:ring-offset-2 focus:ring-green-400',
      primary: 'border border-transparent u-text-white u-bg-gray-900 hover:u-bg-gray-800 disabled:u-bg-gray-900 focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900',
      secondary: 'border u-border-gray-200 u-text-gray-700 u-bg-white hover:u-bg-gray-50 disabled:u-bg-white focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900',
      white: 'shadow-sm border u-border-gray-300 u-text-gray-700 u-bg-white hover:u-bg-gray-50 disabled:u-bg-white focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
      gray: 'border border-transparent u-text-gray-700 u-bg-gray-100 hover:u-bg-gray-200 disabled:u-bg-gray-100 focus:ring-2 focus:ring-offset-2 focus:u-ring-gray-900',
      black: 'shadow-sm border border-transparent u-text-white u-bg-gray-800 hover:u-bg-gray-900 disabled:u-bg-gray-800 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
      transparent: 'border border-transparent u-text-gray-500 hover:u-text-gray-700 focus:u-text-gray-700 disabled:hover:u-text-gray-500',
      link: 'border border-transparent u-text-gray-900 hover:underline focus:underline',
      'transparent-hover': 'border border-transparent u-text-gray-500 hover:u-text-white focus:u-text-white bg-transparent hover:u-bg-gray-900 focus:u-bg-gray-900 disabled:u-text-gray-500',
      'input-group': 'shadow-sm border u-border-gray-200 u-text-gray-700 u-bg-gray-50 hover:u-bg-gray-100 disabled:u-bg-gray-50 focus:ring-1 focus:u-ring-gray-900 focus:u-border-gray-900',
      'primary-gradient': 'relative text-white gradient-border-2 border-gradient-br-gradient-gray-900 hover:border-gradient-br-gradient-black before:absolute before:transition before:duration-200 before:rounded-lg before:opacity-0 hover:before:opacity-75 before:-inset-0.5 before:bg-gradient-to-r before:from-green-400 before:via-teal-400 before:to-teal-600 before:blur-md before:z-[-1]'
    },
    icon: {
      base: 'flex-shrink-0',
      loading: 'uil:sync',
      size: {
        xxs: 'h-3.5 w-3.5',
        xs: 'h-4 w-4',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-5 w-5',
        xl: 'h-5 w-5'
      },
      leading: {
        spacing: {
          xxs: '-ml-0.5 mr-1',
          xs: '-ml-0.5 mr-1.5',
          sm: '-ml-0.5 mr-2',
          md: '-ml-1 mr-2',
          lg: '-ml-1 mr-3',
          xl: '-ml-1 mr-3'
        }
      },
      trailing: {
        spacing: {
          xxs: 'ml-1 -mr-0.5',
          xs: 'ml-1.5 -mr-0.5',
          sm: 'ml-2 -mr-0.5',
          md: 'ml-2 -mr-1',
          lg: 'ml-3 -mr-1',
          xl: 'ml-3 -mr-1'
        }
      }
    }
  },

  badge: {
    base: 'inline-flex items-center font-medium',
    size: {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-0.5',
      lg: 'text-sm px-3 py-0.5',
      xl: 'text-sm px-4 py-1'
    },
    variant: {
      green: 'bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-100',
      red: 'bg-red-100 dark:bg-red-700 text-red-800 dark:text-red-100',
      primary: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100',
      secondary: 'u-bg-white u-text-gray-700'
    }
  },

  formGroup: {
    wrapper: '',
    label: 'block text-sm font-medium u-text-gray-700',
    labelWrapper: 'flex content-center justify-between',
    container: 'mt-1 relative',
    required: 'text-red-400',
    description: 'text-sm leading-5 u-text-gray-500',
    hint: 'text-sm leading-5 u-text-gray-500',
    help: 'mt-2 text-sm u-text-gray-500'
  },

  input: {
    ...inputPreset
  },

  textarea: {
    ...inputPreset
  },

  select: {
    ...inputPreset
  },

  selectCustom: {
    ...inputPreset,
    wrapper: 'relative',
    base: `${inputPreset.base} text-left cursor-default`,
    icon: {
      name: 'uil:angle-down',
      ...inputPreset.icon
    },
    list: {
      container: 'z-20',
      width: 'w-full',
      base: 'u-bg-white shadow-lg rounded-md ring-1 u-ring-gray-200 border border-transparent overflow-y-auto p-1 max-h-60',
      input: 'relative block w-full focus:ring-transparent text-sm px-4 py-2 u-text-gray-700 border-l-0 u-bg-white border-t-0 border-r-0 u-border-gray-200 focus:u-border-gray-200',
      option: {
        base: 'cursor-default select-none relative py-1.5 pl-2 pr-8 rounded-md text-sm',
        active: 'u-text-gray-900 bg-gray-100 dark:bg-gray-900',
        inactive: 'u-text-gray-900',
        container: 'flex items-center gap-3',
        selected: 'font-semibold',
        unselected: 'font-normal',
        disabled: 'cursor-not-allowed opacity-50',
        empty: 'text-sm u-text-gray-400 px-4 py-2',
        icon: {
          name: 'uil:check',
          base: 'absolute inset-y-0 right-0 flex items-center pr-2',
          active: '',
          inactive: '',
          size: 'h-4 w-4'
        }
      },
      transition: {
        leaveActiveClass: 'transition ease-in duration-100',
        leaveFromClass: 'opacity-100',
        leaveToClass: 'opacity-0'
      }
    },
    popperOptions: {
      placement: 'bottom-end'
    }
  },

  radio: {
    ...radio
  },

  checkbox: {
    wrapper: 'relative flex items-start',
    base: 'h-4 w-4 text-primary-600 focus:ring-2 focus:ring-offset-2 u-bg-white dark:checked:bg-current dark:checked:border-transparent focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-black u-border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed',
    label: 'font-medium u-text-gray-700',
    required: 'text-red-400',
    help: 'u-text-gray-500',
    rounded: `${radio.base} rounded`
  },

  card: {
    base: 'overflow-hidden',
    background: 'bg-white dark:bg-gray-900',
    border: 'u-border-gray-200',
    ring: 'ring-1 u-ring-gray-200',
    rounded: 'rounded-xl',
    shadow: 'shadow',
    body: 'px-4 py-5 sm:p-6',
    header: 'px-4 py-5 sm:px-6',
    footer: 'px-4 py-4 sm:px-6'
  },

  modal: {
    wrapper: 'relative z-50',
    inner: 'fixed inset-0 overflow-y-auto',
    container: 'flex min-h-full items-end sm:items-center justify-center p-4 sm:p-0 text-center',
    base: 'relative inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle w-full',
    background: 'u-bg-white',
    overlay: {
      background: 'bg-gray-500/75 dark:bg-gray-600/75',
      transition: {
        enter: 'ease-out duration-300',
        enterFrom: 'opacity-0',
        enterTo: 'opacity-100',
        leave: 'ease-in duration-200',
        leaveFrom: 'opacity-100',
        leaveTo: 'opacity-0'
      }
    },
    border: '',
    ring: '',
    rounded: 'rounded-lg',
    shadow: 'shadow-xl',
    width: 'sm:max-w-lg',
    transition: {
      enter: 'ease-out duration-300',
      enterFrom: 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95',
      enterTo: 'opacity-100 translate-y-0 sm:scale-100',
      leave: 'ease-in duration-200',
      leaveFrom: 'opacity-100 translate-y-0 sm:scale-100',
      leaveTo: 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
    }
  },

  container: {
    constrained: 'max-w-7xl'
  },

  toggle: {
    base: 'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-black',
    active: 'bg-primary-600',
    inactive: 'u-bg-gray-200',
    container: {
      base: 'pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200',
      active: 'translate-x-5',
      inactive: 'translate-x-0'
    },
    icon: {
      base: 'absolute inset-0 h-full w-full flex items-center justify-center transition-opacity',
      active: 'opacity-100 ease-in duration-200',
      inactive: 'opacity-0 ease-out duration-100',
      on: 'h-3 w-3 text-primary-600',
      off: 'h-3 w-3 u-text-gray-400'
    }
  },

  verticalNavigation: {
    wrapper: 'space-y-1',
    base: 'group flex items-center text-sm font-medium rounded-md w-full relative',
    spacing: 'px-3 py-2',
    active: 'u-text-gray-900 u-bg-gray-100',
    inactive: 'u-text-gray-600 hover:u-text-gray-900 hover:u-bg-gray-50 focus:u-bg-gray-50',
    icon: {
      base: 'flex-shrink-0 h-6 w-6',
      spacing: '-ml-1 mr-3',
      active: 'u-text-gray-500',
      inactive: 'u-text-gray-400 group-hover:u-text-gray-500'
    },
    avatar: {
      base: 'flex-shrink-0',
      spacing: '-ml-1 mr-3'
    },
    badge: {
      base: 'ml-auto inline-block py-0.5 px-3 text-xs rounded-full',
      active: 'u-bg-white',
      inactive: 'u-bg-gray-100 u-text-gray-600 group-hover:u-bg-gray-200'
    }
  },

  alertDialog: {
    icon: {
      wrapper: 'h-12 w-12 sm:h-10 sm:w-10 bg-primary-100',
      base: 'text-primary-600'
    },
    title: 'text-lg leading-6 font-medium text-gray-900',
    description: 'text-sm text-gray-500'
  },

  dropdown: {
    wrapper: 'relative inline-flex text-left',
    container: 'z-20',
    width: 'w-48',
    base: 'u-bg-white divide-y u-divide-gray-100 rounded-md ring-1 u-ring-gray-200 shadow-lg focus:outline-none',
    group: 'py-1',
    item: {
      base: 'group flex items-center gap-3 px-4 py-2 text-sm w-full',
      active: 'u-bg-gray-100 u-text-gray-900',
      inactive: 'u-text-gray-700',
      disabled: 'cursor-not-allowed opacity-50',
      icon: 'h-5 w-5 u-text-gray-400 group-hover:u-text-gray-500 flex-shrink-0',
      avatar: '-m-0.5 group-hover:u-bg-gray-200 flex-shrink-0',
      shortcuts: 'flex-shrink-0 text-xs font-semibold u-text-gray-500 ml-auto'
    },
    transition: {
      enterActiveClass: 'transition duration-100 ease-out',
      enterFromClass: 'transform scale-95 opacity-0',
      enterToClass: 'transform scale-100 opacity-100',
      leaveActiveClass: 'transition duration-75 ease-out',
      leaveFromClass: 'transform scale-100 opacity-100',
      leaveToClass: 'transform scale-95 opacity-0'
    },
    popperOptions: {
      placement: 'bottom-end',
      strategy: 'fixed'
    }
  },

  tabs: {
    wrapper: 'flex items-center gap-8',
    base: 'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm',
    active: 'border-primary-500 text-primary-600',
    inactive: 'border-transparent u-text-gray-500 hover:u-text-gray-700 hover:u-border-gray-300'
  },

  pills: {
    wrapper: 'flex items-center gap-4',
    base: 'px-3 py-2 font-medium text-sm rounded-md',
    active: 'u-bg-gray-100 u-text-gray-700',
    inactive: 'u-text-gray-500 hover:u-text-gray-700'
  },

  avatar: {
    wrapper: 'relative inline-flex items-center justify-center',
    background: 'u-bg-gray-100',
    rounded: 'rounded-md',
    placeholder: 'text-xs font-medium leading-none u-text-black truncate',
    size: {
      xxxs: 'h-4 w-4 text-xs',
      xxs: 'h-5 w-5 text-xs',
      xs: 'h-6 w-6 text-xs',
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-md',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-14 w-14 text-xl',
      '2xl': 'h-16 w-16 text-2xl',
      '3xl': 'h-20 w-20 text-3xl'
    }
  },

  avatarGroup: {
    ring: 'ring-2 u-ring-white',
    margin: '-mr-1.5 first:mr-0'
  },

  slideover: {
    wrapper: 'fixed inset-0 flex z-40',
    overlay: {
      background: 'bg-gray-500/75 dark:bg-gray-600/75',
      transition: {
        enter: 'ease-in-out duration-500',
        enterFrom: 'opacity-0',
        enterTo: 'opacity-100',
        leave: 'ease-in-out duration-500',
        leaveFrom: 'opacity-100',
        leaveTo: 'opacity-0'
      }
    },
    base: 'relative flex-1 flex flex-col w-full focus:outline-none',
    background: 'u-bg-white',
    width: 'max-w-md',
    header: 'flex items-center justify-between flex-shrink-0 px-4 sm:px-6 h-16 border-b u-border-gray-200',
    transition: {
      enter: 'transform transition ease-in-out duration-500 sm:duration-700',
      leave: 'transform transition ease-in-out duration-500 sm:duration-700'
    }
  },

  notification: {
    background: 'u-bg-white',
    shadow: 'shadow-lg',
    rounded: 'rounded-lg',
    ring: 'ring-1 u-ring-gray-200',
    type: {
      info: 'heroicons-outline:information-circle',
      success: 'heroicons-outline:check-circle',
      warning: 'heroicons-outline:exclamation-circle',
      error: 'heroicons-outline:x-circle'
    },
    icon: {
      base: 'w-6 h-6',
      color: {
        warning: 'text-orange-400',
        info: 'text-blue-400',
        success: 'text-green-400',
        error: 'text-red-400'
      }
    },
    transition: {
      enterActiveClass: 'transform ease-out duration-300 transition',
      enterFromClass: 'translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2',
      enterToClass: 'translate-y-0 opacity-100 sm:translate-x-0',
      leaveActiveClass: 'transition ease-in duration-100',
      leaveFromClass: 'opacity-100',
      leaveToClass: 'opacity-0'
    }
  },

  tooltip: {
    wrapper: 'relative inline-flex',
    container: 'z-20',
    width: 'max-w-xs',
    background: 'u-bg-white',
    shadow: 'shadow',
    rounded: 'rounded',
    ring: 'ring-1 u-ring-gray-200',
    base: 'invisible lg:visible h-6 px-2 py-1 text-xs font-normal',
    transition: {
      enterActiveClass: 'transition ease-out duration-200',
      enterFromClass: 'opacity-0 translate-y-1',
      enterToClass: 'opacity-100 translate-y-0',
      leaveActiveClass: 'transition ease-in duration-150',
      leaveFromClass: 'opacity-100 translate-y-0',
      leaveToClass: 'opacity-0 translate-y-1'
    },
    popperOptions: {
      strategy: 'fixed'
    }
  },

  popover: {
    wrapper: 'relative',
    container: 'z-20',
    width: '',
    base: '',
    transition: {
      enterActiveClass: 'transition ease-out duration-200',
      enterFromClass: 'opacity-0 translate-y-1',
      enterToClass: 'opacity-100 translate-y-0',
      leaveActiveClass: 'transition ease-in duration-150',
      leaveFromClass: 'opacity-100 translate-y-0',
      leaveToClass: 'opacity-0 translate-y-1'
    },
    popperOptions: {
      strategy: 'fixed'
    }
  },

  contextMenu: {
    wrapper: 'relative',
    container: 'z-20',
    width: '',
    base: '',
    transition: {
      enterActiveClass: 'transition ease-out duration-200',
      enterFromClass: 'opacity-0 translate-y-1',
      enterToClass: 'opacity-100 translate-y-0',
      leaveActiveClass: 'transition ease-in duration-150',
      leaveFromClass: 'opacity-100 translate-y-0',
      leaveToClass: 'opacity-0 translate-y-1'
    },
    popperOptions: {
      placement: 'bottom-start',
      scroll: false
    }
  }
}
