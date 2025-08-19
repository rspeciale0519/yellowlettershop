// CJS stub for lucide-react to be used in mocha + ts-node tests
const React = require('react')

function makeIcon(name) {
  return function Icon(props) {
    return React.createElement('svg', { 'data-icon': String(name), width: 12, height: 12, ...props })
  }
}

const proxy = new Proxy(
  {},
  {
    get(_target, prop) {
      return makeIcon(prop)
    },
  },
)

module.exports = proxy
module.exports.__esModule = true
module.exports.default = proxy
