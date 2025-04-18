import {Component} from '@angular/core';
import {ProductService} from '../services/product.service';
import {IonContent, IonHeader, IonItem, IonLabel, IonList, IonTitle, IonToolbar} from "@ionic/angular/standalone";
import {CurrencyPipe, NgForOf} from "@angular/common";

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  imports: [
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    CurrencyPipe,
    IonTitle,
    IonToolbar,
    IonHeader,
    NgForOf
  ]
})
export class HistoryPage {
  history: any[] = [];
  isLoading = false;

  constructor(private productService: ProductService) {
  }

  // In HistoryPage component
  async loadHistory() {
    try {
      this.isLoading = true;
      this.history = await this.productService.getAllProducts();
    } catch (error) {
      console.error('Failed to load history:', error);
      // Show error to the user (e.g., using toast)
    } finally {
      this.isLoading = false;
    }
  }

  async ionViewWillEnter() {
    await this.loadHistory();
  }

  // Manual refresh
  async handleRefresh(event: any) {
    await this.loadHistory();
    event.target.complete();
  }
}
