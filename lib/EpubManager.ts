import fs = require('fs');
import path = require('path');
import NeDB = require('nedb');
import glob = require('glob');
import { mainWindow, storagePath } from '../main';
import extract = require('extract-zip');
import { parse } from 'node-html-parser';
import { parseEpub } from '@gxl/epub-parser';
import { dialog, app } from 'electron';
import console = require('console');

const storage = new NeDB({ filename: app.getPath('userData') + '/storage/epubs', autoload: true });

export function uploadEpub() {
    //Open Epub
    dialog.showOpenDialog({ 
        properties: ['openFile'], 
        filters: [{ name: 'ePub files', extensions: ['epub'] }],
    }).then((result) => {
        try {
            if(result.canceled == false) {
                //Activate loading state
                mainWindow.webContents.send('epub-upload');

                //Import epub
                parseEpub(result.filePaths[0], {
                    type: 'path',
                }).then((ePub) => {
                    //Copy file as zip
                    let filename = path.basename(result.filePaths[0]).replace('.epub', '');
                    fs.mkdirSync(`${storagePath}${filename}`, { recursive: true });
                    fs.writeFile(`${storagePath}${filename}/epub.zip`, fs.readFileSync(result.filePaths[0]), (err) => {
                        //Return error
                        if (err) throw err;
                        
                        //Extract zip folder
                        extract(`${storagePath}${filename}/epub.zip`, { dir: `${storagePath}${filename}` }).then(() => {
                            //Search for cover image
                            glob(`{${storagePath}${filename}/OEBPS/images/*_cvr.jpg,${storagePath}${filename}/OEBPS/images/${filename}.jpg}`, {}, (err, images) => {
                                //Get publication type
                                let type = (/nwt(.*)/g.test(filename)) ? 'bible' : 'pub'
                                
                                //Check if pub
                                if(type == 'pub') {
                                    //Insert pub
                                    storage.insert({
                                        id: filename,
                                        type: type,
                                        title: ePub.info.title,
                                        author: ePub.info.publisher,
                                        structure: JSON.stringify(ePub.structure),
                                        image: `${filename}/OEBPS/images/${path.basename(images[0])}`,
                                    });
                                } else {
                                    //Insert bible
                                    storage.insert({
                                        id: filename,
                                        type: type,
                                        title: ePub.info.title,
                                        author: ePub.info.publisher,
                                        structure: (() => {
                                            //Read bible book nav file instead
                                            let html = fs.readFileSync(`${storagePath}${filename}/OEBPS/biblebooknav.xhtml`, { encoding: 'utf8' });
                                            
                                            //Return error
                                            if (err) throw err;

                                            //Parse dom
                                            let htmlDom = parse(html);

                                            //Gather scripture footnotes
                                            let books = [];
                                            htmlDom.querySelectorAll('.w_bibleBook a').forEach((book) => {
                                                books.push({ 
                                                    name: book.innerHTML,
                                                    path: book.getAttribute('href'),
                                                });
                                            });

                                            return JSON.stringify(books);
                                        })(),
                                        image: `${filename}/OEBPS/images/${path.basename(images[0])}`,
                                    });
                                }

                                //Send data to ui
                                listEpubs();
                            });
                        });
                    });
                });
            }
        } catch(e) {
            console.log(e);
        }
    });
}

export function removeEpub(id) {
    //Show confirm dialog and remove
    dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: ['Yes', 'No'],
        title: 'Confirm',
        message: 'Are you sure you want to delete this publication?'
    }).then((result) => {
        if(result.response == 0) { 
            fs.rmdir(`${storagePath}${id}`, { recursive: true }, () => {
                storage.remove({ id: id }, {}, (err) => {
                    mainWindow.webContents.send('epub-remove', true);
                });
            });
        } else {
            mainWindow.webContents.send('epub-remove', false);
        }
    });
}

export function listEpubs() {
    // Find all documents in the collection
    storage.find({}, (err, docs) => {
        mainWindow.webContents.send('epub-list', docs || []);
    });
}

export function listEpubsFiltered(filters) {
    // Find all documents in the collection
    storage.find({ title: { $regex: new RegExp(filters.title.toLowerCase(), 'i') } }, (err, docs) => {
        console.log(docs);
        mainWindow.webContents.send('epub-list', docs || []);
    });
}

