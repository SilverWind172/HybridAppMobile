import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {
  }

  getProductByBarcodeUsingAPI(barcode: string): Observable<any> {
    const apiUrl = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    return this.http.get(apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching product:', error); // Ghi log lỗi
        return throwError(() => new Error('API request failed'));
      })
    );
  }
}
