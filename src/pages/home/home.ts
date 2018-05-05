import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { NavController, ModalController, ActionSheetController, AlertController, PopoverController } from 'ionic-angular';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/filter';
import { RadioDetailComponent } from '../radio-detail/radio-detail';
import { RadioService, IStation, IStatus } from '../../services/radio.service';
import { MenuPage } from '../menu/menu';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {
  private storageKey = 'piradio-address';
  stations: IStation[] = null;
  status: IStatus = null;
  subscriptions: Subscription[] = [];
  error = false;

  constructor(
    public navCtrl: NavController,
    private radio: RadioService,
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController,
    private popoverCtrl: PopoverController,
  ) {

  }

  ngOnInit() {
    const url = localStorage.getItem(this.storageKey);
    if (url) {
      this.radio.setUrl(`http://${url}:3000`);
      this.subscribe();
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

  private subscribe() {
    this.error = false;
    this.subscriptions.push(this.radio.getStations()
      .subscribe(stations => {
        this.stations = stations
      }, error => {
        this.showError('Can\'t connect to RaspberryPi');
      }));

    this.subscriptions.push(Observable
      .timer(0, 1000)
      .filter(() => this.stations && this.stations.length > 0)
      .switchMap(() => this.radio.getStatus())
      .subscribe(status => {
        this.status = status;
      }, error => {
        console.log(error);
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
      buttons: this.isPlaying(station) ? playingButtons : nonPlayingButtons
    });
    actionSheet.present();
  }

  private isPlaying(station: IStation) {
    return this.status && this.status.isPlaying && this.status.selectedStation && this.status.selectedStation._id === station._id;
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
    const address = localStorage.getItem(this.storageKey) || 'localhost';
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
          this.subscribe();
          localStorage.setItem(this.storageKey, value.address);
        }
      }]
    });
    prompt.present();
  }

}
