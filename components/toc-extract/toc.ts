import { extractLevel } from './helpers'
import { extractHeadingStructure, StructureElement } from './structure'

// Returns the default options for buildTOCFromHeadingStructure/extractTOC.
const DefaultOption:Options = {
  listElement: "ul",
  maxLevel: 6,
  minLevel: 1,
}

// Builds an HTML table of contents from a heading structure as returned by
// the extractHeadingStructure function.
//
// For the available options that can be passed into the options parameter,
// please refer to the README of toc-extract.
function buildTOCFromHeadingStructure(headingStructure: StructureElement[], options = {}) {
  const fullOptions = {...DefaultOption, ...options}
  validateOptions(fullOptions)

  validateHeadingStructure(headingStructure)

  const topLevelElements = collectTopLevelElements(headingStructure, fullOptions.minLevel)
  return renderTOCChildren(fullOptions, topLevelElements)
}

// Builds an HTML table of contents from a given HTML document in code form.
//
// For the available options that can be passed into the options parameter,
// please refer to the README of toc-extract.
export function extractTOC(dom: HTMLElement, options = {}) {
  return buildTOCFromHeadingStructure(extractHeadingStructure(dom), options)
}


export interface Options {
  listElement: 'dl' | 'ul' | 'ol',
  minLevel: number,
  maxLevel: number,
}


// === PRIVATE FUNCTIONS ===

function collectTopLevelElements(headingStructure: StructureElement[], minLevel: number) {
  if (!Array.isArray(headingStructure) || headingStructure.length === 0) {
    return []
  }

  const level = extractLevel(headingStructure[0].element)

  if (level >= minLevel) {
    return headingStructure
  }

  let topLevelElements:any[] = []
  headingStructure.forEach(se => topLevelElements.push(...collectTopLevelElements(se.children, minLevel)))

  return topLevelElements
}

function renderTOCChildren(options: Options, children: StructureElement[]) {
  if (!Array.isArray(children) || children.length === 0) {
    return ""
  }

  const level = extractLevel(children[0].element)

  let out = ""

  if (level >= options.minLevel && level <= options.maxLevel) {
    out += `<${options.listElement}>`
    children.forEach(c => out += renderTOCElement(options, c))
    out += `</${options.listElement}>`
  }

  return out
}

function renderTOCElement(options: Options, structureElement: StructureElement) {
  const domElement = structureElement.element
  const level = extractLevel(domElement)
  const hasID = typeof domElement.id === "string" && domElement.id.length > 0

  let out = ""

  if (level >= options.minLevel && level <= options.maxLevel) {
    out += '<li>'

    if (hasID) {
      out += `<a href="#${domElement.id}">`
    }

    out += domElement.textContent

    if (hasID) {
      out += '</a>'
    }

    out += renderTOCChildren(options, structureElement.children)

    out += '</li>'
  }

  return out
}

function validateHeadingStructure(headingStructure: StructureElement[]) {
  if (!Array.isArray(headingStructure)) {
    throw new Error("headingStructure is not an Array")
  }

  if (headingStructure.length === 0) {
    return
  }

  const expectedLevel = extractLevel(headingStructure[0].element)

  headingStructure.forEach(se => validateTOCElement(se, expectedLevel))
}

function validateOptions(options: Options) {
  switch (options.listElement.toLowerCase()) {
    case "dl":
    case "ul":
    case "ol":
      // all is well
      break;
    default:
      throw new Error(`listElement must be one of dl, ul or ol`)
  }

  if (!Number.isInteger(options.minLevel)) {
    throw new Error(`minLevel must be an integer`)
  }
  if (!Number.isInteger(options.maxLevel)) {
    throw new Error(`maxLevel must be an integer`)
  }

  if (options.minLevel < 1 || options.minLevel > 6) {
    throw new Error(`minLevel must be in the range [1;6]`)
  }
  if (options.maxLevel < 1 || options.maxLevel > 6) {
    throw new Error(`maxLevel must be in the range [1;6]`)
  }
  if (options.minLevel > options.maxLevel) {
    throw new Error(`minLevel must be lesser or equal than maxLevel`)
  }
}

function validateTOCElement(structureElement: StructureElement, expectedLevel: number) {
  const level = extractLevel(structureElement.element)
  if (expectedLevel !== 0 && level !== expectedLevel) {
    throw new Error(`encountered nonuniform or skipped heading levels in headingStructure`)
  }

  structureElement.children.forEach(se => validateTOCElement(se, expectedLevel + 1))
}