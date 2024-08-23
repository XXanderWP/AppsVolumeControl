import path from 'path';
import { APP_NAME } from '_/shared/app';
import { BrowserWindow, app, ipcMain, Tray, Menu, globalShortcut, shell } from 'electron';
import './controller';
import { VolumeController } from './controller';
import { store } from './storage';
import { ControllerData } from '_/shared/controller';
import { HotkeysList } from '_/shared/hotkeys';
import { setVolume } from '../extra/volume.node';
import { ManualUpdateProcesses, SetPidVolume, processes } from './processes';
let controllers: VolumeController[] = [];

app.setName(APP_NAME);
app.setAppUserModelId(APP_NAME);
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-pinch');
let tray: Tray;

const createWindow = () => {
    // return;
    const p = `${__dirname}/logo.png`;

    tray = new Tray(p);

    renderContextMenu();
};

const renderContextMenu = () => {
    // return;
    const items: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [];

    const contextMenu = Menu.buildFromTemplate(items);

    tray.setToolTip(APP_NAME);
    tray.setContextMenu(contextMenu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady()
    .then(() => {
        // renderContextMenu();

        HotkeysList.forEach((key) => {
            globalShortcut.register(key, () => {
                let changed = false;

                controllers.forEach((item) => {
                    if (item.status && item.hotkey === key) {
                        const current = Math.floor(item.volume * 100);

                        if (current === -1) {
                            return;
                        }

                        const setMin = Math.abs(current - item.min) > Math.abs(current - item.max);
                        const volume = setMin ? item.min : item.max;
                        const pid = item.pid;

                        if (pid) {
                            setVolume(pid, volume / 100);
                            SetPidVolume(pid, volume / 100);

                            mainWindow?.webContents.send('updateProcess', {
                                pid,
                                volume: volume / 100,
                            });

                            changed = true;
                        }
                    }
                });
            });

            // console.log('Register key', !!item);
        });
    })
    .finally(() => {
        /* no action */
    });

ipcMain.on('minimizeWindow', (event, arg) => {
    BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on('closeWindow', (event, arg) => {
    BrowserWindow.getFocusedWindow()?.close();
});

ipcMain.on('relaunch', (event, arg) => {
    app.relaunch();
    app.exit();
});

let mainWindow: BrowserWindow;

app.on('ready', async () => {
    await ManualUpdateProcesses();
    const records = store.get('records');

    controllers = [];

    records.forEach((rec) => {
        const item = new VolumeController(rec);

        controllers.push(item);
    });

    mainWindow = new BrowserWindow({
        height: 880,
        width: 600,
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
});

ipcMain.on('renderer-ready', (ev) => {
    ev.sender.send('sendRecords', store.get('records'));
    ev.sender.send('setLock', store.get('lockTop'));
    ev.sender.send('getProcesses', processes);
});

ipcMain.on('createRecord', (ev) => {
    const record = new VolumeController({
        id: Date.now().toString(),
        status: false,
    });

    store.set('records', [...store.get('records'), record.storeData]);
    ev.sender.send('addRecord', record.storeData);
});

ipcMain.on('removeItem', (ev, id: string) => {
    const old = store.get('records');
    const index = old.findIndex((q) => q.id === id);

    if (index > -1) {
        old.splice(index, 1);
    }

    const index2 = controllers.findIndex((q) => q.id === id);

    if (index2 > -1) {
        controllers.splice(index2, 1);
    }

    store.set('records', [...old]);
});

ipcMain.on('updateParam', (ev, param: Partial<ControllerData> & { id: string }) => {
    if (!param.id) {
        return;
    }

    const old = store.get('records');
    const index = old.findIndex((q) => q.id === param.id);

    if (index > -1) {
        for (const q in param) {
            const val = (param as any)[q];

            (old[index] as any)[q] = val;
        }
    }

    const index2 = controllers.findIndex((q) => q.id === param.id);

    if (index2 > -1) {
        for (const q in param) {
            const val = (param as any)[q];

            (controllers[index2] as any)[q] = val;
        }
    }

    store.set('records', [...old]);

    ev.sender.send('updateRecord', old[index]);
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
    mainWindow?.webContents?.send('setLock', !old);
});

ipcMain.on('devPage', (ev) => {
    shell.openExternal('https://github.com/XXanderWP');
});

ipcMain.on('projectPage', (ev) => {
    shell.openExternal('https://github.com/XXanderWP/ApplicationsVolumeControl');
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
