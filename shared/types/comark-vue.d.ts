import type { Node } from 'comark'

/**
 * Stop Vue unwrapping comark AST nodes.
 *
 * comark's `Node` is a recursive variadic tuple (`[tag, attrs, ...Node[]]`). Vue's `UnwrapRefSimple`
 * maps over tuples element by element, so any type holding nodes explodes past TypeScript's
 * instantiation depth (TS2589) the moment it enters a `ref`/`computed` — which is every page that
 * fetches a document.
 *
 * `RefUnwrapBailTypes` is Vue's documented extension point for this: nodes are plain data and are
 * never mutated through reactivity, so there is nothing to unwrap.
 */
declare module '@vue/reactivity' {
  export interface RefUnwrapBailTypes {
    comarkBailTypes: Node
  }
}
