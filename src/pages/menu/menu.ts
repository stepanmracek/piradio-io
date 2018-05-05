import { Component } from '@angular/core';
import { ViewController } from 'ionic-angular';

@Component({
  selector: 'page-menu',
  templateUrl: 'menu.html',
})
export class MenuPage {
  constructor(private viewCtrl: ViewController) {

  }

  setAddress() {
    this.viewCtrl.dismiss('setUrl');
  }
}
