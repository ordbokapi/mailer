/**
 * Converts camelCase to SCREAMING_SNAKE_CASE.
 */
export function envify(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
}
