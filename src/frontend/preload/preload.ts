 
import { contextBridge } from 'electron';
import ipcAPI from '_preload/ipc-api';

contextBridge.exposeInMainWorld('ipcAPI', ipcAPI);
 