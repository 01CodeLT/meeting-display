import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { ControllerComponent } from '../controller.component';
import { SlidesService, Epub } from '../../../shared/services/slides.service';

@Component({
  selector: 'app-bible-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['../controller.component.scss']
})
export class BibleControllerComponent extends ControllerComponent implements OnInit {

  error = null;
  selection = { bookIndex: null, bookPath: '', book: '', chapter: null, verses: '' };

  constructor(
    public slidesService: SlidesService,
    public electronService: ElectronService,
    public changeDetector: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute,
  ) { super(slidesService, electronService, changeDetector) }

  ngOnInit() {
    //Get epub content
    super.ngOnInit();
    this.activatedRoute.params.subscribe((params: Params) => {
      this.electronService.ipcRenderer.send('epub-get', params['id']);
      this.electronService.ipcRenderer.once('epub-get', (event, epub) => {
        this.epub = epub;
        this.changeDetector.detectChanges();
      });
    });
  }

  selectBook(event) {
    if (!event.keyCode || [37,38,39,40].includes(event.keyCode)) {
      if (event.keyCode) {
        //Select via index
        switch(event.keyCode) {
          case 37: 
            this.selection.bookIndex--;
            break;
          case 38:
            this.selection.bookIndex -= 7;
            break;
          case 39: 
            this.selection.bookIndex++;
            break;
          case 40:
            this.selection.bookIndex += 7;
            break;
        }
      } else {
        //Move with arrows
        this.selection.bookIndex = event;
      }

      this.selection.bookPath = this.epub.structure[this.selection.bookIndex].path;
      this.selection.book = this.epub.structure[this.selection.bookIndex].name;
      this.changeDetector.detectChanges();
    }
  }

  addScripture() {
    this.electronService.ipcRenderer.send('bibleepub-get-ref', this.epub.id, this.selection);
    this.electronService.ipcRenderer.once('bibleepub-get-ref', (event, content) => {
      if(content.error) {
        this.error = content.error;
      } else {
        this.error = null;
        content.forEach((item) => {
          this.slideshow.slides.push({ 
            uid: Math.floor(Math.random() * 1000 + Date.now()),
            spans: 1, 
            activeSpan: 0, 
            text: item.text, 
            name: (item.name || null) 
          });
        });
        this.slidesService.updateSlides(this.epub, this.slideshow);
      }
      this.changeDetector.detectChanges();
    });
  }

  ngOnDestroy() {
    //Reset slides
    this.slidesService.updateSlides(this.epub, { slides: [], active: 0 });
  }
}
