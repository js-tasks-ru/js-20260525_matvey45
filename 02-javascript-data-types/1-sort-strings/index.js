/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
    const sorted = [...arr];

  
    const compare = (a, b) => {

        const primary = a.localeCompare(b, 'ru', { sensitivity: 'accent' });

        if (primary !== 0) {

            return param === 'asc' ? primary : -primary;
        }


        return a.localeCompare(b, 'ru', { sensitivity: 'case', caseFirst: 'upper' });
    };

    sorted.sort(compare);
    return sorted;
}