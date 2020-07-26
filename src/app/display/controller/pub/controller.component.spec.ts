import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PubControllerComponent } from './controller.component';

describe('PubControllerComponent', () => {
  let component: PubControllerComponent;
  let fixture: ComponentFixture<PubControllerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PubControllerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PubControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
