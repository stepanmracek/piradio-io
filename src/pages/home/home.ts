import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { NavController, ModalController, ActionSheetController, AlertController, PopoverController } from 'ionic-angular';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import { RadioDetailComponent } from '../radio-detail/radio-detail';
import { RadioService, IStation } from '../../services/radio.service';
import { MenuPage } from '../menu/menu';
import { WebsocketService } from '../../services/websocket.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  private storageKey = 'piradio-address';
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
    const address = localStorage.getItem(this.storageKey);
    if (address) {
      const url = `http://${address}:3000`;
      this.radio.setUrl(url);
      this.subscribe(url);
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

  private subscribe(url: string) {
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

    this.subscriptions.push(this.websocket.connect(url)
      .subscribe(playingStation => {
        this.playingStation = playingStation;
      }, error => {
        console.error(error);
      }));
  }

  private edit(station: IStation) {
    const copy: IStation = { name: station.name, url: station.url, _id: station._id };
    const modal = this.modalCtrl.create(RadioDetailComponent, { station: copy });
    modal.present();
    modal.onDidDismiss(save => {
      if (save) {
        this.radio.updateStation(station._id, copy).subscribe(() => {
          station.name = copy.name;
          station.url = copy.url;
        }, error => {
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
          this.radio.deleteStation(station._id).subscribe(() => {
            const index = this.stations.indexOf(station);
            if (index >= 0) this.stations.splice(index, 1);
          }, error => {
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
        this.radio.createStation(newStation).subscribe(station => {
          this.stations.push(station);
        }, error => {
          this.showError('Error during creating of the new station');
        })
    });
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
    const address = localStorage.getItem(this.storageKey) || '192.168.0.10';
    const prompt = this.alertCtrl.create({
      title: 'Please enter RaspberryPi address',
      inputs: [{
        name: 'address',
        placeholder: 'address',
        value: address
      }],
      buttons: [{
        text: 'Cancel'
      }, {
        text: 'OK',
        handler: value => {
          this.unsubscribe();
          const url = `http://${value.address}:3000`;
          this.radio.setUrl(url);
          this.subscribe(url);
          localStorage.setItem(this.storageKey, value.address);
        }
      }]
    });
    prompt.present();
  }

}
