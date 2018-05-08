import { Injectable } from '@angular/core';
import * as io from 'socket.io-client';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class WebsocketService {

  constructor() { }

  connect(url: string): Observable<any> {
    const socket = io(url);

    // We define our observable which will observe any incoming messages
    // from our socket.io server.
    let observable = new Observable(observer => {
        socket.on('connect', () => console.log('Connected to Websocket Server'));
        socket.on('status', (data) => {
          observer.next(data);
        })
        return () => {
          console.log('Disconnectiong from Websocket Server')
          socket.disconnect();
        }
    });

    return observable;
  }
}
