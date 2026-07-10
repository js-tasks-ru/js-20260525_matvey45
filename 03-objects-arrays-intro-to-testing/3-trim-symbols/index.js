/**
 * trimSymbols - removes consecutive identical symbols if they quantity bigger that size
 * @param {string} string - the initial string
 * @param {number} size - the allowed size of consecutive identical symbols
 * @returns {string} - the new string without extra symbols according passed size
 */
export function trimSymbols(string, size) {
  if (size === undefined) return string;
  if (size === 0 || string.length === 0) return '';

  let result = '';
  let count = 0;
  let prev = '';

  for (let i = 0; i < string.length; i++) {
    const char = string[i];

    if (i === 0 || char !== prev) {
      count = 1;
      result += char;
      prev = char;
    } else {
      count++;
      if (count <= size) {
        result += char;
      }
    }
  }

  return result;
}