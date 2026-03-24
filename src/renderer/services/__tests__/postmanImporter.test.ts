import { expect, test, describe, beforeEach, vi } from 'vitest'
import { PostmanImporter } from '../postmanImporter'

describe('PostmanImporter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01'))
  })

  test('should parse a basic collection', () => {
    const json = JSON.stringify({
      info: { name: 'Test Col', schema: 'v2.1' },
      item: [
        {
          name: 'Get User',
          request: { method: 'GET', url: 'https://api.com/user', header: [] }
        }
      ]
    })
    
    const { collection, requests, folders } = PostmanImporter.parseCollection(json)
    
    expect(collection.name).toBe('Test Col')
    expect(requests).toHaveLength(1)
    expect(requests[0].name).toBe('Get User')
    expect(requests[0].method).toBe('GET')
    expect(requests[0].url).toBe('https://api.com/user')
  })

  test('should parse complex collections with folders and nested items', () => {
    const json = JSON.stringify({
      info: { name: 'Complex Col', schema: 'v2.1' },
      item: [
        {
          name: 'Folder 1',
          item: [
            {
              name: 'Sub Request',
              request: { method: 'POST', url: { raw: '{{baseUrl}}/sub' }, header: [{ key: 'Content-Type', value: 'application/json' }] }
            }
          ]
        }
      ]
    })

    const { collection, requests, folders } = PostmanImporter.parseCollection(json)
    
    expect(collection.name).toBe('Complex Col')
    expect(requests).toHaveLength(1)
    expect(requests[0].name).toBe('Sub Request')
    expect(requests[0].metadata?.path).toEqual(['Folder 1'])
    expect(requests[0].headers).toEqual({ 'Content-Type': 'application/json' })
  })

  test('should parse scripts and variables', () => {
    const json = JSON.stringify({
      info: { name: 'Script Col', schema: 'v2.1' },
      variable: [{ key: 'baseUrl', value: 'https://api.com' }],
      event: [
        {
          listen: 'prerequest',
          script: { type: 'text/javascript', exec: ['console.log("global pre-req")'] }
        }
      ],
      item: [
        {
          name: 'Request with Script',
          event: [
            {
              listen: 'test',
              script: { type: 'text/javascript', exec: ['tests["Status is 200"] = responseCode.code === 200'] }
            }
          ],
          request: { method: 'GET', url: 'https://api.com' }
        }
      ]
    })

    const { collection, requests, folders } = PostmanImporter.parseCollection(json)
    
    expect(collection.metadata?.variables).toHaveLength(1)
    expect(collection.metadata?.events).toHaveLength(1)
    expect(requests[0].metadata?.events).toHaveLength(1)
    expect(requests[0].metadata?.events?.[0].listen).toBe('test')
  })

  test('should throw error on invalid format', () => {
    expect(() => PostmanImporter.parseCollection('{}')).toThrow('Invalid Postman Collection format')
  })

  test('should handle missing optional fields', () => {
    const json = JSON.stringify({
      info: { name: 'Minimal Col', schema: 'v2.1' },
      item: [{ name: 'Req', request: { method: 'GET', url: 'http://test.com' } }]
    })
    
    const { collection, requests, folders } = PostmanImporter.parseCollection(json)
    expect(collection.description).toBe('')
    expect(collection.metadata?.variables).toEqual([])
    expect(requests[0].metadata?.path).toEqual([])
  })

  test('should handle empty collection item', () => {
    const json = JSON.stringify({
      info: { name: 'Empty', schema: 'v2.1' },
      item: []
    })
    const { requests } = PostmanImporter.parseCollection(json)
    expect(requests).toHaveLength(0)
  })

  test('should export collection back to postman format with full details', () => {
    const collection = { 
      name: 'My Col', 
      description: 'Desc', 
      metadata: { 
        schema: 'v2.1',
        variables: [{ key: 'v', value: '1' }],
        events: [{ listen: 'prerequest', script: { exec: ['console.log'] } }]
      }
    }
    const requests = [
      { 
        name: 'Req 1', 
        method: 'GET', 
        url: 'https://api.com', 
        headers: { 'X-Test': 'val' },
        body: { mode: 'raw', raw: '{}' },
        metadata: { events: [{ listen: 'test', script: { exec: ['pm.test'] } }] }
      }
    ]

    const exportedJson = PostmanImporter.exportCollection(collection as any, requests as any)
    const exported = JSON.parse(exportedJson)

    expect(exported.info.name).toBe('My Col')
    expect(exported.item[0].name).toBe('Req 1')
    expect(exported.item[0].request.method).toBe('GET')
    expect(exported.item[0].request.header[0].key).toBe('X-Test')
    expect(exported.item[0].request.body.raw).toBe('{}')
    expect(exported.item[0].event[0].listen).toBe('test')
    expect(exported.variable).toHaveLength(1)
    expect(exported.event).toHaveLength(1)
  })
})
