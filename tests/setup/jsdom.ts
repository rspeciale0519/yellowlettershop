import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost' })

const { window } = dom

function copyProps(src: any, target: any) {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyNames(src)
      .filter((prop) => typeof (target as any)[prop] === 'undefined')
      .reduce((result: any, prop) => ({
        ...result,
        [prop]: Object.getOwnPropertyDescriptor(src, prop),
      }), {}),
  })
}

// @ts-ignore
global.window = window
// @ts-ignore
global.document = window.document
// @ts-ignore
global.navigator = { userAgent: 'node.js' }
// @ts-ignore
global.HTMLElement = window.HTMLElement
copyProps(window, global)

// Polyfill RAF
// @ts-ignore
global.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0)
