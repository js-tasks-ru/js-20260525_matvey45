/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
  const directions = {
    asc: 1,
    desc: -1
  };

  if (!(param in directions)) {
    throw new Error(`Unknown sorting direction: ${param}. Use "asc" or "desc".`);
  }

  const sorted = [...arr];
  const dir = directions[param];

  const compare = (a, b) => {
    const primary = a.localeCompare(b, 'ru', { sensitivity: 'accent' });
    if (primary !== 0) {
      return primary * dir;
    }
    return a.localeCompare(b, 'ru', { sensitivity: 'case', caseFirst: 'upper' }) * dir;
  };

  sorted.sort(compare);
  return sorted;
}