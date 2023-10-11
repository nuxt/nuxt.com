export default defineAppConfig({
  ui: {
    primary: 'green',
    gray: 'slate',
    avatar: {
      default: {
        icon: 'i-ph-image'
      }
    },
    button: {
      color: {
        white: {
          link: 'text-gray-700 dark:text-gray-200 hover:text-primary-500 dark:hover:text-primary-400 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400'
        },
        gray: {
          link: 'text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400'
        }
      },
      default: {
        loadingIcon: 'i-ph-spinner'
      }
    },
    input: {
      default: {
        loadingIcon: 'i-ph-spinner'
      }
    },
    select: {
      default: {
        loadingIcon: 'i-ph-spinner',
        trailingIcon: 'i-ph-caret-down'
      }
    },
    selectMenu: {
      default: {
        selectedIcon: 'i-ph-check'
      }
    },
    notification: {
      default: {
        closeButton: {
          icon: 'i-ph-x'
        }
      }
    },
    commandPalette: {
      default: {
        icon: 'i-ph-magnifying-glass-duotone',
        loadingIcon: 'i-ph-spinner',
        selectedIcon: 'i-ph-check',
        emptyState: {
          icon: 'i-ph-magnifying-glass-duotone'
        }
      }
    },
    table: {
      default: {
        sortAscIcon: 'i-ph-sort-ascending',
        sortDescIcon: 'i-ph-sort-descending',
        sortButton: {
          icon: 'i-ph-list'
        },
        loadingState: {
          icon: 'i-ph-spinner'
        },
        emptyState: {
          icon: 'i-ph-database'
        }
      }
    },
    pagination: {
      default: {
        prevButton: {
          icon: 'i-ph-arrow-left'
        },
        nextButton: {
          icon: 'i-ph-arrow-right'
        }
      }
    },
    card: {
      rounded: 'rounded-xl'
    },
    tooltip: {
      background: 'bg-background'
    },
    // `@nuxt/ui-pro` specific
    variables: {
      dark: {
        background: 'var(--color-gray-950)'
      },
      header: {
        height: '5rem'
      }
    },
    aside: {
      links: {
        externalIcon: {
          name: 'i-ph-arrow-up-right'
        }
      }
    },
    header: {
      wrapper: 'lg:mb-0 lg:border-0',
      links: {
        trailingIcon: {
          name: 'i-ph-caret-down',
          base: 'w-4 h-4'
        },
        externalIcon: {
          name: 'i-ph-arrow-up-right'
        }
      },
      popover: {
        links: {
          active: 'dark:bg-gray-950/50',
          inactive: 'dark:hover:bg-gray-950/50',
          externalIcon: {
            name: 'i-ph-arrow-up-right'
          }
        }
      },
      button: {
        icon: {
          open: 'i-ph-list',
          close: 'i-ph-x'
        }
      }
    },
    footer: {
      columns: {
        externalIcon: {
          name: 'i-ph-arrow-up-right'
        }
      },
      links: {
        externalIcon: {
          name: 'i-ph-arrow-up-right'
        }
      }
    },
    navigation: {
      accordion: {
        button: {
          trailingIcon: {
            name: 'i-ph-caret-down',
            base: 'w-4 h-4'
          }
        }
      }
    },
    page: {
      links: {
        externalIcon: {
          name: 'i-ph-arrow-up-right'
        }
      },
      card: {
        to: 'dark:hover:bg-gray-900/50'
      }
    },
    docs: {
      toc: {
        button: {
          trailingIcon: {
            name: 'i-ph-caret-down',
            base: 'w-4 h-4'
          }
        }
      },
      search: {
        button: {
          icon: 'i-ph-magnifying-glass-duotone'
        }
      },
      surround: {
        icon: {
          prev: 'i-ph-arrow-left',
          next: 'i-ph-arrow-right'
        }
      }
    },
    colorMode: {
      button: {
        icon: {
          dark: 'i-ph-moon-duotone',
          light: 'i-ph-sun-duotone'
        }
      }
    },
    content: {
      callout: {
        externalIcon: {
          name: 'i-ph-arrow-up-right'
        }
      },
      collapsible: {
        button: {
          icon: {
            name: 'i-ph-caret-right',
            base: 'w-3 h-3'
          }
        }
      },
      prose: {
        h1: {
          icon: {
            name: 'i-ph-hash-duotone'
          }
        },
        h2: {
          icon: {
            name: 'i-ph-hash-duotone'
          }
        },
        h3: {
          icon: {
            name: 'i-ph-hash-duotone'
          }
        },
        h4: {
          icon: {
            name: 'i-ph-hash-duotone'
          }
        },
        code: {
          button: {
            icon: {
              copy: 'i-ph-copy-duotone',
              copied: 'i-ph-copy-duotone'
            }
          },
          icon: {
            terminal: 'i-ph-terminal-window-duotone'
          }
        }
      }
    }
  }
})
