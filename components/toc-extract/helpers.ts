// Extracts the level of a given heading element.
export function extractLevel(heading:Element) {
  if (heading.tagName.length !== 2 || heading.tagName[0].toLowerCase() !== 'h') {
    throw new Error(`encountered invalid heading tagName ${heading.tagName}`)
  }

  return Number(heading.tagName.substring(1))
}