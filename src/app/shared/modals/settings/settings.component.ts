import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SlidesService } from '../../../shared/services/slides.service';
import { ElectronService } from 'ngx-electron';
import { FuiModal } from 'ngx-fomantic-ui';

@Component({
    selector: 'settings',
    styleUrls: ['./settings.component.scss'],
    templateUrl: './settings.component.html',
    providers: [FuiModal]
})

export class SettingsComponent implements OnInit {

    settings = {
        fontSize: 40,
        fontColor: '#696969',
        fontLinkColor: '#4271BD',
        textAlign: 'center',
        bgType: 'pub', //Can be 'color' or 'pub'
        bgColor: '#fff',
        display: {
            selected: 1,
            windowed: false,
            list: []
        }
    };

    constructor(
        public slidesService: SlidesService,
        private electronService: ElectronService,
        private changeDetector: ChangeDetectorRef,
        public modal: FuiModal<string, string>
    ) { }

    ngOnInit() {
        //Initialise display options
        this.electronService.ipcRenderer.send('slides-options');
        this.electronService.ipcRenderer.on('slides-options', (event, options) => {
            this.settings = options;
            this.changeDetector.detectChanges();
        });
    }

    updateOptions() {
        this.electronService.ipcRenderer.send('slides-options', this.settings);
    }
}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared.module';

@NgModule({
    declarations: [SettingsComponent],
    imports: [CommonModule, SharedModule],
    providers: []
})
class SettingsModule { }
