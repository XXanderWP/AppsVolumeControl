import { ipcMain } from 'electron';
import { CancellationToken, autoUpdater } from 'electron-updater';
import { mainWindow } from './window';

let cancellationToken: CancellationToken;

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = false;
autoUpdater.allowDowngrade = false;

ipcMain.on('downloadUpdate', (ev) => {
    download();
});

let lastUpdateSend: string;

const setDownloadProgress = (progress: number) => {
    const val = progress.toFixed(1);

    mainWindow?.setProgressBar(Math.min(1.0, progress / 100));

    if (lastUpdateSend === val) {
        return;
    }

    lastUpdateSend = val;
    mainWindow?.webContents.send('downloadUpdate', lastUpdateSend);
};

const download = () => {
    lastUpdateSend = '';

    autoUpdater
        .downloadUpdate(cancellationToken)
        .then((res) => {
            mainWindow?.webContents.send('downloadUpdate', '100');
        })
        .catch((err) => {
            mainWindow?.webContents.send('updateAvailableFail', true);
        })
        .finally(() => {
            mainWindow?.setProgressBar(0);
        });
};

autoUpdater.on('download-progress', (info) => {
    setDownloadProgress(info.percent);
});

ipcMain.on('renderer-ready', (ev) => {
    autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', (info) => {
    const version = info.version;

    mainWindow?.webContents.send('updateAvailable', version);
});

ipcMain.on('install_update', () => {
    autoUpdater.quitAndInstall();
});
