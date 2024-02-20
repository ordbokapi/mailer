/**
 * Gracefully wrap text to fit within a certain width. This function will
 * attempt to break the text at spaces and hyphens, and will not break words
 * in the middle.
 */
export function wrapText(text: string, width: number): string {
  let result = '';
  let lineLength = 0;

  // Split the text into segments that include words, spaces, and hyphens. Keep
  // everything, including multiple consecutive spaces.
  const segments = text.split(/(\s|-)/);

  for (const segment of segments) {
    if (segment === '\n') {
      // Directly append line breaks and reset line length.
      result += segment;
      lineLength = 0;
    } else if (segment.trim().length === 0) {
      // For purely whitespace segments (including spaces), add them if they
      // fit; break line otherwise.
      if (lineLength + segment.length > width && lineLength > 0) {
        // Trim leading whitespace from the segment if it's the start of a new
        // line.
        const trimmed = segment.trimStart();

        result += '\n' + trimmed;
        lineLength = trimmed.length;
      } else {
        result += segment;
        lineLength += segment.length;
      }
    } else if (lineLength + segment.length > width) {
      // If adding the next segment exceeds the width, break the line unless
      // it's the first segment.
      if (lineLength > 0) {
        result += '\n';
        lineLength = 0;
      }
      // Trim leading whitespace from the segment if it's the start of a new
      // line.
      const trimmed = segment.trimStart();

      result += trimmed;
      lineLength += trimmed.length;
    } else {
      // Append the segment to the result.
      result += segment;
      lineLength += segment.length;
    }
  }

  return result;
}
