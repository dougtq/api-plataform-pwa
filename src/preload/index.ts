import { contextBridge, ipcRenderer } from 'electron'

/**
 * The preload script acts as a bridge between the Electron Main process 
 * (Node.js) and the Renderer process (Chrome/Web).
 * It exposes a secure, limited API to the window object.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * Invokes a request for system metrics via IPC.
   */
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
  
  /**
   * Sends an HTTP request through the Main process to bypass CORS.
   * @param config - Axios-compatible request configuration.
   */
  sendRequest: (config: any) => ipcRenderer.invoke('request-http', config),
})

