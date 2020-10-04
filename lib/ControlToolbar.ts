import * as url from 'url';
import * as path from 'path';
import NeDB = require('nedb');
import { serve, mainWindow } from '../main';
import { BrowserWindow, app, screen } from 'electron';

export let toolbarWindow;
let toolbarOptions = {
    display: true,
    x: 0,
    y: 0
}

const optionsStorage = new NeDB({ filename: app.getPath('userData') + '/storage/preferences', autoload: true });

app.on('ready', () => {
    //Set toolbar options on startup
    optionsStorage.findOne({ _id: 'toolbar' }, (err, doc) => {
        toolbarOptions = doc ? doc.values : toolbarOptions;
    });
})

export function showToolbar() {
    //Create toolbar window
    if (!toolbarWindow) {
        toolbarWindow = new BrowserWindow({
            width: 370,
            height: 52,
            x: toolbarOptions.x,
            y: toolbarOptions.y,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                allowRunningInsecureContent: (serve) ? true : false,
            },
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false,
            icon: __dirname + '/../icon.ico'
        });

        //Remove menu
        toolbarWindow.removeMenu();

        //Check that the toolbar isn't out bounds
        let winBounds = mainWindow.getBounds();
        let activeScreen = screen.getDisplayNearestPoint({ x: winBounds.x, y: winBounds.y });
        if ((toolbarOptions.x > activeScreen.bounds.width) || (toolbarOptions.y > activeScreen.bounds.height)) {
            toolbarWindow.setBounds({ x:0, y: 0 });
        }

        //Electron config
        if (serve) {
            toolbarWindow.webContents.openDevTools();
            require('electron-reload')(__dirname, {
                electron: require(`${__dirname}/../node_modules/electron`)
            });
            toolbarWindow.loadURL('http://localhost:4200#controller/toolbar');
        } else {
            toolbarWindow.loadURL(url.format({
                pathname: path.join(__dirname, '../dist/index.html'),
                protocol: 'file:',
                hash: 'controller/toolbar',
                slashes: true
            }));
        }

        //Listen for winow move to launch in same place
        toolbarWindow.on('move', function () {
            toolbarOptions.x = toolbarWindow.getBounds().x;
            toolbarOptions.y = toolbarWindow.getBounds().y;
            optionsStorage.update({ _id: 'toolbar' }, { _id: 'toolbar', values: toolbarOptions }, { upsert: true });
        });
    } else {
        toolbarWindow.setAlwaysOnTop(true);
        toolbarWindow.restore();
    }
}

export function hideToolbar() {
    toolbarWindow.setAlwaysOnTop(false);
    toolbarWindow.minimize();
}