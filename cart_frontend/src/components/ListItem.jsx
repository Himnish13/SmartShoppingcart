export default function ListItem({ item, onRemove }) {
  const label =
    typeof item === 'string'
      ? item
      : item?.name ?? item?.label ?? item?.title ?? 'Item'

  return (
    <div>
      <span>{label}</span>
      {onRemove ? (
        <button type="button" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  )
}
