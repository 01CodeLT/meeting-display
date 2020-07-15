import * as url from 'url';
import * as path from 'path';
import debug = require('electron-debug');
import { autoUpdater } from 'electron-updater';
import { app, BrowserWindow, screen, protocol, ipcMain, dialog } from 'electron';
import { toggleDisplay, updateSlides, controlDisplay } from './lib/DisplaySlide';
import { uploadEpub, listEpub, getEpub, parseEpubPage } from './lib/EpubManager';

debug({ showDevTools: true, isEnabled: true });

export var mainWindow: BrowserWindow = null;
export const storagePath = app.getPath('userData') + '/storage/';
export const args = process.argv.slice(1), serve = args.some(val => val === '--serve');

function createWindow(): BrowserWindow {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  mainWindow = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
    },
    title: 'Meeting display',
    icon: __dirname + '/icon.ico'
  });
  app.commandLine.appendSwitch('ignore-certificate-errors');

  //Electron config
  console.log('outside serve');
  if (serve) {
    mainWindow.webContents.openDevTools();
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    mainWindow.loadURL('http://localhost:4200');
  } else {
    console.log('loading');
    console.log(__dirname, 'dist/index.html');
    mainWindow.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  //Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null; //Dereference the window object
  });

  //Check for updates
  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });

  //Alert when new update available
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
    const dialogOpts = {
      type: 'info',
      buttons: ['Restart now', 'Later'],
      title: 'Update available',
      message: process.platform === 'win32' ? releaseNotes : releaseName,
      detail: 'A new version of this application has been downloaded, restart it to apply the updates.'
    }

    dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) autoUpdater.quitAndInstall()
    })
  })

  //Log errors
  autoUpdater.on('error', message => {
    console.error('There was a problem updating the application')
    console.error(message)
  })

  return mainWindow;
}

try {

  console.log('Line 87');
  app.allowRendererProcessReuse = true;

  console.log('Line 90');
  app.on('ready', () => {
    console.log('Line 92');
    //Register custom file protocol
    protocol.registerFileProtocol('app', (request, callback) => {
      const url = request.url.substr(6, request.url.length)
      callback({ path: app.getPath('userData') + '/storage/' + url })
    }, (error) => {
      if (error) console.error('Failed to register protocol')
    });

    console.log('Line 101');
    //400 ms - fixes black background issue see https://github.com/electron/electron/issues/15947
    console.log('Line 103');
    setTimeout(createWindow, 400);
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // Create window on activate
  app.on('activate', () => {
    console.log('Line 116');
    if (mainWindow === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  console.log(e);
  console.log('Line 124');
  throw e;
}

// Set api routes
ipcMain.on('epub-list', () => { listEpub(); });
ipcMain.on('epub-upload', () => { uploadEpub(); });
ipcMain.on('epub-get', (event, id) => { getEpub(id); });
ipcMain.on('slides-get', (event) => { updateSlides(); });
ipcMain.on('slides-display', (event) => { toggleDisplay(); });
ipcMain.on('epub-get-page', (event, id, page) => { parseEpubPage(id, page); });
ipcMain.on('slides-control', (event, action, ...args) => { controlDisplay(action, ...args); });
ipcMain.on('slides-update', (event, selectedEpub = null, slideList = null) => { updateSlides(selectedEpub, slideList); });