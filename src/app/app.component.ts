import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  toggles = { menu: false, addEpub: false };

  constructor() {}

  ngOnInit() {}
}
