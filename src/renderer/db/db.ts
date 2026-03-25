import Dexie, { Table } from 'dexie'

/**
 * Represents a Collection of requests.
 */
export interface Collection {
  id?: number
  name: string
  description?: string
  /** 
   * Extra metadata for the collection, such as Postman variables and events.
   */
  metadata?: Record<string, any>
  createdAt: number
}

/**
 * Represents a Folder within a collection.
 * Supports hierarchical structure via parentId.
 */
export interface Folder {
  id?: number
  collectionId: number
  parentId?: number // Reference to another parent folder (optional)
  name: string
  createdAt: number
}

/**
 * Represents an HTTP Request.
 * All dynamic values like headers and params are stored as arrays for UI flexibility.
 */
export interface Request {
  id?: number
  collectionId?: number
  folderId?: number // Optional reference to a folder
  name: string
  method: string
  url: string
  /** Array of { id, key, value, enabled } */
  headers?: any[] 
  /** Array of { id, key, value, enabled } */
  params?: any[]  
  /** Authentication configuration */
  auth?: {
    type: 'none' | 'basic' | 'bearer'
    basic?: { username: string; password: string }
    bearer?: { token: string }
  }
  body?: any
  /** Metadata like path, description, and Postman events */
  metadata?: Record<string, any>
  createdAt: number
}

/**
 * Stores execution results of historical requests.
 */
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

/**
 * Main application database using Dexie.js (IndexedDB).
 */
export class AppDatabase extends Dexie {
  collections!: Table<Collection>
  folders!: Table<Folder>
  requests!: Table<Request>
  history!: Table<HistoryItem>

  constructor() {
    super('AppDatabase')
    // Define schema version 3
    this.version(3).stores({
      collections: '++id, name, createdAt',
      folders: '++id, collectionId, parentId, name',
      requests: '++id, collectionId, folderId, name, method, createdAt',
      history: '++id, requestId, timestamp',
    })
  }
}

/**
 * Export a singleton instance of the database.
 */
export const db = new AppDatabase()

