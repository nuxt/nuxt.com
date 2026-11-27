<template>
  <!--
    Wraps a one-line terminal block: the command types itself out once (about 1.6s), then a cursor blinks.
    With reduced motion, the full command shows with a static cursor.
  -->
  <div class="agents-typed *:my-0">
    <slot />
  </div>
</template>

<style>
.agents-typed pre code {
  position: relative;
  display: inline-block;
}

.agents-typed pre code::before {
  content: '$ ';
  color: var(--ui-text-dimmed);
  user-select: none;
}

.agents-typed pre code::after {
  content: '';
  display: inline-block;
  width: 8px;
  height: 1.1em;
  margin-left: 4px;
  vertical-align: -0.2em;
  background: var(--ui-text-highlighted);
}

@media (prefers-reduced-motion: no-preference) {
  .agents-typed pre code {
    clip-path: inset(0 100% 0 0);
    animation: agents-typed-reveal 1.6s steps(40, end) 0.4s forwards;
  }

  .agents-typed pre code::after {
    animation: agents-typed-blink 1.1s step-end 2s infinite;
  }
}

@keyframes agents-typed-reveal {
  to {
    clip-path: inset(0 0 0 0);
  }
}

@keyframes agents-typed-blink {
  50% {
    opacity: 0;
  }
}
</style>
