import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db, Collection, Folder, Request, HistoryItem } from '../db/db'

export interface KeyValue {
  id: string
  key: string
  value: string
  description?: string
  enabled: boolean
}

export interface Tab {
  id: string
  requestId?: number
  name: string
  method: string
  url: string
  body: string
  activePanelTab: 'params' | 'auth' | 'headers' | 'body'
  headers: KeyValue[]
  params: KeyValue[]
  auth: {
    type: 'none' | 'basic' | 'bearer'
    basic?: { username: string; password: string }
    bearer?: { token: string }
  }
  response?: {
    status: number
    statusText: string
    data: any
    time: number
    size: number
    headers: Record<string, string>
  }
  isPersistent: boolean
  isDirty: boolean
}

interface AppState {
  collections: Collection[]
  requests: Request[]
  history: HistoryItem[]
  tabs: Tab[]
  activeTabId: string | null
  
  // Data Actions
  loadData: () => Promise<void>
  addCollection: (name: string, description?: string) => Promise<void>
  deleteCollection: (id: number) => Promise<void>
  addRequest: (request: Omit<Request, 'id' | 'createdAt'>) => Promise<number>
  addHistory: (item: Omit<HistoryItem, 'id' | 'timestamp'>) => Promise<void>
  
  // Tab Actions
  addTab: (tabData: Partial<Tab>) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<Tab>) => void
  persistTab: (id: string) => void
  importCollection: (
    collection: Omit<Collection, 'id'>, 
    requests: Omit<Request, 'id'>[], 
    folders?: Omit<Folder, 'id'>[],
    onProgress?: (processed: number, total: number) => void
  ) => Promise<void>
  sendRequest: () => Promise<void>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      collections: [],
      requests: [],
      history: [],
      tabs: [],
      activeTabId: null,

      loadData: async () => {
        const [collections, requests, history] = await Promise.all([
          db.collections.toArray(),
          db.requests.toArray(),
          db.history.orderBy('timestamp').reverse().limit(50).toArray()
        ])
        set({ collections, requests, history })
      },

      addCollection: async (name, description) => {
        await db.collections.add({ name, description, createdAt: Date.now() })
        await get().loadData()
      },

      deleteCollection: async (id) => {
        await db.collections.delete(id)
        await get().loadData()
      },

      addRequest: async (req) => {
        const id = await db.requests.add({ ...req, createdAt: Date.now() })
        await get().loadData()
        return id as number
      },

      addHistory: async (item) => {
        await db.history.add({ ...item, timestamp: Date.now() })
        await get().loadData()
      },

      // Tab Management
      addTab: (tabData) => {
        const { tabs, activeTabId } = get()
        
        // If it's a preview tab and a preview tab already exists, replace it
        if (!tabData.isPersistent) {
          const previewTab = tabs.find(t => !t.isPersistent)
          if (previewTab) {
            const newTab = { ...previewTab, ...tabData, id: previewTab.id } as Tab
            set({
              tabs: tabs.map(t => t.id === previewTab.id ? newTab : t),
              activeTabId: newTab.id
            })
            return
          }
        }

        const id = tabData.id || crypto.randomUUID()
        const newTab: Tab = {
          id,
          name: tabData.name || 'New Request',
          method: tabData.method || 'GET',
          url: tabData.url || '',
          body: tabData.body || '',
          activePanelTab: tabData.activePanelTab || 'body',
          headers: tabData.headers || [],
          params: tabData.params || [],
          auth: tabData.auth || { type: 'none' },
          isPersistent: tabData.isPersistent ?? false,
          isDirty: false,
          ...tabData
        }

        set({
          tabs: [...tabs, newTab],
          activeTabId: id
        })
      },

      closeTab: (id) => {
        const { tabs, activeTabId } = get()
        const index = tabs.findIndex(t => t.id === id)
        const newTabs = tabs.filter(t => t.id !== id)
        
        let newActiveId = activeTabId
        if (activeTabId === id) {
          if (newTabs.length > 0) {
            newActiveId = newTabs[Math.max(0, index - 1)].id
          } else {
            newActiveId = null
          }
        }

        set({ tabs: newTabs, activeTabId: newActiveId })
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      updateTab: (id, updates) => {
        const { tabs } = get()
        set({
          tabs: tabs.map(t => t.id === id ? { ...t, ...updates, isDirty: updates.isDirty ?? true, isPersistent: updates.isPersistent !== undefined ? updates.isPersistent : (updates.isDirty ? true : t.isPersistent) } : t)
        })
      },

      persistTab: (id) => {
        const { tabs } = get()
        set({
          tabs: tabs.map(t => t.id === id ? { ...t, isPersistent: true } : t)
        })
      },

      importCollection: async (collectionData, requestsData, foldersData = [], onProgress) => {
        const colId = await db.collections.add({ ...collectionData, createdAt: Date.now() })
        
        const folderIdMap = new Map<string, number>()
        const totalItems = foldersData.length + requestsData.length
        let processedCount = 0

        // Import folders first to maintain hierarchy
        // We need to handle parentId which refers to other folders in foldersData
        // For simplicity, foldersData should be ordered by depth or we handle it here
        for (const folder of foldersData) {
          const folderToSave = { 
            ...folder, 
            collectionId: colId as number,
            createdAt: Date.now()
          }
          
          // If folder has a temporary 'pathId' or similar to resolve parentId
          // Let's assume folder identifies its parent by name or stable path
          const id = await db.folders.add(folderToSave as Folder)
          folderIdMap.set(folder.name, id as number) // Simplistic mapping, can be improved with stable IDs
          
          processedCount++
          onProgress?.(processedCount, totalItems)
        }

        const requestsWithColId = requestsData.map(req => {
          // Resolve folderId from metadata path if available
          const folderName = req.metadata?.path?.[req.metadata.path.length - 1]
          const folderId = folderName ? folderIdMap.get(folderName) : undefined

          return {
            ...req,
            collectionId: colId as number,
            folderId,
            createdAt: Date.now()
          }
        })

        await db.requests.bulkAdd(requestsWithColId as Request[])
        processedCount += requestsData.length
        onProgress?.(processedCount, totalItems)

        await get().loadData()
      },

      sendRequest: async () => {
        const { activeTabId, tabs, updateTab, addHistory } = get()
        const activeTab = tabs.find(t => t.id === activeTabId)
        if (!activeTab || !activeTab.url) return

        const startTime = Date.now()
        
        try {
          // Import ApiService dynamically to avoid circular dependencies if any
          const { ApiService } = await import('../services/ApiService')
          
          const headers = activeTab.headers.reduce((acc, curr) => {
            if (curr.enabled && curr.key) acc[curr.key] = curr.value
            return acc
          }, {} as Record<string, string>)

          // Add Auth headers
          if (activeTab.auth.type === 'bearer' && activeTab.auth.bearer?.token) {
            headers['Authorization'] = `Bearer ${activeTab.auth.bearer.token}`
          } else if (activeTab.auth.type === 'basic' && activeTab.auth.basic) {
            const { username, password } = activeTab.auth.basic
            headers['Authorization'] = `Basic ${btoa(`${username}:${password}`)}`
          }

          const response = await ApiService.request({
            method: activeTab.method as any,
            url: activeTab.url,
            body: activeTab.body ? JSON.parse(activeTab.body) : undefined,
            headers
          })

          const endTime = Date.now()
          const responseData = {
            status: response.status,
            statusText: response.status < 300 ? 'OK' : 'Error', // Simplified
            data: response.data,
            time: endTime - startTime,
            size: JSON.stringify(response.data).length, // Approximation
            headers: response.headers || {}
          }

          updateTab(activeTab.id, { response: responseData })
          
          // Add to history
          await addHistory({
            requestId: activeTab.requestId || 0,
            method: activeTab.method,
            url: activeTab.url,
            status: response.status,
            duration: endTime - startTime
          })
        } catch (error: any) {
          const endTime = Date.now()
          updateTab(activeTab.id, { 
            response: {
              status: error.status || 500,
              statusText: error.message || 'Network Error',
              data: error.data || error.message,
              time: endTime - startTime,
              size: 0,
              headers: {}
            }
          })
        }
      }
    }),
    {
      name: 'api-platform-storage',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId
      })
    }
  )
)
