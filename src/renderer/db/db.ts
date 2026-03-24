import Dexie, { Table } from 'dexie'

export interface Collection {
  id?: number
  name: string
  description?: string
  metadata?: Record<string, any> // Flexible Postman support
  createdAt: number
}

export interface Folder {
  id?: number
  collectionId: number
  parentId?: number // Reference to another parent folder
  name: string
  createdAt: number
}

export interface Request {
  id?: number
  collectionId?: number
  folderId?: number // Reference to a folder
  name: string
  method: string
  url: string
  headers?: any[] // Array of { key, value, enabled }
  params?: any[]  // Array of { key, value, enabled }
  auth?: {
    type: 'none' | 'basic' | 'bearer'
    basic?: { username: string; password: string }
    bearer?: { token: string }
  }
  body?: any
  metadata?: Record<string, any>
  createdAt: number
}

export interface HistoryItem {
  id?: number
  requestId?: number
  method: string
  url: string
  status: number
  duration: number
  timestamp: number
  response?: any
}

export class AppDatabase extends Dexie {
  collections!: Table<Collection>
  folders!: Table<Folder>
  requests!: Table<Request>
  history!: Table<HistoryItem>

  constructor() {
    super('AppDatabase')
    this.version(3).stores({
      collections: '++id, name, createdAt',
      folders: '++id, collectionId, parentId, name',
      requests: '++id, collectionId, folderId, name, method, createdAt',
      history: '++id, requestId, timestamp',
    })
  }
}

export const db = new AppDatabase()
