import { app, BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
process.env.DIST = join(__dirname, '../');
process.env.VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
app.disableHardwareAcceleration();
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#020617', // Match Slate-950
        show: true,
        frame: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    // console.log('Window created, loading URL/File...')
    win.setMenuBarVisibility(false);
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        win.loadFile(join(process.env.DIST || '', 'index.html'));
    }
}
app.whenReady().then(() => {
    createWindow();
    // Robust IPC handler for HTTP requests (Bypasses CORS)
    ipcMain.handle('request-http', async (_, config) => {
        try {
            const response = await axios(config);
            return {
                data: response.data,
                status: response.status,
                headers: response.headers,
            };
        }
        catch (error) {
            // Serialize error for Renderer with stack trace
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
            };
        }
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
