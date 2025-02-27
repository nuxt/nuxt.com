<script setup lang="ts">
const carbonads = ref(null)

onMounted(() => {
  if (carbonads.value) {
    const script = document.createElement('script')
    script.setAttribute('type', 'text/javascript')
    script.setAttribute('src', 'https://cdn.carbonads.com/carbon.js?serve=CWYD553E&placement=nuxtcom')
    script.setAttribute('id', '_carbonads_js')
    carbonads.value.appendChild(script)
  }
})
</script>

<template>
  <div ref="carbonads" class="Carbon border border-(--ui-border) rounded-lg" />
</template>

<style lang="postcss">
.Carbon {
  min-height: 220px;
  .carbon-text {
    @apply text-(--ui-text-muted);

    &:hover {
      @apply text-(--ui-text-muted)/70;
    }
  }
}

.Carbon {
  @apply p-3 flex flex-col max-w-full;

  @screen sm {
    @apply max-w-xs;
  }

  @screen lg {
    @apply mt-0;
  }

  #carbonads span {
    @apply flex flex-col justify-between;

    .carbon-wrap {
      @apply flex flex-col;

      flex: 1;

      @media (min-width: 320px) {
        @apply flex-row;
      }

      @screen lg {
        @apply flex-col;
      }

      .carbon-img {
        @apply flex items-start justify-center mb-4;

        @media (min-width: 320px) {
          @apply mb-0;
        }

        @screen lg {
          @apply mb-4;
        }
      }

      .carbon-text {
        @apply flex-1 text-sm w-full m-0 text-left block;

        &:hover {
          @apply no-underline;
        }

        @media (min-width: 320px) {
          @apply ml-4;
        }

        @screen lg {
          @apply ml-0;
        }
      }
    }
  }

  img {
    @apply w-full;
  }

  & .carbon-poweredby {
    @apply ml-2 text-xs text-right text-(--ui-text-muted) block pt-2;

    &:hover {
      @apply no-underline text-(--ui-text-muted)/70;
    }
  }
}
</style>
