import { APP_NAME } from '_/shared/app';
import { app, ipcMain, Tray, Menu, globalShortcut } from 'electron';
import './controller';
import { VolumeController } from './controller';
import { store } from './storage';
import { ControllerData } from '_/shared/controller';
import { HotkeysList } from '_/shared/hotkeys';
import { setVolume } from '../extra/volume.node';
import './updater';
import { ManualUpdateProcesses, SetPidVolume } from './processes';
import { CreateMainWindow, mainWindow } from './window';
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
                        }
                    }
                });
            });
        });
    })
    .finally(() => {
        /* no action */
    });

ipcMain.on('relaunch', (event, arg) => {
    app.relaunch();
    app.exit();
});

app.on('ready', async () => {
    await ManualUpdateProcesses();
    const records = store.get('records');

    controllers = [];

    records.forEach((rec) => {
        const item = new VolumeController(rec);

        controllers.push(item);
    });

    CreateMainWindow();
});

ipcMain.on('createRecord', (ev) => {
    const record = new VolumeController({
        id: Date.now().toString(),
        status: false,
    });

    store.set('records', [...store.get('records'), record.storeData]);
    controllers.push(record);
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
