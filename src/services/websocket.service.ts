import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { IStation } from './interfaces';

@Injectable()
export class WebsocketService {

  constructor() { }

  status: Subject<IStation> = new Subject<IStation>();
  stations: Subject<IStation[]> = new Subject<IStation[]>();

  connect(url: string, apiKey: string): Observable<void> {
    const socket = io(url, {
      transportOptions: {
        polling: {
          extraHeaders: {
            'Api-Key': apiKey
          }
        }
      }
    });

    // We define our observable which will observe any incoming messages
    // from our socket.io server.
    let observable = new Observable<void>(observer => {
      socket.on('connect', () => console.log('Connected to Websocket Server'));
      socket.on('status', (data) => {
        this.status.next(data);
      });
      socket.on('stations', (data) => {
        this.stations.next(data);
      });
      return () => {
        console.log('Disconnectiong from Websocket Server')
        socket.disconnect();
      }
    });

    return observable;
  }
}
