import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { SlidesService } from '../../../shared/services/slides.service';
import { ModalService } from '../../services/modal.service';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'menu-layout',
  templateUrl: './menu-layout.component.html',
  styleUrls: ['./menu-layout.component.scss']
})
export class MenuLayoutComponent implements OnInit {

  window = { maximizable: false };

  constructor(
    private zone: NgZone,
    private router: Router,
    public modalService: ModalService,
    public slidesService: SlidesService,
    public electronService: ElectronService
  ) {}

  ngOnInit() {
    //Check if window can be maximised
    this.window.maximizable = !this.electronService.remote.getCurrentWindow().isMaximized();
  }

  uploadEpub() {
    this.zone.run(() => { this.router.navigateByUrl(`/`); });
    this.electronService.ipcRenderer.send('epub-upload');
  }

  /* Window events */
  minimizeWindow() {
    this.electronService.remote.getCurrentWindow().minimize();
  }

  maximizeWindow() {
    let mainWindow = this.electronService.remote.getCurrentWindow();
    if (mainWindow.isMaximized()) {
      console.log('restore');
      mainWindow.restore();
      this.window.maximizable = true;
    } else {
      console.log('maximize');
      mainWindow.maximize();
      this.window.maximizable = false;
    }
  }

  closeWindow() {
    this.electronService.remote.getCurrentWindow().close();
  }
}
