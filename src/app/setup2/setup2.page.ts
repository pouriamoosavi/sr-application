import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { SocketService } from '../services/socket.service';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-setup2',
  templateUrl: './setup2.page.html',
  styleUrls: ['./setup2.page.scss'],
})
export class Setup2Page implements OnInit {
  userInputPass: string;
  connectButtonPending: boolean;
  connectButtonText: string;
  networks: [];
  spin: boolean;
  constructor(
    private router: Router,
    private alertController: AlertController,
    private socketService: SocketService,
    private storageService: StorageService
  ) {}

  ngOnInit() {}

  resetButton() {
    this.connectButtonPending = false;
    this.connectButtonText = '';
  }

  async ionViewDidEnter() {
    console.log(100);
    this.spin = true;
    try {
      await this.checkAndReconnect();
      this.socketService.onDataObj(async (dataObj: any) => {
        this.spin = false;
        if (dataObj.code != 0) {
          await this.showErr(
            `Can't send SSID and/or password to the board. op: ${dataObj.op}, code: ${dataObj.code}`
          );
        } else {
          if (dataObj.op == 'scan') {
            if (dataObj.networks && Array.isArray(dataObj.networks)) {
              for (let network of dataObj.networks) {
                network.showPassAndConnect = false;
              }
              this.networks = dataObj.networks;
              console.log(this.networks);
              this.spin = false;
              console.log(this);
            } else {
              await this.showErr(`'dataObj.networks' is not an array.`);
            }
          } else if (dataObj.op == 'ssid') {
            // ssid result successful
            await this.socketService.send(`pass ${this.userInputPass}`); // send password
          } else if (dataObj.op == 'pass') {
            // password result successful
            this.connectButtonText = 'Trying to connect to network';
            await this.socketService.send('connect'); // send connect
          } else if (dataObj.op == 'connect') {
            // connect board to router as station successful
            this.connectButtonText = 'Almost done';
            await this.storageService.set('espStationIP', dataObj.localIP);
            await this.router.navigate(['/lamp']);
          }
        }
      });
      this.socketService.onError(async (errorMessage) => {
        await this.showErr(errorMessage);
      });
      this.socketService.onClose(async (hasError) => {
        await this.showErr(`Socket disconnected unexpectedly ${hasError}`);
      });
    } catch (err) {
      await this.showErr(err.message);
    }
  }

  async ionViewWillLeave() {
    await this.socketService.safeClose();
  }

  async showErr(msg) {
    this.spin = false;
    this.resetButton();
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: 'Something went wrong',
      message: msg,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async checkAndReconnect() {
    if (!this.socketService.isOpen()) {
      this.connectButtonPending = true;
      this.connectButtonText = 'Connecting to the board';
      try {
        await this.socketService.open('192.168.4.1', 8080);
      } catch (err) {
        await this.showErr("Can't connect to the board");
      } finally {
        this.resetButton();
      }
    }
    this.socketService.send('scan');
  }

  async sendCredentials(ssid: string) {
    await this.checkAndReconnect();
    this.connectButtonPending = true;
    this.connectButtonText = 'Sending credentials';
    await this.socketService.send(`ssid ${ssid}`); // send ssid
  }

  log() {
    this.spin = !this.spin;
  }
}
