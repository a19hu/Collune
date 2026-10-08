/** Capitalizes only the first non-space character, preserving the remaining text. */
export function capitalizeFirstLetter(value: string) {
  return value.replace(/^(\s*)([^\s])/, (_match, leadingSpace: string, firstCharacter: string) => (
    `${leadingSpace}${firstCharacter.toUpperCase()}`
  ));
}
