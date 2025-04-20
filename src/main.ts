import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {defineCustomElements} from 'jeep-sqlite/loader';
import {Capacitor} from '@capacitor/core';
import {SQLiteConnection, CapacitorSQLite} from '@capacitor-community/sqlite';


import {AppModule} from './app/app.module';
import {environment} from './environments/environment';
import {CapacitorSQLiteWeb} from "@capacitor-community/sqlite/dist/esm/web";


if (environment.production) {
  enableProdMode();
}

// KHÔNG dùng top-level await
const initWebStoreIfNeeded = async () => {
  defineCustomElements(window);

  if (Capacitor.getPlatform() === 'web') {
    Capacitor.registerPlugin('CapacitorSQLite', {
      web: () => new CapacitorSQLiteWeb()
    });


    initWebStoreIfNeeded().then(() => {
      platformBrowserDynamic()
        .bootstrapModule(AppModule)
        .catch(err => console.error(err));
    });
  }
}
