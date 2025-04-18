import {Injectable} from '@angular/core';
import {CapacitorSQLite, SQLiteConnection, SQLiteDBConnection} from '@capacitor-community/sqlite';
import {Capacitor} from "@capacitor/core";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'products.db';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initialize the database (creates tables if they don't exist).
   */
  async initDB(): Promise<void> {
    if (Capacitor.getPlatform() === 'web') {
      try {
        // Chỉ define nếu chưa define trước đó
        if (!customElements.get('jeep-sqlite')) {
          const jeep = await import('jeep-sqlite/dist/jeep-sqlite/jeep-sqlite.esm.js');
          customElements.define('jeep-sqlite', jeep.JeepSqlite);
        }
      } catch (e) {
        console.error('Failed to load jeep-sqlite for Web:', e);
      }
    }


    if (this.db) return; // Skip if already initialized

    try {
      // 1. Check SQLite availability
      const isAvailable = await this.sqlite.checkConnectionsConsistency();
      if (!isAvailable.result) {
        throw new Error('SQLite is not available or connections are inconsistent.');
      }

      // 2. Create and open the database
      this.db = await this.sqlite.createConnection(
        this.DB_NAME,
        false, // Not encrypted
        'no-encryption',
        1, // Version
        false // Not read-only
      );

      await this.db.open();

      // 3. Create tables
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS products
        (
          code
          TEXT
          PRIMARY
          KEY,
          name
          TEXT
        );
      `);

      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS prices
        (
          id
          INTEGER
          PRIMARY
          KEY
          AUTOINCREMENT,
          code
          TEXT,
          store
          TEXT,
          price
          INTEGER,
          FOREIGN
          KEY
        (
          code
        ) REFERENCES products
        (
          code
        )
          );
      `);

      console.log('Database initialized successfully!');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Adds a product and its prices to the database.
   */
  async addProduct(code: string, name: string, prices: { store: string, price: number }[]): Promise<void> {
    if (!this.db) await this.initDB();

    if (!this.db) {
      throw new Error('Database connection failed to initialize');
    }

    try {
      // Insert product
      await this.db.run(
        'INSERT INTO products (code, name) VALUES (?, ?)',
        [code, name]
      );

      // Insert prices
      for (const price of prices) {
        await this.db.run(
          'INSERT INTO prices (code, store, price) VALUES (?, ?, ?)',
          [code, price.store, price.price]
        );
      }
    } catch (error) {
      console.error('Failed to add product:', error);
      throw error;
    }
  }

  /**
   * Fetches a product by barcode along with its prices.
   */
  async getProductByBarcode(code: string): Promise<{ name: string; priceList: { store: string; price: number }[] }> {
    if (!this.db) await this.initDB();

    if (!this.db) {
      throw new Error('Database connection failed to initialize');
    }

    try {
      // Get product
      const productResult = await this.db.query(
        'SELECT * FROM products WHERE code = ?',
        [code]
      );

      if (productResult.values?.length === 0) {
        throw new Error('Product not found');
      }

      const product = productResult.values![0];

      // Get prices (sorted by price ASC)
      const priceResult = await this.db.query(
        'SELECT store, price FROM prices WHERE code = ? ORDER BY price ASC',
        [code]
      );

      return {
        name: product.name,
        priceList: priceResult.values || []
      };
    } catch (error) {
      console.error('Failed to fetch product:', error);
      throw error;
    }
  }

  /**
   * Closes the database connection (optional).
   */
  async closeDB(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(this.DB_NAME, false);
      this.db = null;
    }
  }

  /**
   * Retrieves all products with their associated prices from the database
   * @returns Promise<Array<{code: string, name: string, priceList: Array<{store: string, price: number}>}>>
   */
  async getAllProducts(): Promise<
    Array<{
      code: string;
      name: string;
      priceList: Array<{ store: string; price: number }>;
    }>
  > {
    if (!this.db) await this.initDB();

    if (!this.db) {
      throw new Error('Database connection failed to initialize');
    }

    try {
      // Enable foreign key support (important for relational queries)
      await this.db.execute('PRAGMA foreign_keys = ON;');

      // 1. Get all products
      const productsResult = await this.db.query('SELECT code, name FROM products');
      const products = productsResult.values || [];

      // 2. Get prices for each product and combine the data
      const productsWithPrices = [];

      for (const product of products) {
        const pricesResult = await this.db.query(
          `SELECT store, price
           FROM prices
           WHERE code = ?
           ORDER BY price ASC`,  // Sort by price ascending
          [product.code]
        );

        productsWithPrices.push({
          code: product.code,
          name: product.name,
          priceList: pricesResult.values || []  // Default to empty array if no prices
        });
      }

      return productsWithPrices;
    } catch (error) {
      console.error('Error in getAllProducts:', error);
      throw error;
    }
  }
}
