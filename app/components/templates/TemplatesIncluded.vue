<script setup lang="ts">
import type { Template, TemplateHealth } from '#shared/types'

const props = defineProps<{
  template: Template
  health?: TemplateHealth
}>()

const { copy, copied } = useClipboard()
const { track } = useAnalytics()

const modules = computed(() => templateModules(props.template, props.health))
const env = computed(() => props.template.deploy?.env ?? [])
const packageManager = computed(() => templatePackageManager(props.template, props.health))
const category = computed(() => TEMPLATE_CATEGORIES.find(item => item.value === props.template.category))

const details = computed(() => [
  { label: 'Nuxt', value: props.health?.check?.nuxt || props.health?.nuxt, mono: true },
  { label: 'Package manager', value: packageManager.value, icon: packageManager.value && PACKAGE_MANAGER_ICONS[packageManager.value] },
  { label: 'Category', value: category.value?.label, icon: category.value?.icon }
].filter(item => item.value))

function copyEnv() {
  copy(env.value.map(key => `${key}=`).join('\n'))
  track('Template Action', { template: props.template.name, action: 'Copy Env' })
}
</script>

<template>
  <section v-if="modules.length || env.length || details.length" class="grid lg:grid-cols-3 gap-x-8 gap-y-10">
    <div v-if="modules.length" class="lg:col-span-2 flex flex-col gap-4">
      <h2 class="flex items-center gap-2 text-sm font-medium text-highlighted">
        Included modules
        <span class="font-mono text-xs text-dimmed tabular-nums">{{ modules.length }}</span>
      </h2>
      <ul class="grid sm:grid-cols-2 gap-2">
        <li v-for="module in modules" :key="module.npm">
          <ULink
            :to="module.name ? `/modules/${module.name}` : `https://npmx.dev/package/${module.npm}`"
            :target="module.name ? undefined : '_blank'"
            class="group h-full flex items-start gap-3 rounded-lg p-3 ring ring-default bg-elevated/25 transition-[background-color,box-shadow] duration-150 hover:bg-elevated/60 hover:ring-accented focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span class="size-9 shrink-0 flex items-center justify-center rounded-md bg-default ring ring-default">
              <img v-if="module.icon" :src="moduleImage(module.icon)" alt="" loading="lazy" class="size-5 object-contain">
              <UIcon v-else name="i-lucide-puzzle" class="size-4 text-muted" />
            </span>
            <span class="min-w-0 flex-1 flex flex-col gap-0.5">
              <span class="flex items-center gap-1.5 text-sm font-medium text-highlighted">
                <span class="truncate">{{ moduleLabel(module.npm) }}</span>
                <UIcon name="i-lucide-arrow-up-right" class="size-3.5 shrink-0 text-dimmed opacity-0 -translate-x-0.5 transition duration-150 group-hover:opacity-100 group-hover:translate-x-0" />
              </span>
              <span v-if="module.description" class="text-xs text-muted line-clamp-2 text-pretty">{{ module.description }}</span>
              <span v-else class="font-mono text-xs text-dimmed truncate">{{ module.npm }}</span>
            </span>
          </ULink>
        </li>
      </ul>
    </div>

    <div class="flex flex-col gap-6" :class="!modules.length && 'lg:col-span-3 sm:grid sm:grid-cols-2 lg:grid-cols-3'">
      <div v-if="details.length" class="flex flex-col gap-4">
        <h2 class="text-sm font-medium text-highlighted">
          Details
        </h2>
        <dl class="rounded-lg ring ring-default bg-elevated/25 divide-y divide-default text-sm">
          <div v-for="item in details" :key="item.label" class="px-3.5 py-2.5 flex items-center justify-between gap-4">
            <dt class="text-muted">
              {{ item.label }}
            </dt>
            <dd class="min-w-0 flex items-center gap-1.5 font-medium text-highlighted" :class="item.mono && 'font-mono text-xs'">
              <UIcon v-if="item.icon" :name="item.icon" class="size-4 shrink-0" />
              <span class="truncate">{{ item.value }}</span>
            </dd>
          </div>
        </dl>
      </div>

      <div v-if="env.length" class="flex flex-col gap-4">
        <h2 class="flex items-center gap-2 text-sm font-medium text-highlighted">
          Environment variables
          <span class="font-mono text-xs text-dimmed tabular-nums">{{ env.length }}</span>
        </h2>
        <div class="rounded-lg ring ring-default bg-muted overflow-hidden">
          <div class="h-9 ps-3.5 pe-1.5 flex items-center justify-between border-b border-default">
            <span class="font-mono text-xs text-muted">.env</span>
            <UButton
              :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
              :color="copied ? 'primary' : 'neutral'"
              variant="ghost"
              size="xs"
              :aria-label="copied ? 'Copied' : 'Copy environment variables'"
              @click="copyEnv"
            />
          </div>
          <pre class="px-3.5 py-3 font-mono text-xs leading-6 overflow-x-auto"><code><span v-for="key in env" :key="key" class="block"><span class="text-highlighted">{{ key }}</span><span class="text-dimmed">=</span></span></code></pre>
        </div>
        <p class="text-xs text-muted text-pretty">
          Set them in <code class="font-mono">.env</code> to run it locally.
        </p>
      </div>
    </div>
  </section>
</template>