export function getEpub(id) {
    // Find document by id
    storage.find({ id: id }, (err, docs) => {
        docs[0].structure = JSON.parse(docs[0].structure);
        console.log(docs);
        mainWindow.webContents.send('epub-get', docs[0]);
    });
}

export function parseEpubPage(id, page) {
    //Get all paragraphs in a page
    fs.readFile(`${storagePath}${id}/OEBPS/${page}`, { encoding: 'utf8'}, (err, html) => {
        //Return error
        if (err) throw err;

        //Parse dom
        let htmlDom = parse(html);

        //Gather scripture footnotes
        let scriptures = {};
        htmlDom.querySelectorAll('div.extScrpCite').forEach((scripture) => {
            scriptures[scripture.getAttribute('id')] = {
                type: 'scripture',
                name: scripture.querySelector('strong').text,
                text: scripture.querySelector('.extScrpCiteTxt') ? scripture.querySelector('.extScrpCiteTxt').toString().replace(/<a(.*?)(<\/strong>)/g, '') : ''
            };
        });

        //Gather content
        let content = [];
        htmlDom.querySelectorAll('.pGroup p').forEach((paragraph) => {
            //Add to final array
            content.push({
                name: null,
                text: paragraph.toString(),
                type: paragraph.classNames.includes('qu') ? 'question' : 'paragraph'
            });
            
            //Add scriptures below (child elements won't work in dragula)
            (paragraph.toString().match(/(href="#citation)([0-9]{0,3})/gm) || []).forEach((scripture) => {
                let citationId = scripture.replace('href="#', '');
                content.push(scriptures[citationId]);
                delete scriptures[citationId];
            });
        });
        
        //Dump unused scriptures at end of content array
        content = content.concat(Object.values(scriptures));

        //Return data
        mainWindow.webContents.send('epub-get-page', { content: content });
    });
}

export function getEpubPageRef(id, ref) {
    console.log(ref);
    //Get text by reference (current use for bible only)
    fs.readFile(`${storagePath}${id}/OEBPS/${ref.bookPath}`, { encoding: 'utf8' }, (err, html) => {
        //Return error
        if (err) throw err;

        //Gather chapter path
        let htmlDom = parse(html);
        let chapters = htmlDom.querySelectorAll('.w_bibleChapter a');

        //Check if chapter is valid
        if(ref.chapter > chapters.length - 1) {
            mainWindow.webContents.send('bibleepub-get-ref', { error: 'The chapter number you have entered does not exist' });
        }

        //Check for one chapter books
        if(chapters.length !== 0) {
            //Get chapter path
            let chapterNav = chapters.find((chapter) => {
                return chapter.text == ref.chapter;
            }).getAttribute('href');

            //Get chapter verses html
            html = fs.readFileSync(`${storagePath}${id}/OEBPS/${chapterNav}`, { encoding: 'utf8' });
            htmlDom = parse(html);
        }

        //Get chapter verses
        let verseHTML = Array.from(htmlDom.querySelectorAll('p')).filter(el => el.hasAttribute('data-pid'));
        let verseHTMLString = verseHTML.map(function (paragraph) { return paragraph.innerHTML; }).join(" ");
        let verses = verseHTMLString.split(/<span id="chapter(?:[0-9]{1,3})_verse(?:[0-9]{1,3})"><\/span>/);

        //Return selected verses
        let selectedVerses = [];
        ref.verses = ref.verses.replace(/\s/g, '');
        ref.verses.match(/([0-9]{0,3}-[0-9]{0,3})|([0-9]{0,3})/g).forEach(match => {
            if (match !== "") { 
                //Create string containing verses
                let text = '';
                if(match.includes('-')) {
                    console.log('-')
                    text = verses.slice(parseInt(match.split('-')[0]), parseInt(match.split('-')[1]) + 1).join(' ');
                } else {
                    text = verses[parseInt(match)];
                }

                //Check if selection is valid
                if(!text) mainWindow.webContents.send('bibleepub-get-ref', { error: 'One or more of the entered verses does not exist'});

                //Clean text before adding
                text = text.replace(/<a href="([0-9]{0,15}).xhtml#footnotesource([0-9]{0,10})">[^] <span class="footnoteref">([A-z0-9.: ]{0,40}<\/span><\/a> )/g, '');
                selectedVerses.push({ text: text, name: `${ref.book} ${ref.chapter}:${match}`});
            }
        });
        
        mainWindow.webContents.send('bibleepub-get-ref', selectedVerses);
    });
}