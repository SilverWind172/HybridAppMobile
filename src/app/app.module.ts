import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';

import {AppComponent} from './app.component';
import {AppRoutingModule} from './app-routing.module';
import {provideHttpClient} from "@angular/common/http";

import {ProductService} from "./services/product.service";
import {ApiService} from "./services/api.service";

import {HTTP} from '@awesome-cordova-plugins/http/ngx';

// provideHttpClient() is a modern way alternative for HTTPClientModule

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule],
  providers: [{
    provide: RouteReuseStrategy,
    useClass: IonicRouteStrategy
  }, provideHttpClient(), ProductService, ApiService, HTTP],

  bootstrap: [AppComponent]
})
export class AppModule {
}
