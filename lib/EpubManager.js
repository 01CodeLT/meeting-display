"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var NeDB = require("nedb");
var glob = require("glob");
var main_1 = require("../main");
var extract = require("extract-zip");
var node_html_parser_1 = require("node-html-parser");
var epub_parser_1 = require("@gxl/epub-parser");
var electron_1 = require("electron");
var storage = new NeDB({ filename: electron_1.app.getPath('userData') + '/storage/epubs', autoload: true });
function uploadEpub() {
    //Open Epub
    electron_1.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'ePub files', extensions: ['epub'] }],
    }).then(function (result) {
        if (result.canceled == false) {
            //Activate loading state
            main_1.mainWindow.webContents.send('epub-upload');
            //Import epub
            epub_parser_1.parseEpub(result.filePaths[0], {
                type: 'path',
            }).then(function (ePub) {
                //Copy file as zip
                var filename = path.basename(result.filePaths[0]).replace('.epub', '');
                fs.mkdirSync("" + main_1.storagePath + filename, { recursive: true });
                fs.writeFile("" + main_1.storagePath + filename + "/epub.zip", fs.readFileSync(result.filePaths[0]), function (err) {
                    //Return error
                    if (err)
                        throw err;
                    //Extract zip folder
                    extract("" + main_1.storagePath + filename + "/epub.zip", { dir: "" + main_1.storagePath + filename }).then(function () {
                        //Search for cover image
                        glob("{" + main_1.storagePath + filename + "/OEBPS/images/*_cvr.jpg," + main_1.storagePath + filename + "/OEBPS/images/" + filename + ".jpg}", {}, function (err, images) {
                            //Insert data
                            storage.insert({
                                id: filename,
                                type: 'pub',
                                title: ePub.info.title,
                                author: ePub.info.publisher,
                                structure: JSON.stringify(ePub.structure),
                                image: filename + "/OEBPS/images/" + path.basename(images[0]),
                            });
                            //Send data to ui
                            listEpubs();
                        });
                    });
                });
            });
        }
    });
}
exports.uploadEpub = uploadEpub;
function removeEpub(id) {
    electron_1.dialog.showMessageBox(main_1.mainWindow, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to delete this publication?'
    }).then(function (result) {
        if (result.response == 0) {
            fs.rmdir("" + main_1.storagePath + id, { recursive: true }, function () {
                storage.remove({ id: id }, {}, function (err) {
                    main_1.mainWindow.webContents.send('epub-remove', true);
                });
            });
        }
        else {
            main_1.mainWindow.webContents.send('epub-remove', false);
        }
    });
}
exports.removeEpub = removeEpub;
function listEpubs() {
    // Find all documents in the collection
    storage.find({}, function (err, docs) {
        main_1.mainWindow.webContents.send('epub-list', docs || []);
    });
}
exports.listEpubs = listEpubs;
function listEpubsFiltered(filters) {
    // Find all documents in the collection
    console.log(filters);
    storage.find({ title: { $regex: new RegExp(filters.title.toLowerCase(), 'i') } }, function (err, docs) {
        console.log(docs);
        main_1.mainWindow.webContents.send('epub-list', docs || []);
    });
}
exports.listEpubsFiltered = listEpubsFiltered;
function getEpub(id) {
    // Find all documents in the collection
    storage.find({ id: id }, function (err, docs) {
        docs[0].structure = JSON.parse(docs[0].structure);
        main_1.mainWindow.webContents.send('epub-get', docs[0]);
    });
}
exports.getEpub = getEpub;
function parseEpubPage(id, page) {
    fs.readFile("" + main_1.storagePath + id + "/OEBPS/" + page, { encoding: 'utf8' }, function (err, html) {
        //Return error
        if (err)
            throw err;
        //Parse dom
        var htmlDom = node_html_parser_1.parse(html);
        //Gather scripture footnotes
        var scriptures = {};
        htmlDom.querySelectorAll('div.extScrpCite').forEach(function (scripture) {
            scriptures[scripture.getAttribute('id')] = {
                type: 'scripture',
                name: scripture.querySelector('strong').text,
                text: scripture.querySelector('.extScrpCiteTxt') ? scripture.querySelector('.extScrpCiteTxt').toString().replace(/<a(.*?)(<\/strong>)/g, '') : ''
            };
        });
        //Gather content
        var content = [];
        htmlDom.querySelectorAll('.pGroup p').forEach(function (paragraph) {
            //Add to final array
            content.push({
                name: null,
                text: paragraph.toString(),
                type: paragraph.classNames.includes('qu') ? 'question' : 'paragraph'
            });
            //Add scriptures below (child elements won't work in dragula)
            (paragraph.toString().match(/(href="#citation)([0-9]{0,3})/gm) || []).forEach(function (scripture) {
                var citationId = scripture.replace('href="#', '');
                content.push(scriptures[citationId]);
                delete scriptures[citationId];
            });
        });
        //Dump unused scriptures at end of content array
        content = content.concat(Object.values(scriptures));
        //Return data
        main_1.mainWindow.webContents.send('epub-get-page', {
            images: htmlDom.querySelectorAll('.img'),
            content: content,
        });
    });
}
exports.parseEpubPage = parseEpubPage;
//# sourceMappingURL=EpubManager.js.map