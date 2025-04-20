import {Component} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {ApiService} from "../services/api.service";
import {ProductService} from "../services/product.service";
import {BarcodeScanner, BarcodeFormat} from '@capacitor-mlkit/barcode-scanning';
import {AlertController} from '@ionic/angular';
import {CurrencyPipe, NgForOf, NgIf} from "@angular/common";
import {PipeTransform, Pipe} from "@angular/core";
import {Product} from "../model/Product.model";
import {ProductImage} from "../model/ProductImage.model";
import {ProductOffer} from "../model/ProductOffer.model";
import {SplashScreen} from '@capacitor/splash-screen';

@Pipe({name: 'sortByPrice'})
export class SortByPricePipe implements PipeTransform {
  transform(offers: any[]): any[] {
    return offers?.sort((a, b) => a.price - b.price) || [];
  }
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonicModule,
    CurrencyPipe,
    NgForOf,
    NgIf,
    SortByPricePipe
  ]
})
export class HomePage {
  scannedText: string = '';
  isLoading: boolean = false;
  isScanning: boolean = false;

  productInfo: {
    product: Product;
    images: ProductImage[];
    offers: ProductOffer[];
  } | null = null;

  constructor(
    private apiService: ApiService,
    private productService: ProductService,
    private alertController: AlertController
  ) {
  }


  ionViewDidEnter() {
    setTimeout(() => {
      SplashScreen.hide();
    }, 1000); // trễ 1s đảm bảo không đụng animation
  }


  async scanBarcode() {
    if (this.isScanning) return;
    this.isScanning = true;
    try {
      this.isLoading = true;

      const {supported} = await BarcodeScanner.isSupported();
      if (!supported) {
        await this.showAlert('Error', 'Barcode scanning not supported on this device');
        return;
      }

      const check = await BarcodeScanner.checkPermissions();
      if (check.camera !== 'granted') {
        const {camera} = await BarcodeScanner.requestPermissions();
        if (camera !== 'granted') {
          await this.showAlert('Permission Required', 'Please grant camera permission');
          return;
        }
      }

      // Fix quan trọng: delay nhỏ để tránh lỗi surface
      await new Promise(resolve => setTimeout(resolve, 500));

      await new Promise(resolve => setTimeout(resolve, 500)); // delay 0.5s

      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE],
      });

      if (result.barcodes.length > 0) {
        const barcode = result.barcodes[0].rawValue;
        this.scannedText = barcode;
        await this.handleScannedBarcode(barcode);
      } else {
        this.scannedText = 'No barcode found';
      }

    } catch (error) {
      console.error('Error scanning barcode:', error);
      await this.showAlert('Error', 'Failed to scan barcode.');
    } finally {
      this.isLoading = false;
      this.isScanning = false;
    }
  }

  async handleScannedBarcode(barcode: string) {
    try {
      this.isLoading = true;

      try {
        const localProduct = await this.productService.getProductByBarcode(barcode);
        this.productInfo = {
          product: localProduct.product,
          images: localProduct.images,
          offers: localProduct.offers
        };
        await this.showAlert('Local Data', 'Product loaded from local database');
        return;
      } catch {
        console.log('Product not found locally, checking API...');
      }

      this.apiService.getProductByBarcodeUsingAPI(barcode).subscribe({
        next: async (response) => {
          if (response.items?.length > 0) {
            const item = response.items[0];
            const productData: Product = {
              upc: item.upc,
              code: item.upc,
              title: item.title,
              description: item.description,
              brand: item.brand,
              model: item.model,
              category: item.category,
              lowest_price: Math.min(...item.offers.map((o: { price: number }) => o.price)),
              highest_price: Math.max(...item.offers.map((o: { price: number }) => o.price)),
            };

            const images: ProductImage[] = item.images?.map((url: string) => ({
              code: item.upc,
              image_url: url
            })) || [];

            const offers: ProductOffer[] = item.offers?.map((o: any) => ({
              code: item.upc,
              merchant: o.merchant,
              domain: o.domain,
              offer_title: o.title,
              currency: o.currency,
              list_price: o.list_price,
              price: o.price,
              shipping: o.shipping,
              condition: o.condition,
              availability: o.availability,
              link: o.link,
              updated_time: Date.now(),
            })) || [];

            this.productInfo = {
              product: productData,
              images,
              offers
            };

            await this.productService.addFullProduct(productData, images, offers);
            await this.showAlert('Success', 'Product saved locally');
          } else {
            await this.showAlert('Not Found', 'Product not found in API');
          }
        },
        error: async (err) => {
          console.error('API Error:', err);
          await this.showAlert('Error', 'Failed to fetch product details');
        }
      });

    } catch (error) {
      console.error('Handle barcode error:', error);
      await this.showAlert('Error', 'Error processing barcode');
    } finally {
      this.isLoading = false;
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  clearScan() {
    this.scannedText = '';
    this.productInfo = null;
  }
}
