/**
 * Builds a render function for `<SelectValue>` that resolves the currently
 * selected id to a display label, falling back to a placeholder when nothing
 * matches (e.g. no selection yet, or the options are still loading).
 *
 * @param items       The available options, keyed by `id`.
 * @param placeholder Text shown when no option matches the current value.
 * @param format      Maps a matched option to its label (defaults to `name`).
 */
export function renderSelectLabel<T extends { id: string; name: string }>(
  items: T[],
  placeholder: string,
  format: (item: T) => string = (item) => item.name,
) {
  return (value: unknown) => {
    const item = items.find((i) => i.id === value)
    return item ? format(item) : placeholder
  }
}
