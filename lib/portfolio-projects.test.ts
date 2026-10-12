import { describe, expect, it } from 'vitest'
import { shouldOptimizeImage } from './portfolio-projects'

describe('shouldOptimizeImage', () => {
  it('optimizes local covers and known CDNs', () => {
    expect(shouldOptimizeImage('/hireiq-cover.jpg')).toBe(true)
    expect(
      shouldOptimizeImage(
        'https://fcdzbnuyzdzqkuizvexk.supabase.co/storage/v1/object/public/images/a.jpg'
      )
    ).toBe(true)
    expect(shouldOptimizeImage('https://cdn.sanity.io/images/x/y/z.jpg')).toBe(true)
  })

  it('leaves other remote hosts alone', () => {
    expect(shouldOptimizeImage('https://cdn.simpleicons.org/react/61DAFB')).toBe(false)
    expect(shouldOptimizeImage('')).toBe(false)
    expect(shouldOptimizeImage('not a url')).toBe(false)
  })
})
