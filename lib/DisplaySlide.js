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
var merge = require("lodash/merge");
var main_1 = require("../main");
var electron_1 = require("electron");
var epub;
var slideshow = { slides: [], active: 0 };
var displayOptions = {
    fontSize: 40,
    textAlign: 'center',
    fontColor: '#696969',
    fontLinkColor: '#4271BD',
    bgType: 'pub',
    bgColor: '#fff',
    display: {
        windowed: false,
        selected: 1,
        list: []
    }
};
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
        main_1.optionsStorage.findOne({ _id: 'display' }, function (err, doc) {
            console.log(merge(displayOptions, doc.values), doc.values);
            displayOptions = doc ? merge(displayOptions, doc.values) : displayOptions;
            displayOptions.display.list = getDisplayList();
            main_1.mainWindow.webContents.send('slides-options', displayOptions);
            if (exports.displayWindow)
                exports.displayWindow.webContents.send('slides-options', displayOptions);
        });
    }
    else {
        //Move display to selected
        if (updatedOptions.display.selected !== displayOptions.display.selected
            || updatedOptions.display.windowed !== displayOptions.display.windowed) {
            //Set selected display
            var displays = electron_1.screen.getAllDisplays();
            var externalDisplay = (updatedOptions.display.selected > displays.length) ? displays[0] : displays[updatedOptions.display.selected - 1];
            exports.displayWindow.setBounds({
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y
            });
            //Change to windowed mode?
            exports.displayWindow.setFullScreen(!updatedOptions.display.windowed);
            if (updatedOptions.display.windowed == false)
                exports.displayWindow.maximize();
        }
        //Update options
        displayOptions = updatedOptions;
        main_1.optionsStorage.update({ _id: 'display' }, { _id: 'display', values: updatedOptions }, { upsert: true }, function (err, numReplaced, upsert) {
            displayOptions.display.list = getDisplayList();
            main_1.mainWindow.webContents.send('slides-options', displayOptions);
            if (exports.displayWindow)
                exports.displayWindow.webContents.send('slides-options', displayOptions);
        });
    }
}
exports.updateDisplayOptions = updateDisplayOptions;
function getSlides(event) {
    //Send slides to window
    event.sender.webContents.send('slides-update', epub, slideshow);
}
exports.getSlides = getSlides;
function updateSlides(event, updatedEpub, updatedSlideshow) {
    if (updatedEpub === void 0) { updatedEpub = null; }
    if (updatedSlideshow === void 0) { updatedSlideshow = null; }
    epub = updatedEpub || epub;
    slideshow = updatedSlideshow || slideshow;
    //Publish event to other windows
    electron_1.BrowserWindow.getAllWindows().forEach(function (window) {
        if (window.id !== event.sender.id) {
            window.webContents.send('slides-update', epub, slideshow);
        }
    });
}
exports.updateSlides = updateSlides;
function toggleDisplay() {
    if (!exports.displayWindow) {
        //Create window if not exists
        var displays = electron_1.screen.getAllDisplays();
        var externalDisplay = (displayOptions.display.selected > displays.length) ? displays[0] : displays[displayOptions.display.selected - 1];
        //Create externalDisplay
        if (externalDisplay) {
            exports.displayWindow = new electron_1.BrowserWindow({
                title: 'Meeting display',
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y,
                webPreferences: {
                    webSecurity: false,
                    nodeIntegration: true,
                    allowRunningInsecureContent: (main_1.serve) ? true : false,
                },
                fullscreen: !displayOptions.display.windowed,
                frame: false
            });
            //Emitted when window closed
            exports.displayWindow.on('closed', function () {
                exports.displayWindow = null;
            });
            //Set as fullscreen
            if (displayOptions.display.windowed == false)
                exports.displayWindow.maximize();
            //Listen for escape
            exports.displayWindow.webContents.on('before-input-event', function (event, input) {
                if (input.key == 'Escape') {
                    toggleDisplay();
                }
            });
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