import { useState } from 'react'

export default function BarcodeScanner({ onDetected }) {
  const [lastValue, setLastValue] = useState('')

  function simulateScan() {
    const simulated = String(Date.now())
    setLastValue(simulated)
    onDetected?.(simulated)
  }

  return (
    <section>
      <h2>Barcode Scanner</h2>
      <button type="button" onClick={simulateScan}>
        Simulate scan
      </button>
      {lastValue ? <p>Last: {lastValue}</p> : <p>No scans yet.</p>}
    </section>
  )
}
