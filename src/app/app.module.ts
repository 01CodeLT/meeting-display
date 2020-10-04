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
import { ToolbarComponent } from './display/controller/toolbar.component';
import { PubControllerComponent } from './display/controller/pub/controller.component';
import { BibleControllerComponent } from './display/controller/bible/controller.component';
import { MenuLayoutComponent } from './shared/components/menu-layout/menu-layout.component';

const routes: Routes = [
  {
    path: '',
    component: MenuLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent
      },
      {
        path: 'controller/pub/:id',
        component: PubControllerComponent
      },
      {
        path: 'controller/bible/:id',
        component: BibleControllerComponent
      }
    ]
  },
  {
    path: 'display',
    component: DisplayComponent
  },
  {
    path: 'controller/toolbar',
    component: ToolbarComponent
  }
];

@NgModule({
  declarations: [
    AppComponent, 
    HomeComponent, 
    DisplayComponent,
    ToolbarComponent,
    MenuLayoutComponent,
    PubControllerComponent,
    BibleControllerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    SharedModule,
    NgxElectronModule,
    DragulaModule.forRoot(),
    RouterModule.forRoot(routes, { useHash: true })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
