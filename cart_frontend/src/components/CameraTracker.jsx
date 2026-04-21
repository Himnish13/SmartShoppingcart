import { useEffect, useRef } from 'react'

export default function CameraTracker() {
  const videoRef = useRef(null)

  useEffect(() => {
    let stream

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch {
        // Placeholder: ignore failures (permission blocked/unavailable)
      }
    }

    if (
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices?.getUserMedia
    ) {
      start()
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  return (
    <section>
      <h2>Camera Tracker</h2>
      <p>Camera preview (permission required).</p>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ maxWidth: '100%' }}
      />
    </section>
  )
}
