const fs = require('fs');
const path = require('path');
const glob = require('glob');
const extract = require('extract-zip');
const { parse } = require('node-html-parser');
const { parseEpub } = require('@gxl/epub-parser');

process.on('uncaughtException', (err) => {
    console.log(err);
    process.send({ status: false });
});

process.on('message', ({storagePath, filePath}) => {
    //Import epub
    parseEpub(filePath, {
        type: 'path',
    }).then((ePub) => {
        //Copy file as zip
        let filename = path.basename(filePath).replace('.epub', '');
        fs.mkdirSync(`${storagePath}${filename}`, { recursive: true });

        //Extract zip folder
        extract(filePath, { dir: `${storagePath}${filename}` }).then(() => {
            //Search for cover image
            glob(`{${storagePath}${filename}/OEBPS/images/*_cvr.jpg,${storagePath}${filename}/OEBPS/images/${filename}.jpg}`, {}, (err, images) => {
                //Get publication type
                let type = (/nwt(.*)/g.test(filename)) ? 'bible' : 'pub'

                //Check if pub
                if (type == 'pub') {
                    //Insert pub
                    process.send({
                        status: true,
                        data: {
                            id: filename,
                            type: type,
                            title: ePub.info.title,
                            author: ePub.info.publisher,
                            structure: JSON.stringify(ePub.structure),
                            image: `${filename}/OEBPS/images/${path.basename(images[0])}`,
                        }
                    });
                } else {
                    //Insert bible
                    process.send({
                        status: true,
                        data: {
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
                            image: `${filename}/OEBPS/images/${path.basename(images[0])}`
                        }
                    });
                }
            });
        });
    });
});