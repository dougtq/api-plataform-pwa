import { expect, test, describe, vi, beforeEach } from 'vitest'
import { useStore } from '../useStore'
import { ApiService } from '../../services/ApiService'

// Mock ApiService.request
vi.mock('../../services/ApiService', () => ({
  ApiService: {
    request: vi.fn().mockResolvedValue({ status: 200, data: {} })
  }
}))

describe('Request Payload Merging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useStore.setState({ tabs: [], activeTabId: null, history: [] })
  })

  test('should merge Authorization header from Bearer token', async () => {
    const { addTab, setActiveTab, sendRequest } = useStore.getState()
    
    // 1. Setup a tab with Bearer Auth
    const tabId = 'test-tab-auth'
    addTab({
      id: tabId,
      url: 'https://api.test.com',
      method: 'GET',
      auth: {
        type: 'bearer',
        bearer: { token: 'secret-token' }
      },
      headers: [
        { id: '1', key: 'X-Custom', value: 'custom-val', enabled: true }
      ]
    })
    
    setActiveTab(tabId)
    
    // 2. Trigger sendRequest
    await sendRequest()
    
    // 3. Verify ApiService.request was called with merged headers
    expect(ApiService.request).toHaveBeenCalledWith(expect.objectContaining({
      headers: {
        'X-Custom': 'custom-val',
        'Authorization': 'Bearer secret-token'
      }
    }))
  })

  test('should merge Authorization header from Basic Auth', async () => {
    const { addTab, setActiveTab, sendRequest } = useStore.getState()
    
    const tabId = 'test-tab-basic'
    addTab({
      id: tabId,
      url: 'https://api.test.com',
      method: 'POST',
      auth: {
        type: 'basic',
        basic: { username: 'user', password: 'pass' }
      }
    })
    
    setActiveTab(tabId)
    
    // Verify active tab before sending
    const state = useStore.getState()
    const activeTab = state.tabs.find(t => t.id === state.activeTabId)
    // console.log('Active Tab:', activeTab?.id, 'URL:', activeTab?.url)
    
    await sendRequest()
    
    const expectedAuth = `Basic ${btoa('user:pass')}`
    expect(ApiService.request).toHaveBeenCalledWith(expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': expectedAuth
      })
    }))
  })
})
