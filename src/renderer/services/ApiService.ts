export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

export interface ApiResponse {
  data: any
  status: number
  headers?: any
}

export class ApiService {
  static async request(config: RequestConfig): Promise<ApiResponse> {
    const isDesktop = !!(window as any).electronAPI

    if (isDesktop) {
      return this.requestDesktop(config)
    } else {
      return this.requestWeb(config)
    }
  }

  private static async requestDesktop(config: RequestConfig): Promise<ApiResponse> {
    const result = await (window as any).electronAPI.sendRequest({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout || 30000
    })

    if (result.error) {
      const error = new Error(result.error.message)
      ;(error as any).code = result.error.code
      ;(error as any).stack = result.error.stack // Preserving Main process stack trace
      ;(error as any).response = result.error.response
      throw error
    }

    return result
  }

  private static async requestWeb(config: RequestConfig): Promise<ApiResponse> {
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body ? JSON.stringify(config.body) : undefined
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      const error = new Error(`Request failed with status ${response.status}`)
      ;(error as any).status = response.status
      ;(error as any).data = data
      throw error
    }

    return {
      data,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    }
  }
}
