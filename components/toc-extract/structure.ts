import { JSDOM } from 'jsdom';
import { extractLevel } from './helpers';

const HTML_HEADING_QUERY = "h1,h2,h3,h4,h5,h6"

// Extracts the hierarchy of headings from the given HTML code.
//
// Returns an array of objects, with the keys "element" and "children",
// where "element" is a JSDOM element.
export function extractHeadingStructure(html:string) {
  const dom = new JSDOM(html)
  const headings:Element[] = Array.from(dom.window.document.querySelectorAll(HTML_HEADING_QUERY))

  let output = []
  let topLevel = 0

  while (headings.length > 0) {
    const element = buildStructureElement(headings, topLevel)
    if (element === null || element === undefined) {
      throw new Error(`encountered input that ends on a higher heading level than it begins with`)
    }

    if (topLevel === 0) {
      topLevel = extractLevel(element.element)
    }

    output.push(element)
  }

  return output
}


export interface StructureElement {
  element: Element,
  children: StructureElement[],
}

// export default { extractHeadingStructure }

// === PRIVATE FUNCTIONS ===

function buildStructureElement(headings:Element[], expectedLevel:number): StructureElement|undefined {
  const heading = headings[0]
  const level = extractLevel(heading)

  if (expectedLevel !== 0) {
    if (level > expectedLevel) {
      throw new Error(`encountered skipped heading level - expected ${expectedLevel}, found ${level}`)
    }
    if (level < expectedLevel) {
      return undefined
    }
  }

  headings.shift()

  if (heading.querySelector(HTML_HEADING_QUERY) != null) {
    throw new Error(`encountered heading with another heading nested inside`)
  }

  let children = []
  while (headings.length > 0) {
    const child = buildStructureElement(headings, level + 1)
    if (child === undefined) {
      break
    }

    children.push(child)
  }

  return {
    element: heading,
    children: children || []
  }
}