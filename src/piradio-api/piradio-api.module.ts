import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core';

import { PiradioRestService } from './piradio-rest.service';
import { PiradioWebsocketService } from './piradio-websocket.service';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
  ],
  providers: [
    PiradioRestService,
    PiradioWebsocketService,
  ]
})
export class PiradioApiModule {}
