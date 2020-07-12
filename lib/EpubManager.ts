import fs = require('fs');
import path = require('path');
import NeDB = require('nedb');
import glob = require('glob');
import { mainWindow, storagePath } from '../main';
import extract = require('extract-zip');
import { parse } from 'node-html-parser';
import { parseEpub } from '@gxl/epub-parser';
import { dialog, app, ipcMain } from 'electron';

const storage = new NeDB({ filename: app.getPath('userData') + '/storage/epubs', autoload: true });

export function uploadEpub() {
    //Open Epub
    dialog.showOpenDialog({ 
        properties: ['openFile'], 
        filters: [{ name: 'ePub files', extensions: ['epub', 'jwpub'] }],
    }).then((result) => {
        if(result.canceled == false) {
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
                        glob(`${storagePath}${filename}/OEBPS/images/*_cvr.jpg`, {}, (err, images) => {
                            //Insert data
                            storage.insert({
                                id: filename,
                                title: ePub.info.title,
                                author: ePub.info.publisher,
                                structure: JSON.stringify(ePub.structure),
                                image: `${filename}/OEBPS/images/${path.basename(images[0])}`,
                            });

                            //Send data to ui
                            listEpub();
                        });
                    });
                });
            });
        }
    });
}

export function listEpub() {
    // Find all documents in the collection
    storage.find({}, (err, docs) => {
        mainWindow.webContents.send('epub-list', docs);
    });
}

export function getEpub(id) {
    // Find all documents in the collection
    storage.find({ id: id }, (err, docs) => {
        docs[0].structure = JSON.parse(docs[0].structure);
        mainWindow.webContents.send('epub-get', docs[0]);
    });
}

export function parseEpubPage(id, page) {
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
                text: scripture.querySelector('.extScrpCiteTxt').toString().replace(/<a(.*?)(<\/strong>)/g, '')
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
                content.push(scriptures[scripture.replace('href="#', '')]);
            });
        });

        //Return data
        mainWindow.webContents.send('epub-get-page', {
            images: htmlDom.querySelectorAll('.img'),
            content: content,
        });
    });
}