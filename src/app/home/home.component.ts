import { Router } from '@angular/router';
import { ElectronService } from 'ngx-electron';
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ModalService } from '../shared/services/modal.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  epubs = [];
  loading = true;
  filters = { title: '' }

  constructor(
    private zone: NgZone,
    private router: Router,
    private modalService: ModalService,
    private electronService: ElectronService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.electronService.ipcRenderer.send('epub-list');
    this.electronService.ipcRenderer.on('epub-list', (event, epubs) => {
      //Set epubs
      this.epubs = epubs;
      this.loading = false;
      this.changeDetector.detectChanges();

      //If no epubs open help
      this.zone.run(() => {
        if (epubs.length == 0) { this.modalService.open('help'); }
      });
    });
  }

  searchTimeout;
  filterEpubList() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.electronService.ipcRenderer.send('epub-list-filter', this.filters);
    }, 300);
  }

  openEpub(epub) {
    this.zone.run(() => {
      this.router.navigateByUrl(`/controller/${epub.type}/${epub.id}`);
    });
  }

  uploadEpub() {
    this.electronService.ipcRenderer.send('epub-upload');
    this.electronService.ipcRenderer.once('epub-upload', (event) => {
      this.loading = true;
      this.changeDetector.detectChanges();
    }); 
  }

  removeEpub(id) {
    this.loading = true;
    this.electronService.ipcRenderer.send('epub-remove', id);
    this.electronService.ipcRenderer.once('epub-remove', (event, status) => {
      this.loading = false;
      if(status == true) {
        this.epubs.splice(this.epubs.findIndex(epub => epub.id == id), 1);
      }
      this.changeDetector.detectChanges();
    });
  }
}
