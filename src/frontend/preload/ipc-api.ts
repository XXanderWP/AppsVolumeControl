import { ipcRenderer } from 'electron';
import { Settings } from '_/shared/settings';

/** Notify main the renderer is ready. */
function rendererReady() {
    return ipcRenderer.send('renderer-ready');
}

function sendData(event: string, data: any, cb?: (res: any) => void) {
    return ipcRenderer.send(event, data, cb);
}

function openURL(url: string) {
    return sendData('openURL', url);
}

function connectService(key: keyof Settings['INTEGRATIONS']) {
    return sendData('connectService', key);
}

function connectService2(key: keyof Settings['INTEGRATIONS']) {
    return sendData('connectService2', key);
}

function setToken(key: keyof Settings['INTEGRATIONS'], token: string) {
    return sendData('setToken', { key, token });
}

function disconnectService(key: keyof Settings['INTEGRATIONS']) {
    return sendData('disconnectService', key);
}

function disconnectService2(key: keyof Settings['INTEGRATIONS']) {
    return sendData('disconnectService2', key);
}

function minimize() {
    return sendData('minimizeWindow', true);
}

function close() {
    return sendData('closeWindow', true);
}

function listen(event: string, callback: (data: any) => void) {
    return ipcRenderer.on(event, (ev, data) => {
        callback(data);
    });
}

function listenOnce(event: string, callback: (data: any) => void) {
    return ipcRenderer.once(event, (ev, data) => {
        callback(data);
    });
}

function notify(item: {
    title: string;
    text: string;
    icon?: string;
    link?: string;
    read?: boolean;
    event?: { name: string; arg?: any[] };
    timestamp?: number;
    style?: 'default' | 'error' | 'warning';
    idremove?: string;
    temp?: boolean;
    id?: string;
}) {
    sendData('createNotify', item);
}

export default {
    notify,
    rendererReady,
    openURL,
    sendData,
    listen,
    listenOnce,
    minimize,
    close,
    connectService,
    connectService2,
    setToken,
    disconnectService,
    disconnectService2,
};
