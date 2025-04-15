import {Component} from '@angular/core';
import {BarcodeScanner, BarcodeFormat, Barcode} from '@capacitor-mlkit/barcode-scanning';
import {IonicModule} from "@ionic/angular";
import {Camera, CameraResultType, CameraSource} from "@capacitor/camera";

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    IonicModule
  ]
})
export class HomePage {
  scannedText: string = '';

  constructor() {
    Camera.requestPermissions().then(result => {
      console.log('Camera permissions:', result);
    });

  }

  async scanBarcode() {
    try {
      const result = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode, BarcodeFormat.Ean13, BarcodeFormat.Code128],
      });

      console.log('Scanned barcode result:', result);

      // Đảm bảo có ít nhất 1 mã được quét
      if (result?.barcodes && result.barcodes.length > 0) {
        const barcode: Barcode = result.barcodes[0];  // Bạn cũng có thể duyệt nhiều barcode nếu cần
        this.scannedText = barcode.rawValue ?? 'Không có dữ liệu mã vạch';
      } else {
        this.scannedText = 'Không tìm thấy mã vạch nào';
      }

    } catch (error) {
      console.error('Error scanning barcode:', error);
      this.scannedText = 'Lỗi khi quét mã vạch, vui lòng thử lại.';
    }


  }

  async takePhoto() {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    console.log('Ảnh:', image.webPath);
  }
}
