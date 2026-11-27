/**
 * Whether the `/agents` visuals may animate.
 *
 * `false` on the server and until mount, so the static final state is what renders first,
 * then `true` once mounted unless the visitor asked for reduced motion.
 */
export function useAgentsMotion() {
  const reducedMotion = usePreferredReducedMotion()
  const mounted = useMounted()

  return computed(() => mounted.value && reducedMotion.value !== 'reduce')
}
