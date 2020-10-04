import { ElectronService } from 'ngx-electron';
import { SlidesService, Epub } from '../../shared/services/slides.service';
import { ChangeDetectorRef, Component, HostListener } from '@angular/core';

@Component({
    selector: 'app-controller',
    template: ``,
})
export class ControllerComponent {

    epub: Epub;
    slideshow = { slides: [], active: 0 };

    constructor(
        public slidesService: SlidesService,
        public electronService: ElectronService,
        public changeDetector: ChangeDetectorRef,
    ) { }

    ngOnInit() {
        //Listen for slideshow updates
        this.slidesService.slideshow.subscribe((slideshow) => {
            this.slideshow = slideshow;
            this.changeDetector.detectChanges();
        });
    }

    @HostListener('document:visibilitychange', ['$event'])
    visibilityChange() {
        this.electronService.ipcRenderer.send('toggle-toolbar', document.hidden);
    }
}
