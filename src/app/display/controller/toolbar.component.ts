import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { SlidesService, Epub } from '../../shared/services/slides.service';

@Component({
    selector: 'app-toolbar',
    template: `
    <div class="ui menu toolbar">
        <div class="item">
            <button class="ui button" (click)="slidesService.displaySlides()" title="Show/close slideshow on second screen">Toggle display</button>
        </div>
        <div class="item">
            <button class="ui icon button" (click)="slidesService.controlSlides('previous-slide')" title="Switch to previous slide">
                <i class="icon angle left"></i>
            </button>
        </div>
        <div class="item">
            <button class="ui icon button" (click)="slidesService.controlSlides('next-slide')" title="Switch to next slide">
                <i class="icon angle right"></i>
            </button>
        </div>
        <div class="item window-drag" title="Move toolbar">
            <i class="icon arrows alternate"></i>
        </div>
    </div>`,
    styles: [`
        body {
            overflow: hidden;
            background: transparent;
        }    
        .ui.segment {
            border: 0px !important;
            padding: 0px !important;
            background: transparent;
        }
        .toolbar { 
            width: fit-content;
            margin-left: 1px !important;
            border: 1px solid #9e9e9e !important;
        }
        .window-drag { 
            font-size: 1.2rem;
            -webkit-app-region: drag;
            color: rgba(0,0,0,.6) !important;
        }
    `],
    encapsulation: ViewEncapsulation.None
})
export class ToolbarComponent implements OnInit {

    constructor(
        public slidesService: SlidesService
    ) { }

    ngOnInit() {}
}
