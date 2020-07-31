"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var url = require("url");
var path = require("path");
var NeDB = require("nedb");
var main_1 = require("../main");
var electron_1 = require("electron");
var epub;
var slides = [];
var displayOptions = {
    fontSize: 40,
    textAlign: 'center',
    fontColor: '#696969',
    fontLinkColor: '#4271BD',
    bgType: 'color',
    bgColor: '#fff',
    display: {
        selected: 1,
        list: []
    }
};
var optionsStorage = new NeDB({ filename: electron_1.app.getPath('userData') + '/storage/preferences', autoload: true });
electron_1.app.on('ready', function () {
    //Set display options and listen for changes
    electron_1.screen.on('display-added', function () { updateDisplayOptions(null); });
    electron_1.screen.on('display-removed', function () { updateDisplayOptions(null); });
});
function getDisplayList() {
    return Array.from({ length: electron_1.screen.getAllDisplays().length }, function (e, i) { return (i + 1); });
}
function controlDisplay(action) {
    var _a;
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    (_a = exports.displayWindow.webContents).send.apply(_a, __spreadArrays(['slides-control', action], args));
}
exports.controlDisplay = controlDisplay;
function updateDisplayOptions(updatedOptions) {
    if (updatedOptions == null) {
        //Get saved options
        optionsStorage.findOne({ _id: 'display' }, function (err, doc) {
            displayOptions = doc ? doc.values : displayOptions;
            displayOptions.display.list = getDisplayList();
            main_1.mainWindow.webContents.send('slides-options', displayOptions);
            if (exports.displayWindow)
                exports.displayWindow.webContents.send('slides-options', displayOptions);
        });
    }
    else {
        //Move display to selected
        if (updatedOptions.display.selected !== displayOptions.display.selected) {
            //Close window
            if (exports.displayWindow) {
                exports.displayWindow.close();
                exports.displayWindow = null;
                displayOptions = updatedOptions;
                toggleDisplay();
            }
        }
        else {
            displayOptions = updatedOptions;
        }
        //Update options
        optionsStorage.update({ _id: 'display' }, { _id: 'display', values: updatedOptions }, { upsert: true }, function (err, numReplaced, upsert) {
            displayOptions.display.list = getDisplayList();
            if (exports.displayWindow)
                exports.displayWindow.webContents.send('slides-options', displayOptions);
        });
    }
}
exports.updateDisplayOptions = updateDisplayOptions;
function updateSlides(selectedEpub, slideList) {
    if (selectedEpub === void 0) { selectedEpub = null; }
    if (slideList === void 0) { slideList = null; }
    epub = selectedEpub || epub;
    slides = slideList || slides;
    if (exports.displayWindow) {
        exports.displayWindow.webContents.send('slides-update', epub, slides);
    }
}
exports.updateSlides = updateSlides;
function toggleDisplay() {
    if (!exports.displayWindow) {
        //Create window if not exists
        var externalDisplay = electron_1.screen.getAllDisplays()[displayOptions.display.selected - 1];
        //Create externalDisplay
        if (externalDisplay) {
            exports.displayWindow = new electron_1.BrowserWindow({
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y,
                webPreferences: {
                    webSecurity: false,
                    nodeIntegration: true,
                    allowRunningInsecureContent: (main_1.serve) ? true : false,
                },
                fullscreen: true,
                title: 'Meeting display',
                icon: __dirname + '/../icon.ico'
            });
            //Set as fullscreen
            exports.displayWindow.maximize();
            exports.displayWindow.removeMenu();
            //Electron config
            if (main_1.serve) {
                exports.displayWindow.webContents.openDevTools();
                require('electron-reload')(__dirname, {
                    electron: require(__dirname + "/../node_modules/electron")
                });
                exports.displayWindow.loadURL('http://localhost:4200#display');
            }
            else {
                exports.displayWindow.loadURL(url.format({
                    pathname: path.join(__dirname, '../dist/index.html'),
                    protocol: 'file:',
                    hash: 'display',
                    slashes: true
                }));
            }
        }
    }
    else {
        exports.displayWindow.close(); //Close window
        exports.displayWindow = null;
    }
}
exports.toggleDisplay = toggleDisplay;
//# sourceMappingURL=DisplaySlide.js.map