import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { DragulaService } from 'ng2-dragula';
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

@Component({
  selector: 'app-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['./controller.component.scss']
})
export class ControllerComponent implements OnInit {

  epub: Epub;
  epubPage = { content: [] };
  slideshow = { slides: [], active: 0 };

  constructor(
    private dragulaService: DragulaService,
    private activatedRoute: ActivatedRoute,
    private electronService: ElectronService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      this.electronService.ipcRenderer.send('epub-get', params['id']);
      this.electronService.ipcRenderer.once('epub-get', (event, epub) => {
        this.epub = epub;
        this.epub.structure_filtered = epub.structure;
        this.changeDetector.detectChanges();
      });
    });

    this.dragulaService.createGroup('DRAGULA_FACTS', {
      copy: (el, source) => {
        return source.id === 'left';
      },
      copyItem: (item) => {
        return { spans: 1, activeSpan: 0, text: item.text, name: (item.name || null) };
      },
      accepts: (el, target, source, sibling) => {
        // To avoid dragging from right to left container
        return target.id !== 'left';
      }
    });
  }

  searchTimeout;
  searchPages(keyword: string) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if(keyword == '') {
        this.epub.structure_filtered = this.epub.structure;
      } else {
        keyword = keyword.toLowerCase(); 
        this.epub.structure_filtered = this.epub.structure.filter(page => page.name.toLowerCase().includes(keyword) );
      }
    }, 600);
  }

  selectPage(page) {
    this.electronService.ipcRenderer.send('epub-get-page', this.epub.id, page);
    this.electronService.ipcRenderer.once('epub-get-page', (event, page) => {
      this.epubPage = page;
      this.changeDetector.detectChanges();
    });
  }

  updateSlides() {
    this.electronService.ipcRenderer.send('slides-update', {
      id: this.epub.id,
      title: this.epub.title,
      image: this.epub.image,
      author: this.epub.author
    }, this.slideshow.slides);
  }
  
  addAllSlides() {
    //Filter slides
    let slides = [];
    this.epubPage.content.forEach((item) => {
      if(item.type == 'paragraph') {
        slides.push({ spans: 1, activeSpan: 0, text: item.text, name: (item.name || null) });
      }
    });
    
    //Add to final array
    this.slideshow.slides = this.slideshow.slides.concat(slides);
    this.updateSlides();
  }

  removeSlide(index) {
    this.slideshow.slides.splice(index, 1);
    this.updateSlides();
  }

  displaySlides() {
    this.electronService.ipcRenderer.send('slides-display');
  }

  controlSlides(action, ...args) {
    this.electronService.ipcRenderer.send('slides-control', action, ...args);
  }
}
