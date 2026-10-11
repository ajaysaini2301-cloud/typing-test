import { describeChar } from '../../data/keyboardLayout'

export default function FingerGuide({ char }) {
  const info = describeChar(char)
  const label = char === ' ' ? 'Space' : char
  return (
    <div className="fg-root" aria-live="polite">
      <style>{`
        .fg-root { background: #eaf0ff; color: #1e3a8a; border-radius: 12px; padding: 12px 16px; font-size: 14px; min-height: 48px; }
        .fg-root b { color: #1d4ed8; }
      `}</style>
      {info ? (
        <>
          Press <b>{label}</b> with your <b>{info.hand} {info.finger}</b> finger
          {info.shift && <> while holding <b>{info.shiftHand} Shift</b></>}.
        </>
      ) : (
        <>Is character ke liye finger guide abhi available nahi hai.</>
      )}
    </div>
  )
}