import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxElectronModule } from 'ngx-electron';
import { SanitizerPipe } from './pipes/santizer.pipe';

//NG Semantic ui
import { SuiDropdownModule, SuiSelectModule, SuiDimmerModule } from 'ng2-semantic-ui';

@NgModule({
  declarations: [
    SanitizerPipe
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

    SuiDropdownModule,
    SuiSelectModule,
    SuiDimmerModule
  ]
})
export class SharedModule {}
