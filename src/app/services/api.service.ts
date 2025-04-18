import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {
  }

  getProductByBarcodeUsingAPI(barcode: string): Observable<any> {
    const apiUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    return this.http.get(apiUrl);
  }
  

}
