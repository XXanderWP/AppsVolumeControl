import { BrowserWindow, app, ipcMain, shell } from 'electron';
import { store } from './storage';
import path from 'path';
import { ManualUpdateProcesses, processes } from './processes';
import { getAllLangs } from '_/shared/lang';

export let mainWindow: BrowserWindow;

export const DestroyMainWindow = () => {
    if (mainWindow) {
        mainWindow.destroy();
    }

    mainWindow = undefined as any;
};

export const CreateMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 500,
        height: 300,
        minWidth: 500,
        minHeight: 300,
        webPreferences: {
            devTools: !app.isPackaged,
            preload: path.join(__dirname, './preload.bundle.js'),
            // webSecurity: false,
        },
        show: false,
        frame: false,
        // resizable: false,
        fullscreenable: false,
        icon: `${__dirname}/logo.png`,
    });

    mainWindow.loadFile('./index.html').finally(() => {
        mainWindow?.show();
        mainWindow?.moveTop();

        if (store.get('lockTop')) {
            mainWindow?.setAlwaysOnTop(true);
        }
    });

    mainWindow.on('closed', () => {});
};

ipcMain.on('renderer-ready', (ev) => {
    ev.sender.send('sendRecords', store.get('records'));
    ev.sender.send('setLock', store.get('lockTop'));
    ev.sender.send('getProcesses', processes);
    ev.sender.send('version', `v${app.getVersion()}`);
    ev.sender.send('setLang', store.get('lang'));
});

ipcMain.on('switchLang', (ev) => {
    const index = getAllLangs().indexOf(store.get('lang'));
    const newLang = getAllLangs()[index + 1] || getAllLangs()[0];

    store.set('lang', newLang);

    BrowserWindow.getAllWindows().forEach((itm) => {
        itm.webContents.send('setLang', newLang);
    });
});

ipcMain.on('updateProcesses', (ev) => {
    ManualUpdateProcesses();
    ev.sender.send('getProcesses', processes);
});

ipcMain.on('restartApp', (ev) => {
    app.relaunch();
});

ipcMain.on('lockTop', (ev) => {
    const old = store.get('lockTop');

    store.set('lockTop', !old);
    mainWindow?.setAlwaysOnTop(!old);

    BrowserWindow.getAllWindows().forEach((itm) => {
        itm.webContents.send('setLock', !old);
    });
});

ipcMain.on('devPage', (ev) => {
    shell.openExternal('https://github.com/XXanderWP');
});

ipcMain.on('projectPage', (ev) => {
    shell.openExternal('https://github.com/XXanderWP/AppsVolumeControl');
});

ipcMain.on('openSettings', (ev) => {
    const child = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        show: false,
        frame: false,
        // resizable: false,
        fullscreenable: false,
        icon: `${__dirname}/logo.png`,
        webPreferences: {
            devTools: !app.isPackaged,
            preload: path.join(__dirname, './preload.bundle.js'),
            // webSecurity: false,
        },
        width: 470,
        height: 250,
        resizable: false,
    });

    child
        .loadFile('./index.html', {
            query: {
                settings: 'true',
            },
        })
        .finally(() => {
            child?.show();
            child?.moveTop();
        });

    child.once('ready-to-show', () => {
        child.show();
    });
});

ipcMain.on('openContacts', (ev) => {
    const child = new BrowserWindow({
        parent: mainWindow,
        modal: true,
        show: false,
        frame: false,
        // resizable: false,
        fullscreenable: false,
        icon: `${__dirname}/logo.png`,
        webPreferences: {
            devTools: !app.isPackaged,
            preload: path.join(__dirname, './preload.bundle.js'),
            // webSecurity: false,
        },
        width: 470,
        height: 250,
        resizable: false,
    });

    child
        .loadFile('./index.html', {
            query: {
                contacts: 'true',
            },
        })
        .finally(() => {
            child?.show();
            child?.moveTop();
        });

    child.once('ready-to-show', () => {
        child.show();
    });
});

ipcMain.on('minimizeWindow', (event, arg) => {
    BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on('closeWindow', (event, arg) => {
    BrowserWindow.getFocusedWindow()?.close();
});
