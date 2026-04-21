export default function Navbar({ title = 'Smart Shopping Cart', children }) {
  return (
    <header>
      <nav aria-label="Primary">
        <strong>{title}</strong>
        {children}
      </nav>
    </header>
  )
}
