import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map'

export interface IStation {
  _id?: string;
  name: string;
  url: string;
}

@Injectable()
export class RadioService {
  private url = 'http://localhost:3000';

  constructor (private http: HttpClient) {}

  setUrl(url) {
    this.url = url;
  }

  getStations(): Observable<IStation[]> {
    return this.http.get<IStation[]>(`${this.url}/stations`);
  }

  getStation(id: string): Observable<IStation> {
    return this.http.get<IStation>(`${this.url}/stations/${id}`);
  }

  updateStation(id: string, station: IStation): Observable<IStation> {
    return this.http.put<IStation>(`${this.url}/stations/${id}`, station);
  }

  getStatus(): Observable<IStation> {
    return this.http.get<IStation>(`${this.url}/status`);
  }

  createStation(station: IStation): Observable<IStation> {
    return this.http.post<IStation>(`${this.url}/stations`, station);
  }

  play(id: string): Observable<void> {
    return this.http.get(`${this.url}/play/${id}`).map(() => {});
  }

  stop(): Observable<void> {
    return this.http.get(`${this.url}/stop`).map(() => {});
  }

  deleteStation(id: string): Observable<Object> {
    return this.http.delete(`${this.url}/stations/${id}`);
  }

}