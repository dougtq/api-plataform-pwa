import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ApiService } from './ApiService'

// Mock browser globals for Node environment
if (typeof window === 'undefined') {
  (global as any).window = {} as any;
  (global as any).fetch = vi.fn();
  (global as any).Headers = class {
    private data: any = {};
    append(k: string, v: string) { this.data[k] = v; }
    entries() { return Object.entries(this.data); }
  };
}

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset global window mock
    delete (window as any).electronAPI
  })

  it('should use IPC (Desktop) when electronAPI is available', async () => {
    const mockSendRequest = vi.fn().mockResolvedValue({ data: { success: true }, status: 200 })
    ;(window as any).electronAPI = {
      sendRequest: mockSendRequest
    }

    const response = await ApiService.request({ method: 'GET', url: 'https://test.com' })
    
    expect(mockSendRequest).toHaveBeenCalled()
    expect(response.data.success).toBe(true)
  })

  it('should use Fetch (PWA) when electronAPI is NOT available', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
      headers: new Headers()
    })
    global.fetch = mockFetch

    const response = await ApiService.request({ method: 'GET', url: 'https://test.com' })
    
    expect(mockFetch).toHaveBeenCalled()
    expect(response.data.success).toBe(true)
  })

  it('should propagate serialized errors from Main process with stack traces', async () => {
    const mockError = {
      error: {
        message: 'Network Error',
        stack: 'Main stack trace info'
      }
    }
    ;(window as any).electronAPI = {
      sendRequest: vi.fn().mockResolvedValue(mockError)
    }

    await expect(ApiService.request({ method: 'GET', url: 'https://fail.com' }))
      .rejects.toThrow('Network Error')
  })
})
