import { Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  epubs = [];
  loading = true;

  constructor(
    private zone: NgZone,
    private router: Router,
    private electronService: ElectronService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.electronService.ipcRenderer.send('epub-list');
    this.electronService.ipcRenderer.on('epub-list', (event, epubs) => {
      this.epubs = epubs;
      this.loading = false;
      this.changeDetector.detectChanges();
    });
  }

  openEpub(epub) {
    this.zone.run(() => {
      this.router.navigateByUrl(`/display/controller/${epub.id}`);
    });
  }

  uploadEpub() {
    this.electronService.ipcRenderer.send('epub-upload');
    this.electronService.ipcRenderer.once('epub-upload', (event) => {
      this.loading = true;
      this.changeDetector.detectChanges();
    });
  }

}
