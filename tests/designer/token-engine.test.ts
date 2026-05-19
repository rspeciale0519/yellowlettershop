import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import {
  extractTokens,
  substitute,
  substituteDocument,
  resolveFieldKey,
} from '../../components/designer/tokens/token-engine'
import { buildTokenContext } from '../../components/designer/tokens/recipient-map'
import type { DesignerDocument } from '../../types/designer'

const ctx = buildTokenContext(
  {
    id: 'r1',
    firstName: 'Jane',
    lastName: 'Doe',
    addressLine1: '123 Main St',
    addressLine2: '',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    company: '',
    email: 'jane@x.com',
    phone: '555',
  },
  { firstName: 'Bob', lastName: 'Agent', phone: '999', company: 'YLS' },
)

describe('token-engine', () => {
  it('extracts unique token keys (whitespace tolerant)', () => {
    assert.deepEqual(
      extractTokens('Hi {{first_name}} {{ first_name }} at {{address_line_1}}').sort(),
      ['address_line_1', 'first_name'],
    )
  })

  it('resolves the mailing_address alias to address_line_1', () => {
    assert.equal(resolveFieldKey('mailing_address'), 'address_line_1')
    assert.equal(substitute('{{mailing_address}}', ctx), '123 Main St')
  })

  it('substitutes recipient + sender tokens', () => {
    assert.equal(
      substitute('Dear {{first_name}} {{last_name}}, — {{sender_first}} {{sender_company}}', ctx),
      'Dear Jane Doe, — Bob YLS',
    )
  })

  it('drops unknown tokens by default, keeps them when keepUnknown', () => {
    assert.equal(substitute('A {{nope}} B', ctx), 'A  B')
    assert.equal(substitute('A {{nope}} B', ctx, { keepUnknown: true }), 'A {{nope}} B')
  })

  it('substituteDocument walks text, table cells and qr values', () => {
    const doc: DesignerDocument = {
      templateId: 't',
      templateName: 'T',
      orientation: 'portrait',
      pages: {
        front: [
          { id: 't1', name: 'x', type: 'text', x: 0, y: 0, width: 1, height: 1, zIndex: 1, content: 'Hi {{first_name}}', fontSize: 12, fontWeight: 'normal' },
          { id: 'q1', name: 'q', type: 'qr', x: 0, y: 0, width: 1, height: 1, zIndex: 2, value: 'https://x/{{state}}', foreground: '#000', background: '#fff' },
        ],
        back: [
          { id: 'tb', name: 'tbl', type: 'table', x: 0, y: 0, width: 1, height: 1, zIndex: 1, rows: 1, columns: 1, cells: [['Call {{sender_first}}']] },
        ],
      },
      updatedAt: 'now',
    }
    const out = substituteDocument(doc, ctx)
    assert.equal((out.pages.front[0] as { content: string }).content, 'Hi Jane')
    assert.equal((out.pages.front[1] as { value: string }).value, 'https://x/TX')
    assert.equal((out.pages.back[0] as { cells: string[][] }).cells[0][0], 'Call Bob')
    // original is untouched (deep clone)
    assert.equal((doc.pages.front[0] as { content: string }).content, 'Hi {{first_name}}')
  })
})
