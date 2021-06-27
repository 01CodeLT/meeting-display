import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxElectronModule } from 'ngx-electron';
import { SanitizerPipe } from './pipes/santizer.pipe';

//NG Semantic ui
import { ModalService } from './services/modal.service';
import { SlidesService } from './services/slides.service';
import { FuiDropdownModule, FuiSelectModule, FuiDimmerModule, FuiModalModule } from 'ngx-fomantic-ui';
import { DisplayControllerComponent } from './components/display-controller/display-controller.component';

@NgModule({
  declarations: [
    SanitizerPipe,
    DisplayControllerComponent
  ],
  providers: [
    ModalService,
    SlidesService
  ],
  imports: [
    CommonModule, 
    FormsModule,
    NgxElectronModule,

    FuiDropdownModule,
    FuiSelectModule,
    FuiDimmerModule,
    FuiModalModule
  ],
  exports: [
    FormsModule,
    SanitizerPipe,
    NgxElectronModule,
    DisplayControllerComponent,

    FuiDropdownModule,
    FuiSelectModule,
    FuiDimmerModule,
    FuiModalModule
  ]
})
export class SharedModule {}
