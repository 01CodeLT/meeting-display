import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { Epub } from '../controller/controller.component';
import * as console from 'console';

@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit {
    
    @ViewChild('textElement') textElement: ElementRef;
    
    epub: Epub;
    slideshow = { slides: [], active: 0 };
    settings = { fontSize: 40, lineHeight: 0, numLines: 6, textHeight: 200, textY: 0 };

    constructor(
        private electronService: ElectronService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {}

    ngAfterViewInit() {
        //Calculate max line number and set height
        this.settings.lineHeight = this.settings.fontSize * 1.25;
        this.settings.numLines = Math.floor((window.innerHeight * 0.5) / this.settings.lineHeight);

        //Send initial request and listen for slides update
        this.electronService.ipcRenderer.send('slides-update');
        this.electronService.ipcRenderer.on('slides-update', (event, epub, slides) => {
            //Set epub, slides
            this.epub = epub;
            this.slideshow.slides = slides;
            this.changeDetector.detectChanges();
            
            //Display slide
            this.calcTextHeight();
        });

        //Listen for slide controls
        this.electronService.ipcRenderer.on('slides-control', (event, action, ...args) => {
            //Convert action to camelCase and run
            action = action.replace(/([-])+\S/g, match => match.toUpperCase().replace('-', ''));
            this[action](...args);
        });
    }

    calcTextHeight() {
        //Calculate number of lines
        this.changeDetector.detectChanges();
        let textHeight = this.textElement.nativeElement.offsetHeight;
        let numLines = Math.floor(textHeight / this.settings.lineHeight);
        this.settings.textHeight = numLines >= this.settings.numLines ? (this.settings.numLines * this.settings.lineHeight) : textHeight; 
        this.slideshow.slides[this.slideshow.active].spans = Math.ceil(numLines / this.settings.numLines);
        this.changeDetector.detectChanges();
    }
 
    nextSlide() {
        //Check for slide or next span
        let activeSlide = this.slideshow.slides[this.slideshow.active];
        if (activeSlide.activeSpan == (activeSlide.spans - 1)) {
            if (this.slideshow.slides[this.slideshow.active + 1]) {
                //Move slides forward
                this.slideshow.active++;
                this.calcTextHeight();
            }
        } else {
            activeSlide.activeSpan++;
        }

        //Set y axis and change detection
        this.settings.textY = (this.settings.lineHeight * this.settings.numLines) * (this.slideshow.slides[this.slideshow.active].activeSpan);
        this.changeDetector.detectChanges();
    }

    previousSlide() {
        //Check for slide or next span
        let activeSlide = this.slideshow.slides[this.slideshow.active];
        if (activeSlide.activeSpan == 0) {
            if (this.slideshow.slides[this.slideshow.active - 1]) {
                //Move slides forward
                this.slideshow.active--;
                this.calcTextHeight();
            }
        } else {
            activeSlide.activeSpan--;
        }

        //Set y axis and change detection
        this.settings.textY = (this.settings.lineHeight * this.settings.numLines) * (this.slideshow.slides[this.slideshow.active].activeSpan);
        this.changeDetector.detectChanges();
    }

    switchSlide(index) {
        //Set slide active span
        this.slideshow.slides[this.slideshow.active].activeSpan = (index > this.slideshow.active) ? (this.slideshow.slides[this.slideshow.active].spans - 1) : 0;
        
        //Start new slide from beginning
        this.slideshow.active = index;
        this.slideshow.slides[this.slideshow.active].activeSpan = 0;

        //Set y axis
        this.calcTextHeight();
        this.settings.textY = (this.settings.lineHeight * this.settings.numLines) * (this.slideshow.slides[this.slideshow.active].activeSpan);
        this.changeDetector.detectChanges();
    }
}
