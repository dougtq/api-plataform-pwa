import { app, BrowserWindow, ipcMain } from 'electron'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Setup paths for development and production
process.env.DIST = join(__dirname, '../')
process.env.VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// Performance optimization: disable hardware acceleration if not needed
app.disableHardwareAcceleration()

/**
 * Creates the main application window.
 */
function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    backgroundColor: '#020617', // Match Slate-950 UI theme
    show: true,
    frame: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // Load the bridge script
      nodeIntegration: false,
      contextIsolation: true, // Security best practice
    },
  })

  // Disable default menu bar for a cleaner look
  win.setMenuBarVisibility(false)

  // Load the application (Vite dev server or static distribution files)
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(join(process.env.DIST || '', 'index.html'))
  }
}

// Initialize the application
app.whenReady().then(() => {
  createWindow()

  /**
   * Robust IPC handler for HTTP requests.
   * This allows the Renderer process to make requests that bypass CORS
   * by executing them from the Node.js environment (Main process).
   */
  ipcMain.handle('request-http', async (_, config) => {
    try {
      // Execute the request using Axios
      const response = await axios(config)
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      }
    } catch (error: any) {
      // Serialize error details including stack trace for the Renderer process
      return {
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack,
          response: error.response ? {
            data: error.response.data,
            status: error.response.status
          } : undefined
        }
      }
    }
  })
})

// Lifecycle: Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Lifecycle: Re-create window on macOS dock click
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

