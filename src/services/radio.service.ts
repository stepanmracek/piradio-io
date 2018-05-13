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
  apiKey = '';

  constructor(private http: HttpClient) { }

  setUrl(url: string, apiKey: string) {
    this.url = url;
    this.apiKey = apiKey;
  }

  getStations(): Observable<IStation[]> {
    return this.http.get<IStation[]>(`${this.url}/stations`, { headers: { 'Api-Key': this.apiKey } });
  }

  getStation(id: string): Observable<IStation> {
    return this.http.get<IStation>(`${this.url}/stations/${id}`, { headers: { 'Api-Key': this.apiKey } });
  }

  updateStation(id: string, station: IStation): Observable<IStation> {
    return this.http.put<IStation>(`${this.url}/stations/${id}`, station, { headers: { 'Api-Key': this.apiKey } });
  }

  getStatus(): Observable<IStation> {
    return this.http.get<IStation>(`${this.url}/status`, { headers: { 'Api-Key': this.apiKey } });
  }

  createStation(station: IStation): Observable<IStation> {
    return this.http.post<IStation>(`${this.url}/stations`, station, { headers: { 'Api-Key': this.apiKey } });
  }

  play(id: string): Observable<void> {
    return this.http.get(`${this.url}/play/${id}`, { headers: { 'Api-Key': this.apiKey } }).map(() => { });
  }

  stop(): Observable<void> {
    return this.http.get(`${this.url}/stop`, { headers: { 'Api-Key': this.apiKey } }).map(() => { });
  }

  deleteStation(id: string): Observable<Object> {
    return this.http.delete(`${this.url}/stations/${id}`, { headers: { 'Api-Key': this.apiKey } });
  }

  getVolume(): Observable<number> {
    return this.http.get(`${this.url}/volume`, { headers: { 'Api-Key': this.apiKey } }) as Observable<number>;
  }

  setVolume(newVolume: number): Observable<void> {
    return this.http.post(`${this.url}/volume`, {volume: newVolume}, { headers: { 'Api-Key': this.apiKey } }).map(() => { });
  }
}
