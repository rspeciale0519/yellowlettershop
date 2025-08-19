// CommonJS test environment setup for JSDOM to avoid ESM loader race issues
const { JSDOM } = require('jsdom')

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })
const { window } = dom

function copyProps(src, target) {
  Object.defineProperties(target, Object.getOwnPropertyNames(src).reduce((result, prop) => {
    if (typeof target[prop] === 'undefined') {
      result[prop] = Object.getOwnPropertyDescriptor(src, prop)
    }
    return result
  }, {}))
}

// Attach window and document
Object.defineProperty(global, 'window', { value: window, configurable: true })
Object.defineProperty(global, 'document', { value: window.document, configurable: true })

// Some globals on Node may have only getters; define via defineProperty
try {
  Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true })
} catch {}
try {
  Object.defineProperty(global, 'HTMLElement', { value: window.HTMLElement, configurable: true })
} catch {}

// Ensure Event constructors come from the JSDOM window realm
;[
  'Event',
  'CustomEvent',
  'MouseEvent',
  'KeyboardEvent',
  'PointerEvent',
  'FocusEvent',
  'WheelEvent',
  'InputEvent',
  'UIEvent',
  'TouchEvent',
  'CompositionEvent',
  'EventTarget',
].forEach((name) => {
  if (typeof window[name] !== 'undefined') {
    try {
      Object.defineProperty(global, name, { value: window[name], configurable: true })
    } catch {}
  }
})

copyProps(window, global)

if (typeof global.requestAnimationFrame === 'undefined') {
  Object.defineProperty(global, 'requestAnimationFrame', { value: (cb) => setTimeout(cb, 0), configurable: true })
}
