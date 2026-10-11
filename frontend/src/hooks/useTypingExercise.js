import { useReducer, useEffect, useRef } from 'react'

function init(key) {
  return { typed: '', errors: 0, total: 0, key }
}

function reducer(s, a) {
  switch (a.type) {
    case 'reset':
      return init(a.key)
    case 'char': {
      if (a.key !== s.key || s.typed.length >= a.target.length) return s
      const wrong = a.ch !== a.target[s.typed.length]
      return { ...s, typed: s.typed + a.ch, errors: s.errors + (wrong ? 1 : 0), total: s.total + 1 }
    }
    case 'back':
      return s.typed ? { ...s, typed: s.typed.slice(0, -1) } : s
    default:
      return s
  }
}

export default function useTypingExercise({ target, active, resetKey, onDone }) {
  const [state, dispatch] = useReducer(reducer, resetKey, init)
  const startRef = useRef(null)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    dispatch({ type: 'reset', key: resetKey })
    startRef.current = null
    doneRef.current = false
  }, [resetKey])

  useEffect(() => {
    if (!active) return
    function onKey(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Backspace') {
        e.preventDefault()
        dispatch({ type: 'back' })
        return
      }
      if (e.key.length === 1) {
        e.preventDefault() // space se page scroll na ho
        if (startRef.current === null) startRef.current = performance.now()
        dispatch({ type: 'char', ch: e.key, target, key: resetKey })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, target, resetKey])

  useEffect(() => {
    if (!active || doneRef.current || state.key !== resetKey) return
    if (target.length > 0 && state.typed.length === target.length) {
      doneRef.current = true
      const ms = startRef.current === null ? 1000 : Math.max(1000, performance.now() - startRef.current)
      onDoneRef.current({ typed: state.typed, errors: state.errors, total: state.total, ms })
    }
  }, [state, active, target, resetKey])

  return state
}