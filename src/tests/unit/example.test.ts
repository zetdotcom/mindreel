import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockEntry, mockEntries } from '@/tests/fixtures/mockData'
import { createMockIpcRenderer } from '@/tests/mocks/mockFactories'

describe('Example Unit Test', () => {
  it('should pass a basic assertion', () => {
    expect(1 + 1).toBe(2)
  })

  it('should work with mock data', () => {
    expect(mockEntry).toHaveProperty('id')
    expect(mockEntry).toHaveProperty('content')
    expect(mockEntry).toHaveProperty('timestamp')
  })

  it('should work with array of mock data', () => {
    expect(mockEntries).toHaveLength(3)
    expect(mockEntries[0].content).toBe('Praca nad logowaniem')
  })

  describe('Mock IPC Renderer', () => {
    let mockIpc: ReturnType<typeof createMockIpcRenderer>

    beforeEach(() => {
      mockIpc = createMockIpcRenderer()
    })

    it('should create mock ipc renderer', () => {
      expect(mockIpc).toHaveProperty('invoke')
      expect(mockIpc).toHaveProperty('on')
      expect(mockIpc).toHaveProperty('send')
    })

    it('should allow mocking invoke method', async () => {
      mockIpc.invoke.mockResolvedValue({ success: true })
      
      const result = await mockIpc.invoke('test-channel', { data: 'test' })
      
      expect(result).toEqual({ success: true })
      expect(mockIpc.invoke).toHaveBeenCalledWith('test-channel', { data: 'test' })
    })
  })

  describe('Vitest features', () => {
    it('should support inline snapshots', () => {
      const data = {
        name: 'MindReel',
        version: '1.0.0',
      }
      
      expect(data).toMatchInlineSnapshot(`
        {
          "name": "MindReel",
          "version": "1.0.0",
        }
      `)
    })

    it('should support spies', () => {
      const obj = {
        method: () => 'original',
      }
      
      const spy = vi.spyOn(obj, 'method')
      spy.mockReturnValue('mocked')
      
      expect(obj.method()).toBe('mocked')
      expect(spy).toHaveBeenCalled()
      
      spy.mockRestore()
      expect(obj.method()).toBe('original')
    })
  })
})
