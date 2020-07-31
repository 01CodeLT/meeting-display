import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SlidesService, Epub } from '../../../shared/services/slides.service';

import { DragulaService } from 'ng2-dragula';
import { ElectronService } from 'ngx-electron';
import { clearTimeout, setTimeout } from 'timers';


@Component({
  selector: 'app-pub-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['../controller.component.scss']
})
export class PubControllerComponent implements OnInit {

  epub: Epub;
  epubPage = { content: [] };
  slideshow = { slides: [], active: 0 };

  constructor(
    private dragulaService: DragulaService,
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
        this.epub.structure_filtered = epub.structure;
        this.changeDetector.detectChanges();
      });
    });

    //Setup dragula
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
    this.slidesService.updateSlides(this.epub, this.slideshow.slides);
  }

  removeSlide(index) {
    this.slideshow.slides.splice(index, 1);
    this.slidesService.updateSlides(this.epub, this.slideshow.slides);
  }

  ngOnDestroy() {
    this.dragulaService.destroy('DRAGULA_FACTS');
  }
}
