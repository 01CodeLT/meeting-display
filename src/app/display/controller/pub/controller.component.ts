import { ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';

import { DragulaService } from 'ng2-dragula';
import { ElectronService } from 'ngx-electron';
import { ControllerComponent } from '../controller.component';
import { SlidesService, Epub } from '../../../shared/services/slides.service';

@Component({
  selector: 'app-pub-controller',
  templateUrl: './controller.component.html',
  styleUrls: ['../controller.component.scss']
})
export class PubControllerComponent extends ControllerComponent implements OnInit {

  epubPage = { content: [] };

  constructor(
    public slidesService: SlidesService,
    public electronService: ElectronService,
    public changeDetector: ChangeDetectorRef,
    private dragulaService: DragulaService,
    private activatedRoute: ActivatedRoute,
  ) { super(slidesService, electronService, changeDetector) }

  ngOnInit() {
    //Get epub content
    super.ngOnInit();
    this.activatedRoute.params.subscribe((params: Params) => {
      this.electronService.ipcRenderer.send('epub-get', params['id']);
      this.electronService.ipcRenderer.once('epub-get', (event, epub) => {
        this.epub = epub;
        this.epub.structure_filtered = epub.structure;
        this.changeDetector.detectChanges();
      });
    });

    //Setup dragula
    this.dragulaService.createGroup('DRAGULA_SLIDES', {
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
    slides = this.slideshow.slides.concat(slides);
    this.slidesService.updateSlides(this.epub, slides);
  }

  ngOnDestroy() {
    this.dragulaService.destroy('DRAGULA_FACTS');
  }
}
