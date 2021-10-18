import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  espIP: string = "192.168.4.1";
  espPort: number = 8080;
  msg: string = "1";
  errorMsg: string;
  socket: any;
  buttonEnable: boolean;

  constructor() {}

  ngOnInit() {}

  ionViewWillEnter() {
    this.buttonEnable = false;
  }

  ionViewDidEnter() {
    this.socket = new (<any>window).Socket();
    this.socket.open( this.espIP, this.espPort,
      () => {
        this.buttonEnable = true;
      },
      (errorMessage) => {  
        this.errorMsg = errorMessage;
      }
    )
    this.socket.onData = function(data) {
      this.errorMsg = data;
    };
    this.socket.onError = function(errorMessage) {
      this.errorMsg = errorMessage;
    };
    this.socket.onClose = function(hasError) {
      this.errorMsg = hasError;
    };
    this.errorMsg = "";
  }

  ionViewWillLeave() {
    this.socket.shutdownWrite();
  }

  sendToEsp() {
    let data = new Uint8Array(this.msg.length);
    for (let i = 0; i < data.length; i++) {
      data[i] = this.msg.charCodeAt(i);
    }
    this.socket.write(data);
  }  

}
