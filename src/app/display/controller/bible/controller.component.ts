import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { ElectronService } from 'ngx-electron';
import { SlidesService, Epub } from '../../../shared/services/slides.service';

@Component({
  selector: 'app-bible-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['../controller.component.scss']
})
export class BibleControllerComponent implements OnInit {

  epub: Epub;
  slideshow = { slides: [], active: 0 };
  selection = { bookIndex: null, book: '', chapter: null, verses: '' };

  constructor(
    private activatedRoute: ActivatedRoute,
    private electronService: ElectronService,
    private changeDetector: ChangeDetectorRef,
    public slidesService: SlidesService
  ) { }

  ngOnInit() {
    //Get epub content
    this.activatedRoute.params.subscribe((params: Params) => {
      this.electronService.ipcRenderer.send('epub-get', params['id']);
      this.electronService.ipcRenderer.once('epub-get', (event, epub) => {
        this.epub = epub;
        this.changeDetector.detectChanges();
      });
    });
  }

  selectBook(event) {
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

    this.selection.book = this.epub.structure[this.selection.bookIndex].path;
    this.changeDetector.detectChanges();
  }

  addScripture() {
    this.electronService.ipcRenderer.send('epub-get-ref', this.epub.id, this.selection);
    this.electronService.ipcRenderer.once('epub-get-ref', (event, refText) => {
      console.log(refText);
      this.changeDetector.detectChanges();
    });
  }
}
