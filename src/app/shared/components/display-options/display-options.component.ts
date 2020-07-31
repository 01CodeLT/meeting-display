import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from 'ngx-electron';

@Component({
  selector: 'display-options',
  templateUrl: './display-options.component.html',
  styleUrls: ['./display-options.component.scss']
})
export class DisplayOptionsComponent implements OnInit {

  options = {
    fontSize: 40,
    fontColor: '#696969',
    fontLinkColor: '#4271BD',
    textAlign: 'center',
    display: {
      selected: 1,
      list: []
    }
  };

  constructor(
    private changeDetector: ChangeDetectorRef,
    private electronService: ElectronService,
  ) { }

  ngOnInit() {
    //Get display options
    this.electronService.ipcRenderer.send('slides-options');
    this.electronService.ipcRenderer.on('slides-options', (event, options) => {
      this.options = options;
      this.changeDetector.detectChanges();
    });
  }

  updateOptions() {
    this.electronService.ipcRenderer.send('slides-options', this.options);
  }
}
