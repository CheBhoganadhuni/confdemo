import { useEffect, useRef } from 'react'

// ── Module-level handler stack ────────────────────────────────────────────────
// All open overlays register here. Only the LAST (deepest) entry handles each
// back-swipe. Single global popstate listener — no per-hook race conditions.

const stack: { id: number; fn: () => void }[] = []
let nextId = 0
let listening = false

// When the hook closes via a UI button it calls history.back() itself to clean
// up the entry it pushed. That triggers a popstate which must NOT be forwarded
// to the next handler in the stack (it's a synthetic, not a real back-swipe).
let syntheticBacks = 0

function onPopState() {
  if (syntheticBacks > 0) {
    syntheticBacks--
    return
  }
  const top = stack[stack.length - 1]
  if (top) top.fn()
}

function startListening() {
  if (!listening) {
    listening = true
    window.addEventListener('popstate', onPopState)
  }
}

function stopListening() {
  if (stack.length === 0 && listening) {
    listening = false
    window.removeEventListener('popstate', onPopState)
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────
/**
 * Pushes a history entry when `isOpen` becomes true so the browser's back
 * gesture steps through UI layers instead of navigating to the previous URL.
 *
 * Multiple concurrent usages are safe: a global stack ensures only the deepest
 * open layer handles each back-swipe — no double-fire across nested components.
 */
export function useBackButtonClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // true once popstate consumed this entry (so cleanup skips history.back)
  const consumedRef = useRef(false)
  const idRef = useRef<number | null>(null)
  // remember the URL when we pushed so we can detect real navigations
  const hrefAtOpenRef = useRef<string>('')

  useEffect(() => {
    if (!isOpen) return

    // Push a fake history entry so the swipe has somewhere to land
    window.history.pushState({ _backClose: true }, '')
    hrefAtOpenRef.current = window.location.href

    const id = nextId++
    idRef.current = id
    consumedRef.current = false

    stack.push({
      id,
      fn: () => {
        consumedRef.current = true
        onCloseRef.current()
      },
    })
    startListening()

    return () => {
      // Remove this layer from the stack
      const idx = stack.findIndex(e => e.id === id)
      if (idx !== -1) stack.splice(idx, 1)
      stopListening()

      // Closed via UI action (not back-swipe) — pop the entry we pushed.
      // BUT: if the user navigated to a new page (href changed), Next.js
      // already pushed its own history entry. Calling history.back() here
      // would undo that navigation. Skip it — the pushed entry is gone.
      if (!consumedRef.current && window.location.href === hrefAtOpenRef.current) {
        syntheticBacks++
        window.history.back()
      }
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps
}
