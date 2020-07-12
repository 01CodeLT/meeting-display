import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgxElectronModule } from 'ngx-electron';
import { SanitizerPipe } from './pipes/santizer.pipe';

@NgModule({
  declarations: [
    SanitizerPipe
  ],
  imports: [
    CommonModule, 
    FormsModule, 
    NgxElectronModule
  ],
  exports: [
    FormsModule,
    SanitizerPipe,
    NgxElectronModule
  ]
})
export class SharedModule {}
