/**
 * invertObj - should swap object keys and values
 * @param {object} obj - the initial object
 * @returns {object | undefined} - returns the new object or undefined if nothing did't pass
 */
export function invertObj(obj) {
  if (obj === undefined || obj === null) {
    return undefined;
  }

  const result = {};
  for (const key in obj) {
    if (Object.hasOwn(obj, key)) {
      const value = obj[key];
      result[value] = key;
    }
  }
  return result;
}