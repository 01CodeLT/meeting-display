import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

export interface Epub {
    id: string;
    title: string;
    image: string;
    author: string;
    structure?: Array<{
        name: string;
        path: string;
        playOrder: string;
    }>;
    structure_filtered?: Array<{
        name: string;
        path: string;
        playOrder: string;
    }>;
}

@Injectable()
export class SlidesService {

    constructor(private electronService: ElectronService) {}

    public updateSlides(epub, slides) {
        this.electronService.ipcRenderer.send('slides-update', {
            id: epub.id,
            type: epub.type,
            title: epub.title,
            image: epub.image,
            author: epub.author
        }, slides);
    }

    public displaySlides() {
        this.electronService.ipcRenderer.send('slides-display');
    }

    public controlSlides(action, ...args) {
        this.electronService.ipcRenderer.send('slides-control', action, ...args);
    }
}