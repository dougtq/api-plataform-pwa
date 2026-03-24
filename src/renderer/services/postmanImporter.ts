import { Collection, Folder, Request } from '../db/db'
import { PostmanCollection, PostmanItem } from '../types/postman'

export class PostmanImporter {
  /**
   * Parses a Postman Collection JSON (v2.1) into internal Collection, Folder and Request types.
   */
  static parseCollection(json: string): { 
    collection: Omit<Collection, 'id'>, 
    requests: Omit<Request, 'id'>[],
    folders: Omit<Folder, 'id'>[]
  } {
    const postman: PostmanCollection = JSON.parse(json)
    
    if (!postman.info || !postman.item) {
      throw new Error('Invalid Postman Collection format')
    }

    const collection: Omit<Collection, 'id'> = {
      name: postman.info.name || 'Imported Collection',
      description: postman.info.description || '',
      createdAt: Date.now(),
      metadata: {
        schema: postman.info.schema,
        variables: postman.variable || [],
        events: postman.event || []
      }
    }

    const requests: Omit<Request, 'id'>[] = []
    const folders: Omit<Folder, 'id'>[] = []
    
    /**
     * Recursive function to traverse Postman items.
     * Identifies if an item is a folder (contains 'item') or a request (contains 'request').
     */
    const traverse = (items: PostmanItem[], path: string[] = []) => {
      for (const item of items) {
        // Validation & Robustness: Ensure name exists
        const itemName = item.name || 'Unnamed Item'

        if (item.request) {
          // It's a Request
          const postmanReq = item.request
          
          // Continuous Improvement: Validate mandatory fields
          // Method: Default to GET if missing
          const method = (postmanReq.method || 'GET').toUpperCase()
          
          // URL: Default to localhost if missing or empty
          let url = ''
          if (typeof postmanReq.url === 'string') {
            url = postmanReq.url
          } else if (postmanReq.url?.raw) {
            url = postmanReq.url.raw
          }
          if (!url) url = 'http://localhost'

          const headers: any[] = []
          if (postmanReq.header) {
            postmanReq.header.forEach(h => {
              if (h.key) {
                headers.push({
                  id: crypto.randomUUID(),
                  key: h.key,
                  value: h.value || '',
                  enabled: true
                })
              }
            })
          }

          requests.push({
            name: itemName,
            method: method,
            url: url,
            headers: headers,
            body: postmanReq.body || null,
            createdAt: Date.now(),
            metadata: {
              path: path,
              events: item.event || [],
              description: item.description || ''
            }
          })
        } else if (item.item) {
          // It's a Folder
          folders.push({
            name: itemName,
            collectionId: 0, // Will be set by store
            createdAt: Date.now()
            // parentId will be resolved by store or path
          })
          
          // Recurse into sub-items
          traverse(item.item, [...path, itemName])
        }
      }
    }

    traverse(postman.item)

    return { collection, requests, folders }
  }

  /**
   * Serializes a collection and its requests back to Postman format (Export).
   */
  static exportCollection(collection: Collection, requests: Request[]): string {
    const postman: PostmanCollection = {
      info: {
        name: collection.name,
        description: collection.description,
        schema: collection.metadata?.schema || 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
      },
      item: requests.map(req => ({
        name: req.name,
        request: {
          method: req.method,
          url: req.url,
          header: Object.entries(req.headers || {}).map(([key, value]) => ({ key, value })),
          body: req.body
        },
        event: req.metadata?.events || []
      })),
      variable: collection.metadata?.variables || [],
      event: collection.metadata?.events || []
    }

    return JSON.stringify(postman, null, 2)
  }
}
