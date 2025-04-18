// // sqlite.service.ts
// import {Injectable} from "@angular/core";
// import {Capacitor} from "@capacitor/core";
// import {
//   CapacitorSQLite, SQLiteConnection, SQLiteDBConnection
// } from "@capacitor-community/sqlite";
//
// @Injectable({
//   providedIn: "root",
// })
// export class SqliteService {
//   sqlite = new SQLiteConnection(CapacitorSQLite);
//   db: SQLiteDBConnection | null = null;
//
//   constructor() {
//   }
//
//   async initDB() {
//     try {
//       // @ts-ignore
//       this.db = await this.sqlite.createConnection('product.db', false, 'no-encryption', 1);
//       await this.db.open();
//
//       // Create Table
//       await this.db.execute(`
//         CREATE TABLE IF NOT EXISTS products
//         (
//           code
//           TEXT
//           PRIMARY
//           KEY,
//           name
//           TEXT
//         );
//       `);
//
//       await this.db.execute('CREATE TABLE IF NOT EXISTS prices(id INTEGER PRIMARY KEY AUTO_INCREMENT,code TEXT,store TEXT,price INTEGER,FOREIGN KEY(code) REFERENCES products(code));');
//
//       console.log("Database and Table initialized successfully.");
//
//
//     } catch (err) {
//       console.error('DB init error:', err);
//     }
//   }
//
//
// }
//
