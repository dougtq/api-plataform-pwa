/**
 * Configuration for an HTTP request.
 */
export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  body?: any
  timeout?: number
}

/**
 * Standardized API response format.
 */
export interface ApiResponse {
  data: any
  status: number
  headers?: any
}

/**
 * ApiService provides a cross-platform interface for making HTTP requests.
 * It automatically switches between Electron IPC (to bypass CORS) and 
 * standard Web Fetch API based on the environment.
 */
export class ApiService {
  /**
   * Dispatches a request to the appropriate handler based on the environment.
   */
  static async request(config: RequestConfig): Promise<ApiResponse> {
    const isDesktop = !!(window as any).electronAPI

    if (isDesktop) {
      return this.requestDesktop(config)
    } else {
      return this.requestWeb(config)
    }
  }

  /**
   * Handles requests in the Electron environment by sending them to the 
   * Main process via IPC. This allows bypassing CORS restrictions.
   */
  private static async requestDesktop(config: RequestConfig): Promise<ApiResponse> {
    const result = await (window as any).electronAPI.sendRequest({
      method: config.method,
      url: config.url,
      headers: config.headers,
      data: config.body,
      timeout: config.timeout || 30000
    })

    // If the Main process returned an error, reconstruct it as a proper Error object
    if (result.error) {
      const error = new Error(result.error.message)
      ;(error as any).code = result.error.code
      ;(error as any).stack = result.error.stack // Preserving Main process stack trace for debugging
      ;(error as any).response = result.error.response
      throw error
    }

    return result
  }

  /**
   * Handles requests in the Web/PWA environment using the standard Fetch API.
   * Subject to browser CORS policies.
   */
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

