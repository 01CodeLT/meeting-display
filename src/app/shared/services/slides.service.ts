import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { ElectronService } from 'ngx-electron';

export interface Epub {
    id: string;
    type: string;
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

    private epub;
    public slideshowSource = new BehaviorSubject({ slides: [], active: 0 });
    slideshow = this.slideshowSource.asObservable();

    constructor(private electronService: ElectronService) {}

    public updateSlides(epub, slides) {
        //Update variables
        this.epub = {
            id: epub.id,
            type: epub.type,
            title: epub.title,
            image: epub.image,
            author: epub.author
        };
        this.slideshowSource.next({ slides: slides, active: this.slideshowSource.value.active });

        //Send to electron app
        this.electronService.ipcRenderer.send('slides-update', this.epub, slides);
    }

    public removeSlide(index) {
        let slideshow = this.slideshowSource.value;
        slideshow.slides.splice(index, 1);
        this.updateSlides(this.epub, slideshow.slides);
    }

    public removeAllSlides() {
        this.updateSlides(this.epub, []);
    }

    public displaySlides() {
        this.electronService.ipcRenderer.send('slides-display');
    }

    public controlSlides(action, ...args) {
        this.electronService.ipcRenderer.send('slides-control', action, ...args);
    }
}