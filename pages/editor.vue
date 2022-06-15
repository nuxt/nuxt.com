<template>
  <div>
    <ProjectContentFileEditor :content="content" />
  </div>
</template>

<script setup>
const content = {
  key: '',
  markdown: '```vue\n<template>\nTest\n</template>\n```',
  matter: {}
}
</script>
