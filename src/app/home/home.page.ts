import {Component} from '@angular/core';
import {IonicModule} from "@ionic/angular";
import {ApiService} from "../services/api.service";
import {ProductService} from "../services/product.service";
import {BarcodeScanner} from '@capacitor-mlkit/barcode-scanning';
import {BarcodeFormat} from '@capacitor-mlkit/barcode-scanning';
import {AlertController} from '@ionic/angular';
import {CurrencyPipe, NgForOf, NgIf} from "@angular/common";
import {PipeTransform} from "@angular/core";
import {Pipe} from "@angular/core";

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
  imports: [
    IonicModule,
    CurrencyPipe,
    NgForOf,
    SortByPricePipe,
    NgIf
  ],
  standalone: true
})
export class HomePage {
  scannedText: string = '';
  productInfo: any;
  isLoading: boolean = false;

  constructor(
    private apiService: ApiService,
    private productService: ProductService,
    private alertController: AlertController
  ) {
  }

  async scanBarcode() {
    try {
      this.isLoading = true;

      // Check if scanning is supported
      const {supported} = await BarcodeScanner.isSupported();
      if (!supported) {
        await this.showAlert('Error', 'Barcode scanning not supported on this device');
        return;
      }

      // Request permissions
      const {camera} = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted') {
        await this.showAlert('Permission Required', 'Please grant camera permission to scan barcodes');
        return;
      }

      // Start scanning
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
      await this.showAlert('Error', 'Failed to scan barcode. Please try again.');
    } finally {
      this.isLoading = false;
    }
  }

  async handleScannedBarcode(barcode: string) {
    try {
      this.isLoading = true;

      // Check if the product exists in a local database first
      try {
        const localProduct = await this.productService.getProductByBarcode(barcode);
        this.productInfo = {
          title: localProduct.name,
          offers: localProduct.priceList.map((price: any) => ({
            merchant: price.store,
            price: price.price
          }))
        };
        await this.showAlert('Local Data', 'Product loaded from local database');
        return;
      } catch (localError) {
        console.log('Product not found locally, fetching from API');
      }

      // Fetch from API if not found locally
      this.apiService.getProductByBarcodeUsingAPI(barcode).subscribe({
        next: async (response) => {
          if (response.items && response.items.length > 0) {
            const product = response.items[0];
            this.productInfo = product;

            // Save to SQLite
            if (!product.offers) return;
            const prices = product.offers.map((offer: any) => ({
              store: offer.merchant,
              price: offer.price
            }));
            /*

             */
            await this.productService.addProduct(product.upc, product.title, prices);

            await this.showAlert('Success', 'Product saved to local database');
          } else {
            await this.showAlert('Not Found', 'Product not found in database');
          }
        },
        error: (err) => {
          console.error('API Error:', err);
          this.showAlert('Error', 'Failed to fetch product details');
        }
      });
    } catch (error) {
      console.error('Error handling barcode:', error);
      await this.showAlert('Error', 'Failed to process barcode');
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

  // Add to your component class:
  clearScan() {
    this.scannedText = '';
    this.productInfo = null;
  }

}



