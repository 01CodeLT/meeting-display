import * as url from 'url';
import * as path from 'path';
import { serve, mainWindow, optionsStorage } from '../main';
import { BrowserWindow, screen, app } from 'electron';

let epub;
let slideshow = { slides: [], active: 0 };
export let displayWindow: BrowserWindow;
let displayOptions = {
    fontSize: 40,
    textAlign: 'center',
    fontColor: '#696969',
    fontLinkColor: '#4271BD',
    bgType: 'pub', //Can be 'color' or 'pub'
    bgColor: '#fff',
    display: {
        selected: 1,
        list: []
    }
}

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
            mainWindow.webContents.send('slides-options', displayOptions);
            if (displayWindow) displayWindow.webContents.send('slides-options', displayOptions);
        });
    }
}

export function getSlides(event) {
    //Send slides to window
    event.sender.webContents.send('slides-update', epub, slideshow);
}

export function updateSlides(event, updatedEpub = null, updatedSlideshow = null) {
    epub = updatedEpub || epub;
    slideshow = updatedSlideshow || slideshow;

    //Publish event to other windows
    BrowserWindow.getAllWindows().forEach(window => {
        if(window.id !== event.sender.id) {
            window.webContents.send('slides-update', epub, slideshow);
        }
    });
}

export function toggleDisplay() {
    if(!displayWindow) {
        //Create window if not exists
        let displays = screen.getAllDisplays();
        let externalDisplay = (displayOptions.display.selected > displays.length) ?  displays[0] : displays[displayOptions.display.selected - 1];

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
                title: 'Meeting display'
            });

            //Set as fullscreen
            displayWindow.maximize();
            displayWindow.removeMenu();

            //Listen for escape
            displayWindow.webContents.on('before-input-event', (event, input) => {
                if (input.key == 'Escape') { toggleDisplay(); }
            });

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