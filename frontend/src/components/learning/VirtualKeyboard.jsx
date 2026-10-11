import { ROWS, describeChar } from '../../data/keyboardLayout'

export default function VirtualKeyboard({ highlightChar }) {
  const info = describeChar(highlightChar)
  const keyOn = (k) => info && info.key === k
  const shiftOn = (side) => info && info.shift && info.shiftHand === side

  return (
    <div className="vk-root" role="img" aria-label="On-screen keyboard">
      <style>{`
        .vk-root { background: #f1f3ff; border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
        .vk-row { display: flex; gap: 6px; }
        .vk-key { min-width: 38px; height: 38px; border-radius: 8px; background: #fff; border: 1px solid #d8dcf0; display: grid; place-items: center; font-size: 14px; font-weight: 600; color: #334155; text-transform: uppercase; padding: 0 6px; }
        .vk-key.on { background: #3b6cf6; border-color: #3b6cf6; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 10px rgba(59,108,246,0.4); }
        .vk-wide { min-width: 70px; }
        .vk-space { min-width: 260px; }
        @media (max-width: 800px) { .vk-key { min-width: 26px; height: 30px; font-size: 12px; } .vk-wide { min-width: 44px; } .vk-space { min-width: 150px; } }
      `}</style>
      {ROWS.map((row, i) => (
        <div className="vk-row" key={i}>
          {i === 3 && <div className={`vk-key vk-wide ${shiftOn('Left') ? 'on' : ''}`}>Shift</div>}
          {row.map((k) => (
            <div key={k} className={`vk-key ${keyOn(k) ? 'on' : ''}`}>{k}</div>
          ))}
          {i === 3 && <div className={`vk-key vk-wide ${shiftOn('Right') ? 'on' : ''}`}>Shift</div>}
        </div>
      ))}
      <div className="vk-row">
        <div className={`vk-key vk-space ${keyOn(' ') ? 'on' : ''}`}>Space</div>
      </div>
    </div>
  )
}