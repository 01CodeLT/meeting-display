import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisplayControllerComponent } from './display-controller.component';

describe('DisplayControllerComponent', () => {
  let component: DisplayControllerComponent;
  let fixture: ComponentFixture<DisplayControllerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayControllerComponent]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisplayControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
