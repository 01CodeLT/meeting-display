import { Component, OnInit, NgZone, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

import { FuiModalService, TemplateModalConfig, ModalTemplate } from 'ngx-fomantic-ui';
import { SlidesService } from '../../../shared/services/slides.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'menu-layout',
  templateUrl: './menu-layout.component.html',
  styleUrls: ['./menu-layout.component.scss']
})
export class MenuLayoutComponent implements OnInit {

  window = { maximizable: false };
  settings = {
    fontSize: 40,
    fontColor: '#696969',
    fontLinkColor: '#4271BD',
    textAlign: 'center',
    bgType: 'pub', //Can be 'color' or 'pub'
    bgColor: '#fff',
    display: {
      selected: 1,
      list: []
    }
  };
  
  @ViewChild('settingsModal', { static: false }) settingsModal: ModalTemplate<any, string, string>

  constructor(
    private zone: NgZone,
    private router: Router,
    public slidesService: SlidesService,
    public modalService: FuiModalService,
    private electronService: ElectronService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    //Check if window can be maximised
    this.window.maximizable = !this.electronService.remote.getCurrentWindow().isMaximized();

    //Initialise display options
    this.electronService.ipcRenderer.send('slides-options');
    this.electronService.ipcRenderer.on('slides-options', (event, options) => {
      this.settings = options;
      this.changeDetector.detectChanges();
    });
  }

  uploadEpub() {
    this.zone.run(() => { this.router.navigateByUrl(`/`); });
    this.electronService.ipcRenderer.send('epub-upload');
  }

  openSettings() {
    const config = new TemplateModalConfig<any, string, string>(this.settingsModal);
    this.modalService.open(config);
  }

  updateOptions() {
    this.electronService.ipcRenderer.send('slides-options', this.settings);
  }

  /* Window events */
  minimizeWindow() {
    this.electronService.remote.getCurrentWindow().minimize();
  }

  maximizeWindow() {
    let mainWindow = this.electronService.remote.getCurrentWindow();
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
      this.window.maximizable = true;
    } else {
      mainWindow.maximize();
      this.window.maximizable = false;
    }
  }

  closeWindow() {
    this.electronService.remote.getCurrentWindow().close();
  }
}
