import { describe, it, expect, beforeEach } from 'vitest'
import { db } from './db'

describe('Requests CRUD', () => {
  beforeEach(async () => {
    await db.requests.clear()
  })

  it('should create a new request in a collection', async () => {
    const newRequest = {
      collectionId: 1,
      name: 'Get User',
      method: 'GET',
      url: 'https://api.example.com/user',
      createdAt: Date.now()
    }
    const id = await db.requests.add(newRequest)
    const request = await db.requests.get(id)
    
    expect(request).toBeDefined()
    expect(request?.name).toBe('Get User')
    expect(request?.collectionId).toBe(1)
  })

  it('should update a request', async () => {
    const id = await db.requests.add({ 
      name: 'Initial', 
      method: 'GET', 
      url: '', 
      createdAt: Date.now() 
    })
    await db.requests.update(id, { name: 'Updated' })
    const request = await db.requests.get(id)
    expect(request?.name).toBe('Updated')
  })

  it('should delete a request', async () => {
    const id = await db.requests.add({ 
      name: 'Tmp', 
      method: 'DELETE', 
      url: '', 
      createdAt: Date.now() 
    })
    await db.requests.delete(id)
    const request = await db.requests.get(id)
    expect(request).toBeUndefined()
  })
})
