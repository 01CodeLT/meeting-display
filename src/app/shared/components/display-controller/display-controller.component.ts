import { Component, OnInit } from '@angular/core';
import { SlidesService } from '../../services/slides.service';

@Component({
  selector: 'display-controller',
  templateUrl: './display-controller.component.html',
  styleUrls: ['./display-controller.component.scss']
})
export class DisplayControllerComponent implements OnInit {

  constructor(
    public slidesService: SlidesService,
  ) { }

  ngOnInit() {}
}
