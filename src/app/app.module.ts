import 'reflect-metadata';
import '../polyfills';

import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from './shared/shared.module';
import { Routes, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import { DragulaModule } from 'ng2-dragula';
import { NgxElectronModule } from 'ngx-electron';
import { DisplayComponent } from './display/display/display.component';
import { ControllerComponent } from './display/controller/controller.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'display',
    component: DisplayComponent
  },
  {
    path: 'display/controller/:id',
    component: ControllerComponent
  }
];

@NgModule({
  declarations: [
    AppComponent, 
    HomeComponent, 
    DisplayComponent, 
    ControllerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    NgxElectronModule,
    DragulaModule.forRoot(),
    RouterModule.forRoot(routes)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
