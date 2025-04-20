import {Injectable} from '@angular/core';
import {Capacitor} from '@capacitor/core';
import {
  SQLiteDBConnection,
} from '@capacitor-community/sqlite';
import {Product} from '../model/Product.model';
import {ProductImage} from '../model/ProductImage.model';
import {ProductOffer} from '../model/ProductOffer.model';
import {HTTP} from '@awesome-cordova-plugins/http/ngx';
import {CapacitorSQLite, SQLiteConnection} from '@capacitor-community/sqlite';


@Injectable({providedIn: 'root'})
export class ProductService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private readonly DB_NAME = 'products.db';

  constructor(private httpNative: HTTP) {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }


  /** Khởi tạo DB (Android/iOS tự động, Web đã init ở main.ts) */
  async initDB(): Promise<void> {
    if (this.db) return;
    const isConsistent = await this.sqlite.checkConnectionsConsistency();
    if (!isConsistent.result) {
      throw new Error('SQLite is not available or connections are inconsistent.');
    }
    this.db = await this.sqlite.createConnection(
      this.DB_NAME,
      false,
      'no-encryption',
      1,
      false
    );
    await this.db.open();

    // Tạo bảng nếu chưa có
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS products
      (
        code
        TEXT
        PRIMARY
        KEY,
        title
        TEXT,
        description
        TEXT,
        brand
        TEXT,
        model
        TEXT,
        category
        TEXT,
        lowest_price
        REAL,
        highest_price
        REAL
      );
    `);
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS product_images
      (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        TEXT,
        image_url
        TEXT,
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
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS product_offers
      (
        id
        INTEGER
        PRIMARY
        KEY
        AUTOINCREMENT,
        code
        TEXT,
        merchant
        TEXT,
        domain
        TEXT,
        offer_title
        TEXT,
        currency
        TEXT,
        list_price
        REAL,
        price
        REAL,
        shipping
        TEXT,
        condition
        TEXT,
        availability
        TEXT,
        link
        TEXT,
        updated_time
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
  }

  /** Mở kết nối DB trước mỗi thao tác */
  private async ensureOpenDB(): Promise<void> {
    await this.initDB();
  }

  /** Thêm sản phẩm + hình + offer */
  public async addFullProduct(
    product: Product,
    images: ProductImage[],
    offers: ProductOffer[]
  ): Promise<void> {
    await this.ensureOpenDB();
    if (!this.db) throw new Error('DB not initialized');

    // Insert product
    await this.db.run(
      `INSERT
      OR REPLACE INTO products
       (code, title, description, brand, model, category, lowest_price, highest_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        product.code,
        product.title,
        product.description,
        product.brand,
        product.model,
        product.category,
        product.lowest_price,
        product.highest_price,
      ]
    );

    // Insert images
    for (const img of images) {
      await this.db.run(
        `INSERT INTO product_images (code, image_url)
         VALUES (?, ?);`,
        [product.code, img.image_url]
      );
    }

    // Insert offers
    for (const offer of offers) {
      await this.db.run(
        `INSERT INTO product_offers
         (code, merchant, domain, offer_title, currency, list_price, price, shipping, condition, availability, link,
          updated_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          product.code,
          offer.merchant,
          offer.domain,
          offer.offer_title,
          offer.currency,
          offer.list_price,
          offer.price,
          offer.shipping,
          offer.condition,
          offer.availability,
          offer.link,
          offer.updated_time,
        ]
      );
    }
    console.log('Product and related data inserted!');
  }

  /** Lấy sản phẩm từ DB */
  public async getProductByBarcode(code: string): Promise<{
    product: Product;
    images: ProductImage[];
    offers: ProductOffer[]
  }> {
    await this.ensureOpenDB();
    if (!this.db) throw new Error('DB not initialized');

    const prodRes = await this.db.query(`SELECT *
                                         FROM products
                                         WHERE code = ?;`, [code]);
    if (!prodRes.values?.length) throw new Error('Product not found');
    const product = prodRes.values[0] as Product;

    const imgRes = await this.db.query(`SELECT *
                                        FROM product_images
                                        WHERE code = ?;`, [code]);
    const images = imgRes.values as ProductImage[];

    const offerRes = await this.db.query(
      `SELECT *
       FROM product_offers
       WHERE code = ?
       ORDER BY price ASC;`,
      [code]
    );
    const offers = offerRes.values as ProductOffer[];

    return {product, images, offers};
  }


  async getAllProducts(): Promise<
    Array<{
      product: Product;
      images: ProductImage[];
      offers: ProductOffer[];
    }>
  > {
    if (!this.db) await this.initDB();
    if (!this.db) throw new Error('Database connection failed to initialize');

    try {
      const productsRes = await this.db.query('SELECT * FROM products');
      const productList = productsRes.values || [];

      const all: Array<{
        product: Product;
        images: ProductImage[];
        offers: ProductOffer[];
      }> = [];

      for (const product of productList) {
        const imageRes = await this.db.query(
          `SELECT *
           FROM product_images
           WHERE code = ?`,
          [product.code]
        );
        const offerRes = await this.db.query(
          `SELECT *
           FROM product_offers
           WHERE code = ?
           ORDER BY price ASC`,
          [product.code]
        );

        all.push({
          product: product as Product,
          images: imageRes.values as ProductImage[],
          offers: offerRes.values as ProductOffer[],
        });
      }

      return all;
    } catch (err) {
      console.error('Error in getAllProducts:', err);
      throw err;
    }
  }

  async closeDB(): Promise<void> {
    if (this.db) {
      await this.db.close();
      await this.sqlite.closeConnection(this.DB_NAME, false);
      this.db = null;
    }
  }

}
