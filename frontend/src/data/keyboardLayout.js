export const ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],
]

const GROUPS = [
  ['Left', 'Pinky', 'qaz1'],
  ['Left', 'Ring', 'wsx2'],
  ['Left', 'Middle', 'edc3'],
  ['Left', 'Index', 'rfvtgb45'],
  ['Right', 'Index', 'yhnujm67'],
  ['Right', 'Middle', 'ik,8'],
  ['Right', 'Ring', 'ol.9'],
  ['Right', 'Pinky', 'p;/0'],
]

const FINGER_OF = {}
GROUPS.forEach(([hand, finger, keys]) => {
  for (const k of keys) FINGER_OF[k] = { hand, finger }
})

const SHIFTED = { '!': '1', '?': '/', ':': ';', '<': ',', '>': '.' }

// Ek character ke liye: kaunsi key, shift chahiye ya nahi, kaunsa haath/ungli
export function describeChar(ch) {
  if (!ch) return null
  if (ch === ' ') return { key: ' ', shift: false, hand: 'Both', finger: 'Thumb', shiftHand: null }
  let key = ch
  let shift = false
  if (SHIFTED[ch]) {
    key = SHIFTED[ch]
    shift = true
  } else if (ch !== ch.toLowerCase()) {
    key = ch.toLowerCase()
    shift = true
  }
  const f = FINGER_OF[key]
  if (!f) return null
  return {
    key,
    shift,
    hand: f.hand,
    finger: f.finger,
    shiftHand: shift ? (f.hand === 'Left' ? 'Right' : 'Left') : null,
  }
}