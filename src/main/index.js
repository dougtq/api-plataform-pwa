import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import axios from 'axios';
process.env.DIST = join(__dirname, '../');
process.env.VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
function createWindow() {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        backgroundColor: '#020617', // Match Slate-950
        show: false,
        frame: true,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });
    win.setMenuBarVisibility(false);
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        win.loadFile(join(process.env.DIST || '', 'renderer/index.html'));
    }
    win.once('ready-to-show', () => {
        win.show();
    });
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
