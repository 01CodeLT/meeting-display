"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url = require("url");
var path = require("path");
var main_1 = require("../main");
var DisplaySlide_1 = require("./DisplaySlide");
var electron_1 = require("electron");
var toolbarOptions = {
    display: true,
    x: 0,
    y: 0
};
electron_1.app.on('ready', function () {
    //Set toolbar options on startup
    DisplaySlide_1.optionsStorage.findOne({ _id: 'toolbar' }, function (err, doc) {
        toolbarOptions = doc ? doc.values : toolbarOptions;
    });
});
function showToolbar() {
    //Create toolbar window
    if (!exports.toolbarWindow) {
        exports.toolbarWindow = new electron_1.BrowserWindow({
            width: 370,
            height: 52,
            x: toolbarOptions.x,
            y: toolbarOptions.y,
            webPreferences: {
                webSecurity: false,
                nodeIntegration: true,
                allowRunningInsecureContent: (main_1.serve) ? true : false,
            },
            frame: false,
            transparent: true,
            alwaysOnTop: true,
            resizable: false
        });
        //Remove menu
        exports.toolbarWindow.removeMenu();
        //Check that the toolbar isn't out bounds
        var winBounds = main_1.mainWindow.getBounds();
        var activeScreen = electron_1.screen.getDisplayNearestPoint({ x: winBounds.x, y: winBounds.y });
        if ((toolbarOptions.x > activeScreen.bounds.width) || (toolbarOptions.y > activeScreen.bounds.height)) {
            exports.toolbarWindow.setBounds({ x: 0, y: 0 });
        }
        //Electron config
        if (main_1.serve) {
            exports.toolbarWindow.webContents.openDevTools();
            require('electron-reload')(__dirname, {
                electron: require(__dirname + "/../node_modules/electron")
            });
            exports.toolbarWindow.loadURL('http://localhost:4200#controller/toolbar');
        }
        else {
            exports.toolbarWindow.loadURL(url.format({
                pathname: path.join(__dirname, '../dist/index.html'),
                protocol: 'file:',
                hash: 'controller/toolbar',
                slashes: true
            }));
        }
        //Listen for winow move to launch in same place
        exports.toolbarWindow.on('move', function () {
            toolbarOptions.x = exports.toolbarWindow.getBounds().x;
            toolbarOptions.y = exports.toolbarWindow.getBounds().y;
            DisplaySlide_1.optionsStorage.update({ _id: 'toolbar' }, { _id: 'toolbar', values: toolbarOptions }, { upsert: true });
        });
    }
    else {
        exports.toolbarWindow.setAlwaysOnTop(true);
        exports.toolbarWindow.restore();
    }
}
exports.showToolbar = showToolbar;
function hideToolbar() {
    exports.toolbarWindow.setAlwaysOnTop(false);
    exports.toolbarWindow.minimize();
}
exports.hideToolbar = hideToolbar;
//# sourceMappingURL=ControlToolbar.js.map