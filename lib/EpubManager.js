"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var NeDB = require("nedb");
var cp = require("child_process");
var main_1 = require("../main");
var node_html_parser_1 = require("node-html-parser");
var electron_1 = require("electron");
var storage = new NeDB({ filename: electron_1.app.getPath('userData') + '/storage/epubs', autoload: true });
function uploadEpub() {
    //Open Epub
    electron_1.dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'ePub files', extensions: ['epub'] }],
    }).then(function (result) {
        try {
            if (result.canceled == false) {
                //Activate loading state
                main_1.mainWindow.webContents.send('epub-upload');
                //Setup import process in background
                var importProc = cp.fork(path.resolve(__dirname, 'workers/ImportEpub'));
                importProc.on('message', function (_a) {
                    var status = _a.status, _b = _a.data, data = _b === void 0 ? null : _b;
                    //Show error or insert into db
                    if (status == false) {
                        //Log error
                        console.error(data);
                        //Show error
                        electron_1.dialog.showMessageBox(main_1.mainWindow, {
                            message: 'An error occured whilst importing this publication...'
                        });
                    }
                    else {
                        //Record event
                        main_1.Nucleus.track("EPUB_IMPORTED", { title: data.title });
                        //Add to database
                        storage.insert(data);
                    }
                    //Reload epubs and kill process
                    listEpubs();
                    importProc.kill('SIGKILL');
                });
                //Run import process
                importProc.send({
                    storagePath: main_1.storagePath,
                    filePath: result.filePaths[0]
                });
            }
        }
        catch (e) {
            //Log error
            console.error(e);
            //Show error
            electron_1.dialog.showMessageBox(main_1.mainWindow, {
                message: 'An error occured whilst importing this publication...'
            });
        }
    });
}
exports.uploadEpub = uploadEpub;
function removeEpub(id) {
    //Show confirm dialog and remove
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
    storage.find({ title: { $regex: new RegExp(filters.title.toLowerCase(), 'i') } }, function (err, docs) {
        main_1.mainWindow.webContents.send('epub-list', docs || []);
    });
}
exports.listEpubsFiltered = listEpubsFiltered;
function getEpub(id) {
    // Find document by id
    storage.find({ id: id }, function (err, docs) {
        docs[0].structure = JSON.parse(docs[0].structure);
        main_1.mainWindow.webContents.send('epub-get', docs[0]);
    });
}
exports.getEpub = getEpub;
function parseEpubPage(id, page) {
    //Get all paragraphs in a page
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
        main_1.mainWindow.webContents.send('epub-get-page', { content: content });
    });
}
exports.parseEpubPage = parseEpubPage;
function getEpubPageRef(id, ref) {
    //Get text by reference (current use for bible only)
    fs.readFile("" + main_1.storagePath + id + "/OEBPS/" + ref.bookPath, { encoding: 'utf8' }, function (err, html) {
        //Return error
        if (err)
            throw err;
        //Gather chapter path
        var htmlDom = node_html_parser_1.parse(html);
        var chapters = htmlDom.querySelectorAll('.w_bibleChapter a');
        //Check if chapter is valid
        if (ref.chapter > (chapters.length == 0 ? 1 : chapters.length - 1)) {
            main_1.mainWindow.webContents.send('bibleepub-get-ref', { error: 'The chapter number you have entered does not exist' });
        }
        //Check for one chapter books
        if (chapters.length !== 0) {
            //Get chapter path
            var chapterNav = chapters.find(function (chapter) {
                return chapter.text == ref.chapter;
            }).getAttribute('href');
            //Get chapter verses html
            html = fs.readFileSync("" + main_1.storagePath + id + "/OEBPS/" + chapterNav, { encoding: 'utf8' });
            htmlDom = node_html_parser_1.parse(html);
        }
        //Get chapter verses
        var verseHTML = Array.from(htmlDom.querySelectorAll('p')).filter(function (el) { return el.hasAttribute('data-pid'); });
        var verseHTMLString = verseHTML.map(function (paragraph) { return paragraph.innerHTML; }).join(" ");
        var verses = verseHTMLString.split(/<span id="chapter(?:[0-9]{1,3})_verse(?:[0-9]{1,3})"><\/span>/);
        //Return selected verses
        var selectedVerses = [];
        ref.verses = ref.verses.replace(/\s/g, '');
        ref.verses.match(/([0-9]{0,3}-[0-9]{0,3})|([0-9]{0,3})/g).forEach(function (match) {
            if (match !== "") {
                //Create string containing verses
                var text = '';
                if (match.includes('-')) {
                    text = verses.slice(parseInt(match.split('-')[0]), parseInt(match.split('-')[1]) + 1).join(' ');
                }
                else {
                    text = verses[parseInt(match)];
                }
                //Check if selection is valid
                if (!text)
                    main_1.mainWindow.webContents.send('bibleepub-get-ref', { error: 'One or more of the entered verses does not exist' });
                //Clean text before adding
                text = text.replace(/<a href="([0-9]{0,15}).xhtml#footnotesource([0-9]{0,10})">[^] <span class="footnoteref">([A-z0-9.: ]{0,40}<\/span><\/a> )|<a epub:type="noteref" ((target="_blank" )?)href="#footnote([0-9]{1,3})">[*]<\/a>/g, '');
                selectedVerses.push({ text: text, name: ref.book + " " + ref.chapter + ":" + match });
            }
        });
        main_1.mainWindow.webContents.send('bibleepub-get-ref', selectedVerses);
    });
}
exports.getEpubPageRef = getEpubPageRef;
//# sourceMappingURL=EpubManager.js.map