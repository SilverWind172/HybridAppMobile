import {Component} from '@angular/core';
import {IonContent, IonHeader, IonTitle, IonToolbar} from "@ionic/angular/standalone";

@Component({
  selector: 'app-aboutus',
  templateUrl: './aboutus.page.html',
  styleUrls: ['./aboutus.page.scss'],
  imports: [
    IonTitle,
    IonToolbar,
    IonHeader,
    IonContent
  ]
})
export class AboutusPage {

  constructor() {
  }


}
