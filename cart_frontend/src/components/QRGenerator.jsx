export default function QRGenerator({ value }) {
  return (
    <section>
      <h2>QR Generator</h2>
      <p>{value ? `Value: ${value}` : 'No value provided.'}</p>
      <div aria-label="QR placeholder">(QR preview placeholder)</div>
    </section>
  )
}
