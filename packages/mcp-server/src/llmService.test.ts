import { describe, it, expect } from 'bun:test'
import { validatePalette, routeToProvider } from './llmService'

describe('llmService', () => {
  describe('validatePalette', () => {
    it('should validate a correct palette', () => {
      const palette = {
        primary: '#0969da',
        secondary: '#6366f1',
        accent: '#0ea5e9',
        background: '#ffffff',
        text: '#24292f',
      }
      expect(validatePalette(palette)).toBe(true)
    })

    it('should reject palette with invalid hex codes', () => {
      const palette = {
        primary: 'not-a-hex',
        secondary: '#6366f1',
        accent: '#0ea5e9',
        background: '#ffffff',
        text: '#24292f',
      }
      expect(validatePalette(palette)).toBe(false)
    })

    it('should reject palette missing required keys', () => {
      const palette = {
        primary: '#0969da',
        secondary: '#6366f1',
        // missing accent, background, text
      }
      expect(validatePalette(palette)).toBe(false)
    })

    it('should reject non-object palette', () => {
      expect(validatePalette('not-an-object')).toBe(false)
      expect(validatePalette(null)).toBe(false)
      expect(validatePalette(undefined)).toBe(false)
    })

    it('should accept lowercase hex codes', () => {
      const palette = {
        primary: '#0969da',
        secondary: '#6366f1',
        accent: '#0ea5e9',
        background: '#ffffff',
        text: '#24292f',
      }
      expect(validatePalette(palette)).toBe(true)
    })

    it('should accept uppercase hex codes', () => {
      const palette = {
        primary: '#0969DA',
        secondary: '#6366F1',
        accent: '#0EA5E9',
        background: '#FFFFFF',
        text: '#24292F',
      }
      expect(validatePalette(palette)).toBe(true)
    })
  })

  describe('routeToProvider', () => {
    it('should return valid palette for mock provider', async () => {
      const palette = await routeToProvider('mock', 'Modern')
      expect(validatePalette(palette)).toBe(true)
    })

    it('should reject empty prompt', async () => {
      try {
        await routeToProvider('mock', '')
        expect.fail('should throw')
      } catch (e: any) {
        expect(e.message).toContain('empty')
      }
    })

    it('should reject prompt longer than 256 characters', async () => {
      const longPrompt = 'a'.repeat(257)
      try {
        await routeToProvider('mock', longPrompt)
        expect.fail('should throw')
      } catch (e: any) {
        expect(e.message).toContain('too long')
      }
    })

    it('should throw for unimplemented provider', async () => {
      try {
        await routeToProvider('google', 'Modern')
        expect.fail('should throw')
      } catch (e: any) {
        expect(e.message).toContain('not implemented')
      }
    })
  })
})
