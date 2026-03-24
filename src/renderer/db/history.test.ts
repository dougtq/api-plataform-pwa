import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'

describe('History CRUD', () => {
  beforeEach(async () => {
    await db.history.clear()
  })

  it('should add a history item', async () => {
    const item = {
      method: 'POST',
      url: 'https://api.test.com',
      status: 200,
      duration: 150,
      timestamp: Date.now()
    }
    const id = await db.history.add(item)
    const saved = await db.history.get(id)
    
    expect(saved).toBeDefined()
    expect(saved?.status).toBe(200)
  })

  it('should clear history', async () => {
    await db.history.add({ method: 'GET', url: '', status: 200, duration: 0, timestamp: Date.now() })
    await db.history.clear()
    const all = await db.history.toArray()
    expect(all.length).toBe(0)
  })
})
