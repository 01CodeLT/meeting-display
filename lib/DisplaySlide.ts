import * as url from 'url';
import * as path from 'path';
import { mainWindow, serve } from '../main';
import { BrowserWindow, ipcMain, screen } from 'electron';

let epub;
let slides = [];
let displayWindow;

export function controlDisplay(action, ...args) {
    displayWindow.webContents.send('slides-control', action, ...args);
}

export function updateSlides(selectedEpub = null, slideList = null) {
    epub = selectedEpub || epub;
    slides = slideList || slides;
    if(displayWindow) {
        displayWindow.webContents.send('slides-update', 
            epub, slides
        );
    }
}

export function toggleDisplay() {
    if(!displayWindow) {
        //Create window if not exists
        let externalDisplay = screen.getAllDisplays().find((display) => {
            return display.bounds.x !== 0 || display.bounds.y !== 0
        })

        if (externalDisplay) {
            //Create externalDisplay
            displayWindow = new BrowserWindow({
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y,
                webPreferences: {
                    webSecurity: false,
                    nodeIntegration: true,
                    allowRunningInsecureContent: (serve) ? true : false,
                },
                title: 'Meeting display',
                icon: __dirname + '/../icon.ico'
            });

            //Set as fullscreen
            displayWindow.maximize();
            displayWindow.removeMenu();
            displayWindow.setFullScreen(true);

            //Electron config
            if (serve) {
                displayWindow.webContents.openDevTools();
                require('electron-reload')(__dirname, {
                    electron: require(`${__dirname}/../node_modules/electron`)
                });
                displayWindow.loadURL('http://localhost:4200/display');
            } else {
                displayWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'dist/index.html/#display'),
                    protocol: 'file:',
                    slashes: true
                }));
            }
        }
    } else {
        displayWindow.close(); //Close window
        displayWindow = null;
    }
}