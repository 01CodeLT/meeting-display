import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxElectronModule } from 'ngx-electron';
import { SanitizerPipe } from './pipes/santizer.pipe';

//NG Semantic ui
import { SlidesService } from './services/slides.service';
import { SuiDropdownModule, SuiSelectModule, SuiDimmerModule } from 'ng2-semantic-ui';
import { DisplayOptionsComponent } from './components/display-options/display-options.component';

@NgModule({
  declarations: [
    SanitizerPipe,
    DisplayOptionsComponent
  ],
  providers: [
    SlidesService
  ],
  imports: [
    CommonModule, 
    FormsModule,
    NgxElectronModule,

    SuiDropdownModule,
    SuiSelectModule,
    SuiDimmerModule
  ],
  exports: [
    FormsModule,
    SanitizerPipe,
    NgxElectronModule,
    DisplayOptionsComponent,

    SuiDropdownModule,
    SuiSelectModule,
    SuiDimmerModule
  ]
})
export class SharedModule {}
