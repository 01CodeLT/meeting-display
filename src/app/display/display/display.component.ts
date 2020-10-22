import { DOCUMENT } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, Inject, NgZone } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { Epub, SlidesService } from '../../shared/services/slides.service';

@Component({
    selector: 'app-display',
    templateUrl: './display.component.html',
    styleUrls: ['./display.component.scss']
})
export class DisplayComponent implements OnInit {
    
    @ViewChild('textElement') textElement: ElementRef;
    customStyleTag;
    
    epub: Epub;
    slideshow = { slides: [], active: null };
    settings: any = { fontSize: 0, lineHeight: 0, numLines: 6, textHeight: 200, textY: 0 };

    constructor(
        @Inject(DOCUMENT) private doc,
        private slidesService: SlidesService,
        private electronService: ElectronService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {}

    ngAfterViewInit() {
        //Listen for slides update
        this.electronService.ipcRenderer.on('slides-update', (event, epub, slideshow) => {
            //Set epub, slides
            this.epub = epub;

            //Find previous slide or reset to 0
            console.log(this.slideshow.slides, this.slideshow.slides[this.slideshow.active]);
            let prevSlide = slideshow.slides.findIndex(
                (slide) => slide.uid == (this.slideshow.slides[this.slideshow.active] ? this.slideshow.slides[this.slideshow.active].uid : null)
            );
            console.log(prevSlide);
            this.slideshow.active = (prevSlide >= 0) ? prevSlide : 0;
            console.log(this.slideshow.active)
            //Set slides and run change detection
            this.slideshow.slides = slideshow.slides;
            this.changeDetector.detectChanges();

            //Recalculate text height
            this.calcTextHeight();
        });
        this.electronService.ipcRenderer.send('slides-update');

        //Listen for slide controls
        this.electronService.ipcRenderer.on('slides-control', (event, action, ...args) => {
            //Convert action to camelCase and run
            action = action.replace(/([-])+\S/g, match => match.toUpperCase().replace('-', ''));
            this[action](...args);
        });

        //Create and append custom style tag for settings
        this.customStyleTag = this.doc.createElement('style');
        this.doc.head.appendChild(this.customStyleTag);

        //Listen for slide display options
        this.electronService.ipcRenderer.on('slides-options', (event, options) => {
            
            //Calculate max line number and set height
            this.settings.lineHeight = options.fontSize * 1.25;
            this.settings.numLines = Math.floor((window.innerHeight * 0.5) / this.settings.lineHeight);

            //Set style based on settings (not possible with ng style)
            this.customStyleTag.innerHTML = `
                .display {
                    color: ${options.fontColor};
                    font-size: ${options.fontSize}px;
                    background-color: ${options.bgColor};
                    line-height: ${this.settings.lineHeight}px;
                }
                .display .text-clip { text-align: ${options.textAlign}; }
                .display a { color: ${options.fontLinkColor}; }
            `;
            console.log(options);
            setTimeout(() => {
                //Reset slides
                this.changeDetector.detectChanges();
                if(this.settings.fontSize !== options.fontSize) {
                    this.slideshow.active = 0;
                    this.electronService.ipcRenderer.send('slides-update');
                }

                //Assign settings
                this.settings = Object.assign(this.settings, options);
                this.changeDetector.detectChanges();
            }, 500);
        });
        this.electronService.ipcRenderer.send('slides-options');
    }

    calcTextHeight() {
        //Calculate number of lines
        this.changeDetector.detectChanges();
        let textHeight = this.textElement.nativeElement.offsetHeight;
        let numLines = Math.ceil(textHeight / this.settings.lineHeight);
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
                this.slideshow.slides[this.slideshow.active].activeSpan = 0;
            }
        } else {
            activeSlide.activeSpan++;
        }

        //Set y axis and change detection
        this.settings.textY = (this.settings.lineHeight * this.settings.numLines) * (this.slideshow.slides[this.slideshow.active].activeSpan);
        this.slidesService.updateSlides(this.epub, this.slideshow);
        this.changeDetector.detectChanges();
    }

    previousSlide() {
        //Check for slide or next span
        let activeSlide = this.slideshow.slides[this.slideshow.active];
        if (activeSlide.activeSpan == 0) {
            if (this.slideshow.slides[this.slideshow.active - 1]) {
                //Move slides backward
                this.slideshow.active--;
                this.calcTextHeight();
                this.slideshow.slides[this.slideshow.active].activeSpan = this.slideshow.slides[this.slideshow.active].spans - 1;
            }
        } else {
            activeSlide.activeSpan--;
        }

        //Set y axis and change detection
        this.settings.textY = (this.settings.lineHeight * this.settings.numLines) * (this.slideshow.slides[this.slideshow.active].activeSpan);
        this.slidesService.updateSlides(this.epub, this.slideshow);
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
        this.slidesService.updateSlides(this.epub, this.slideshow);
        this.changeDetector.detectChanges();
    }
}
