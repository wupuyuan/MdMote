import { contextBridge, ipcRenderer } from 'electron'

const api = {
  platform: process.platform,
  openFileDialog: (): Promise<string[] | null> => ipcRenderer.invoke('dialog:open'),
  saveFileDialog: (): Promise<string | null> => ipcRenderer.invoke('dialog:save'),
  readFile: (filePath: string): Promise<string> => ipcRenderer.invoke('file:read', filePath),
  writeFile: (filePath: string, content: string): Promise<boolean> =>
    ipcRenderer.invoke('file:write', filePath, content),
  minimize: (): void => ipcRenderer.send('window:minimize'),
  toggleMaximize: (): void => ipcRenderer.send('window:toggle-maximize'),
  close: (): void => ipcRenderer.send('window:close'),
  onMaximized: (cb: (v: boolean) => void): (() => void) => {
    const listener = (_e: unknown, v: boolean) => cb(v)
    ipcRenderer.on('window:maximized', listener)
    return () => ipcRenderer.removeListener('window:maximized', listener)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronApi = typeof api