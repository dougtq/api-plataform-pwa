import { Collection, Folder, Request } from '../db/db'
import { PostmanCollection, PostmanItem } from '../types/postman'

/**
 * PostmanImporter handles the conversion between Postman Collection format (v2.1)
 * and the internal application data structures (Collection, Folder, Request).
 */
export class PostmanImporter {
  /**
   * Parses a Postman Collection JSON (v2.1) into internal Collection, Folder and Request types.
   * 
   * @param json - The Postman collection JSON string.
   * @returns An object containing the parsed collection, requests, and folders.
   * @throws Error if the JSON format is invalid.
   */
  static parseCollection(json: string): { 
    collection: Omit<Collection, 'id'>, 
    requests: Omit<Request, 'id'>[],
    folders: Omit<Folder, 'id'>[]
  } {
    const postman: PostmanCollection = JSON.parse(json)
    
    // Basic validation of the Postman format
    if (!postman.info || !postman.item) {
      throw new Error('Invalid Postman Collection format')
    }

    // Map global collection metadata
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
     * Recursive function to traverse Postman items (folders and requests).
     * 
     * @param items - Postman items to traverse.
     * @param path - The breadcrumb path of folders for this item.
     */
    const traverse = (items: PostmanItem[], path: string[] = []) => {
      for (const item of items) {
        const itemName = item.name || 'Unnamed Item'

        if (item.request) {
          // Process Request item
          const postmanReq = item.request
          
          // Ensure method is uppercase
          const method = (postmanReq.method || 'GET').toUpperCase()
          
          // Parse URL from either string or raw object field
          let url = ''
          if (typeof postmanReq.url === 'string') {
            url = postmanReq.url
          } else if (postmanReq.url?.raw) {
            url = postmanReq.url.raw
          }
          if (!url) url = 'http://localhost'

          // Convert Postman headers (simple objects) to internal KeyValue format with unique IDs
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

          // Push the request to the flat list
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
          // Process Folder item
          folders.push({
            name: itemName,
            collectionId: 0, // Placeholder, actual ID is assigned when saving to DB
            createdAt: Date.now()
          })
          
          // Recurse into sub-items while updating the current path
          traverse(item.item, [...path, itemName])
        }
      }
    }

    traverse(postman.item)

    return { collection, requests, folders }
  }

  /**
   * Serializes a collection and its requests back to Postman format (Export).
   * 
   * @param collection - The collection metadata.
   * @param requests - The requests belonging to this collection.
   * @returns A JSON string in Postman Collection v2.1 format.
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
          // Correctly map internal array-based headers back to Postman's expected header list
          header: Array.isArray(req.headers) 
            ? req.headers.filter(h => h.enabled).map(h => ({ key: h.key, value: h.value }))
            : [],
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

