import { describe, it } from 'mocha'
import { strict as assert } from 'assert'
import { backgroundImageSource } from '../../components/designer/background-image-source'

describe('backgroundImageSource', () => {
  it('returns "" for placeholder backgrounds', () => {
    assert.equal(backgroundImageSource({ src: 'placeholder:Background', fit: 'cover' }), '')
  })

  it('prefers an explicit sourceUrl', () => {
    assert.equal(
      backgroundImageSource({ src: 'x', sourceUrl: 'https://cdn/y.png', fit: 'cover' }),
      'https://cdn/y.png',
    )
  })

  it('derives the canonical asset route from assetId', () => {
    assert.equal(
      backgroundImageSource({ src: 'x', assetId: 'abc 123', fit: 'cover' }),
      'https://www.yellowlettershop.com/assets/images/abc%20123',
    )
  })

  it('falls back to the raw src when no sourceUrl/assetId', () => {
    assert.equal(
      backgroundImageSource({ src: 'https://cdn/raw.jpg', fit: 'contain' }),
      'https://cdn/raw.jpg',
    )
  })
})
