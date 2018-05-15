import { Component } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { IStation } from '../../services/interfaces';

@Component({
  selector: 'radio-detail',
  templateUrl: 'radio-detail.html'
})
export class RadioDetailComponent {

  station: IStation;

  constructor(private viewCtrl: ViewController, private params: NavParams) {
    this.station = this.params.get('station');
  }

  dismiss() {
    this.viewCtrl.dismiss(false);
  }

  save() {
    this.viewCtrl.dismiss(true);
  }

}
