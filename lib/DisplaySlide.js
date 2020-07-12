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
var main_1 = require("../main");
var electron_1 = require("electron");
var epub;
var slides = [];
var displayWindow;
function controlDisplay(action) {
    var _a;
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    (_a = displayWindow.webContents).send.apply(_a, __spreadArrays(['slides-control', action], args));
}
exports.controlDisplay = controlDisplay;
function updateSlides(selectedEpub, slideList) {
    if (selectedEpub === void 0) { selectedEpub = null; }
    if (slideList === void 0) { slideList = null; }
    epub = selectedEpub || epub;
    slides = slideList || slides;
    if (displayWindow) {
        displayWindow.webContents.send('slides-update', epub, slides);
    }
}
exports.updateSlides = updateSlides;
function toggleDisplay() {
    if (!displayWindow) {
        //Create window if not exists
        var externalDisplay = electron_1.screen.getAllDisplays().find(function (display) {
            return display.bounds.x !== 0 || display.bounds.y !== 0;
        });
        if (externalDisplay) {
            //Create externalDisplay
            displayWindow = new electron_1.BrowserWindow({
                x: externalDisplay.bounds.x,
                y: externalDisplay.bounds.y,
                webPreferences: {
                    webSecurity: false,
                    nodeIntegration: true,
                    allowRunningInsecureContent: (main_1.serve) ? true : false,
                },
                title: 'Meeting display',
                icon: __dirname + '/../icon.ico'
            });
            //Set as fullscreen
            displayWindow.maximize();
            displayWindow.removeMenu();
            displayWindow.setFullScreen(true);
            //Electron config
            if (main_1.serve) {
                displayWindow.webContents.openDevTools();
                require('electron-reload')(__dirname, {
                    electron: require(__dirname + "/../node_modules/electron")
                });
                displayWindow.loadURL('http://localhost:4200/display');
            }
            else {
                displayWindow.loadURL(url.format({
                    pathname: path.join(__dirname, 'dist/index.html/#display'),
                    protocol: 'file:',
                    slashes: true
                }));
            }
        }
    }
    else {
        displayWindow.close(); //Close window
        displayWindow = null;
    }
}
exports.toggleDisplay = toggleDisplay;
//# sourceMappingURL=DisplaySlide.js.map