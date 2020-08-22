import * as url from 'url';
import * as path from 'path';
import NeDB = require('nedb');
import { serve, mainWindow } from '../main';
import { BrowserWindow, screen, app } from 'electron';

let epub;
let slides = [];
export let displayWindow;
let displayOptions = {
    fontSize: 40,
    textAlign: 'center',
    fontColor: '#696969',
    fontLinkColor: '#4271BD',
    bgType: 'color', //Can be 'color' or 'pub'
    bgColor: '#fff',
    display: {
        selected: 1,
        list: []
    }
}
const optionsStorage = new NeDB({ filename: app.getPath('userData') + '/storage/preferences', autoload: true });

app.on('ready', () => {
    //Set display options and listen for changes
    screen.on('display-added', () => { updateDisplayOptions(null); });
    screen.on('display-removed', () => { updateDisplayOptions(null); })
})

function getDisplayList() {
    return Array.from({ length: screen.getAllDisplays().length }, (e, i) => (i + 1));
}

export function controlDisplay(action, ...args) {
    displayWindow.webContents.send('slides-control', action, ...args);
}

export function updateDisplayOptions(updatedOptions) {
    if (updatedOptions == null) {
        //Get saved options
        optionsStorage.findOne({ _id: 'display' }, (err, doc) => {
            displayOptions = doc ? doc.values : displayOptions;
            displayOptions.display.list = getDisplayList();
            mainWindow.webContents.send('slides-options', displayOptions);
            if (displayWindow) displayWindow.webContents.send('slides-options', displayOptions);
        });
    } else {
        //Move display to selected
        console.log(updatedOptions);
        console.log(displayOptions);
        if(updatedOptions.display.selected !== displayOptions.display.selected) {
            //Close window
            if(displayWindow) {
                displayWindow.close(); 
                displayWindow = null;
                displayOptions = updatedOptions;
                toggleDisplay();
            }
        } else {
            displayOptions = updatedOptions;
        }

        //Update options
        optionsStorage.update({ _id: 'display' }, { _id: 'display', values: updatedOptions }, { upsert: true }, (err, numReplaced, upsert) => {
            displayOptions.display.list = getDisplayList();
            if (displayWindow) displayWindow.webContents.send('slides-options', displayOptions);
        });
    }
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
        let externalDisplay = screen.getAllDisplays()[displayOptions.display.selected - 1]

        //Create externalDisplay
        if (externalDisplay) {
            displayWindow = new BrowserWindow({
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y,
                webPreferences: {
                    webSecurity: false,
                    nodeIntegration: true,
                    allowRunningInsecureContent: (serve) ? true : false,
                },
                fullscreen: true,
                title: 'Meeting display',
                icon: __dirname + '/../icon.ico'
            });

            //Set as fullscreen
            displayWindow.maximize();
            displayWindow.removeMenu();

            //Electron config
            if (serve) {
                displayWindow.webContents.openDevTools();
                require('electron-reload')(__dirname, {
                    electron: require(`${__dirname}/../node_modules/electron`)
                });
                displayWindow.loadURL('http://localhost:4200#display');
            } else {
                displayWindow.loadURL(url.format({
                    pathname: path.join(__dirname, '../dist/index.html'),
                    protocol: 'file:',
                    hash: 'display',
                    slashes: true
                }));
            }
        }
    } else {
        displayWindow.close(); //Close window
        displayWindow = null;
    }
}