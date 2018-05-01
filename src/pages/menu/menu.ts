import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController } from 'ionic-angular';

@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html',
})
export class MenuPage {
  constructor(private navCtrl: NavController, private navParams: NavParams, private viewCtrl: ViewController) {

  }

  setAddress() {
    this.viewCtrl.dismiss('setUrl');
  }
}
