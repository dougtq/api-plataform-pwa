import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('electronAPI', {
    getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics'),
    sendRequest: (config) => ipcRenderer.invoke('request-http', config),
});
