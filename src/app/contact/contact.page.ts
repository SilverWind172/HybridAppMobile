import {Component} from '@angular/core';
import {IonContent, IonHeader, IonTitle, IonToolbar} from "@ionic/angular/standalone";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
  styleUrls: ['./contact.page.scss'],
  imports: [
    IonHeader,
    IonContent,
    IonToolbar,
    IonTitle
  ]
})
export class ContactPage {

  constructor() {
  }


}
