import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { SlidesService } from '../../services/slides.service';
import { ElectronService } from 'ngx-electron';

@Component({
    selector: 'help',
    styleUrls: ['./help.component.scss'],
    templateUrl: './help.component.html',
})

export class HelpComponent implements OnInit {

    contents = { list: [], active: 0, activeHtml: '' };

    constructor(
        private http: HttpClient,
        public slidesService: SlidesService,
        private electronService: ElectronService,
        private changeDetector: ChangeDetectorRef
    ) { }

    ngOnInit() {
        //Load help docs
        if (this.contents.list.length == 0) {
            this.http.get('http://01coding.co.uk/meeting-display/docs/contents.json').subscribe((contents: any) => {
                this.contents.list = contents;
                this.selectHelpGuide(0);
            });
        }
    }

    selectHelpGuide(index) {
        if (this.contents.list[index].link.includes('.html')) {
            this.contents.active = index;
            this.http.get('http://01coding.co.uk/meeting-display/docs/' + this.contents.list[index].link, { responseType: "text" }).subscribe((html: any) => {
                this.contents.activeHtml = html;
            });
        } else {
            this.electronService.shell.openExternal(this.contents.list[index].link);
        }
    }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';

@NgModule({
    declarations: [HelpComponent],
    imports: [CommonModule, SharedModule]
})
class HelpModule { }
