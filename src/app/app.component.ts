import {Component} from '@angular/core';
import {ProductService} from "./services/product.service";

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  constructor(private productService: ProductService) {
    this.initializingApp().then(() => console.log('DB ready'))
      .catch(err => console.error('DB init failed', err));
  }

  private async initializingApp() {
    await this.productService.initDB();
  }
}
