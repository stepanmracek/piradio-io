import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { NavController, ModalController, ActionSheetController, AlertController, PopoverController } from 'ionic-angular';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import { RadioDetailComponent } from '../radio-detail/radio-detail';
import { RadioService } from '../../services/radio.service';
import { MenuPage } from '../menu/menu';
import { WebsocketService } from '../../services/websocket.service';
import { IStation } from '../../services/interfaces';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  private addressStorageKey = 'piradio-address';
  private apiKeyStorageKey = 'piradio-apikey'
  stations: IStation[] = null;
  playingStation: IStation = null;
  subscriptions: Subscription[] = [];
  error = false;

  constructor(
    public navCtrl: NavController,
    private radio: RadioService,
    private websocket: WebsocketService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
  ) {

  }

  ngOnInit() {
    const address = localStorage.getItem(this.addressStorageKey);
    const apiKey = localStorage.getItem(this.apiKeyStorageKey);
    if (address && apiKey) {
      const url = `http://${address}:3000`;
      this.radio.setUrl(url, apiKey);
      this.subscribe(url, apiKey);
    } else {
      this.promptUrl();
    }
  }

  private showError(text: string) {
    this.error = true;
    this.alertCtrl.create({
      title: 'Error',
      message: text,
      buttons: ['OK']
    }).present();
  }

  private subscribe(url: string, apiKey: string) {
    this.error = false;
    this.subscriptions.push(this.radio.getStations()
      .subscribe(stations => {
        this.stations = stations
      }, error => {
        this.showError('Can\'t connect to RaspberryPi');
      }));

    this.subscriptions.push(this.radio.getStatus()
      .subscribe(playingStation => {
        this.playingStation = playingStation;
      }, error => {
        console.error(error);
      }));

    this.subscriptions.push(this.websocket.connect(url, apiKey)
      .subscribe(() => { }, error => {
        console.error(error);
      }));

    this.subscriptions.push(this.websocket.status.subscribe(s => this.playingStation = s));
    this.subscriptions.push(this.websocket.stations.subscribe(s => this.stations = s));
  }

  private edit(station: IStation) {
    const copy: IStation = { name: station.name, url: station.url, _id: station._id };
    const modal = this.modalCtrl.create(RadioDetailComponent, { station: copy });
    modal.present();
    modal.onDidDismiss(save => {
      if (save) {
        this.radio.updateStation(station._id, copy).subscribe(() => { }, error => {
          this.showError('Error during saving station');
        });
      }
    });
  }

  private play(station: IStation) {
    if (station._id) this.radio.play(station._id).subscribe();
  }

  private delete(station: IStation) {
    const alert = this.alertCtrl.create({
      title: 'Confirm',
      message: `Do you wish to delete station ${station.name}?`,
      buttons: [{
        text: 'No'
      }, {
        text: 'Yes',
        role: 'destructive',
        handler: () => {
          this.radio.deleteStation(station._id).subscribe(() => { }, error => {
            this.showError('Error during deleting of the station');
          });
        }
      }]
    });
    alert.present();
  }

  onClick(station: IStation) {
    const nonPlayingButtons = [{
      text: 'Edit',
      icon: 'create',
      handler: () => this.edit(station)
    }, {
      text: 'Play',
      icon: 'play',
      handler: () => this.play(station)
    }, {
      text: 'Delete',
      role: 'destructive',
      icon: 'trash',
      handler: () => this.delete(station)
    }];
    const playingButtons = [{
      text: 'Stop',
      icon: 'pause',
      handler: () => { this.radio.stop().subscribe(); }
    }]
    const actionSheet = this.actionSheetCtrl.create({
      title: 'Radio station actions',
      buttons: this.playingStation && this.playingStation._id === station._id ? playingButtons : nonPlayingButtons
    });
    actionSheet.present();
  }

  onAddClick() {
    const newStation: IStation = { name: '', url: '' };
    const modal = this.modalCtrl.create(RadioDetailComponent, { station: newStation });
    modal.present();
    modal.onDidDismiss(save => {
      if (save)
        this.radio.createStation(newStation).subscribe(station => { }, error => {
          this.showError('Error during creating of the new station');
        })
    });
  }

  volumeDown() {
    this.radio.getVolume()
      .switchMap(v => this.radio.setVolume(Math.max(0, v - 10)))
      .subscribe({ error: e => console.error(e) });
  }

  volumeUp() {
    this.radio.getVolume()
      .switchMap(v => this.radio.setVolume(Math.min(100, v + 10)))
      .subscribe({ error: e => console.error(e) });
  }

  ngOnDestroy() {
    this.unsubscribe();
  }

  private unsubscribe() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  showMenu(event) {
    const popover = this.popoverCtrl.create(MenuPage);
    popover.present({ ev: event });
    popover.onDidDismiss(result => {
      if (result === 'setUrl') {
        this.promptUrl();
      }
    });
  }

  private promptUrl() {
    const address = localStorage.getItem(this.addressStorageKey) || '192.168.0.10';
    let apiKey = localStorage.getItem(this.apiKeyStorageKey) || '';
    apiKey = apiKey ? atob(apiKey) : apiKey;
    const prompt = this.alertCtrl.create({
      title: 'Please enter RaspberryPi address',
      inputs: [{
        name: 'address',
        label: 'Address',
        placeholder: 'Address',
        value: address
      }, {
        name: 'apiKey',
        placeholder: 'API key',
        label: 'API key',
        value: apiKey
      }],
      buttons: [{
        text: 'Cancel'
      }, {
        text: 'OK',
        handler: value => {
          this.unsubscribe();
          const url = `http://${value.address}:3000`;
          const apiKey = btoa(value.apiKey);
          this.radio.setUrl(url, apiKey);
          this.subscribe(url, apiKey);
          localStorage.setItem(this.addressStorageKey, value.address);
          localStorage.setItem(this.apiKeyStorageKey, apiKey);
        }
      }]
    });
    prompt.present();
  }

}
