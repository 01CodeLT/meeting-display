import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BibleControllerComponent } from './controller.component';

describe('BibleControllerComponent', () => {
  let component: BibleControllerComponent;
  let fixture: ComponentFixture<BibleControllerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BibleControllerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BibleControllerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
