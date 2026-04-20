export default function ProductCard({ product }) {
  if (!product) {
    return (
      <article>
        <h3>Product</h3>
        <p>No product provided.</p>
      </article>
    )
  }

  const name = product.name ?? product.title ?? 'Unnamed product'
  const price = product.price

  return (
    <article>
      <h3>{name}</h3>
      {price != null ? <p>Price: {price}</p> : null}
    </article>
  )
}
