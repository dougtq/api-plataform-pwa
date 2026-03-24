/**
 * Simplified Postman Collection Schema v2.1.0
 */

export interface PostmanVariable {
  id?: string
  key: string
  value: any
  type?: string
  disabled?: boolean
}

export interface PostmanScript {
  id?: string
  type: string
  exec: string[]
}

export interface PostmanEvent {
  listen: 'prerequest' | 'test'
  script: PostmanScript
}

export interface PostmanHeader {
  key: string
  value: string
  disabled?: boolean
  description?: string
}

export interface PostmanBody {
  mode: 'raw' | 'urlencoded' | 'formdata' | 'file' | 'graphql'
  raw?: string
  urlencoded?: { key: string; value: string; disabled?: boolean }[]
  formdata?: { key: string; value: string; type: string; disabled?: boolean }[]
  options?: {
    raw?: {
      language: string
    }
  }
}

export interface PostmanRequest {
  method: string
  url: string | { raw: string; host: string[]; path: string[]; query?: any[]; variable?: any[] }
  header: PostmanHeader[]
  body?: PostmanBody
  description?: string
}

export interface PostmanItem {
  id?: string
  name: string
  request?: PostmanRequest
  item?: PostmanItem[]
  event?: PostmanEvent[]
  variable?: PostmanVariable[]
  description?: string
}

export interface PostmanCollection {
  info: {
    name: string
    _postman_id?: string
    description?: string
    schema: string
  }
  item: PostmanItem[]
  event?: PostmanEvent[]
  variable?: PostmanVariable[]
}
