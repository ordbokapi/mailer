/**
 * Converts a camelCase string to a kebab-case string.
 */
export function kebabify(camelCase: string): string {
  return camelCase.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
