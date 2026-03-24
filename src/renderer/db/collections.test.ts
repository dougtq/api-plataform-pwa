import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'

describe('Collections CRUD', () => {
  beforeEach(async () => {
    await db.collections.clear()
  })

  it('should create a new collection', async () => {
    const newCollection = {
      name: 'Test Collection',
      description: 'Test description',
      createdAt: Date.now()
    }
    const id = await db.collections.add(newCollection)
    const collection = await db.collections.get(id)
    
    expect(collection).toBeDefined()
    expect(collection?.name).toBe('Test Collection')
  })

  it('should list all collections', async () => {
    await db.collections.bulkAdd([
      { name: 'Col A', createdAt: Date.now() },
      { name: 'Col B', createdAt: Date.now() }
    ])
    const collections = await db.collections.toArray()
    expect(collections.length).toBe(2)
  })

  it('should update a collection', async () => {
    const id = await db.collections.add({ name: 'Old Name', createdAt: Date.now() })
    await db.collections.update(id, { name: 'New Name' })
    const collection = await db.collections.get(id)
    expect(collection?.name).toBe('New Name')
  })

  it('should delete a collection', async () => {
    const id = await db.collections.add({ name: 'Delete Me', createdAt: Date.now() })
    await db.collections.delete(id)
    const collection = await db.collections.get(id)
    expect(collection).toBeUndefined()
  })
})
