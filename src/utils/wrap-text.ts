/**
 * Gracefully wrap text to fit within a certain width. This function will
 * attempt to break the text at spaces and hyphens, and will not break words
 * in the middle.
 */
export function wrapText(text: string, width: number): string {
  const words = text.split(/(\s+|-)/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width) {
      if (currentLine.length > 0) {
        currentLine += ' ';
      }
      currentLine += word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);

  return lines.join('\n');
}
