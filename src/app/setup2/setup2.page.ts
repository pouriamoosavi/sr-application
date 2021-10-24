import { Component, OnInit, NgZone } from '@angular/core';
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
  networks: any;
  spin: boolean;
  connectMsg: string;
  failedConnectAttempt: number;
  isTryingToConnect: boolean;
  constructor(
    private router: Router,
    private alertController: AlertController,
    private socketService: SocketService,
    private storageService: StorageService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {}

  async ionViewDidEnter() {
    this.connectMsg = '';
    this.spin = true;
    this.failedConnectAttempt = 0;
    this.isTryingToConnect = false;
    try {
      this.checkAndReAndScan();
    } catch (err) {
      await this.showErr(err.message);
    }
    this.socketService.onDataObj(async (dataObj: any) => {
      this.ngZone.run(async () => {
        try {
          this.spin = false;
          if (dataObj.code != 0) {
            await this.parseDataObjErrors(dataObj);
          } else {
            if (dataObj.op == 'scan') {
              if (dataObj.networks && Array.isArray(dataObj.networks)) {
                for (let network of dataObj.networks) {
                  network.showPassAndConnect = false;
                }
                this.networks = dataObj.networks;
                this.spin = false;
              } else {
                await this.showErr(`'dataObj.networks' is not an array.`);
              }
            } else if (dataObj.op == 'ssid') {
              // ssid result successful
              await this.socketService.send(`pass ${this.userInputPass}`); // send password
            } else if (dataObj.op == 'pass') {
              // password result successful
              this.connectMsg = 'Trying to connect to network ...';
              await this.socketService.send('connect'); // send connect
            } else if (dataObj.op == 'connect') {
              // connect board to router as station successful
              this.connectMsg = 'Almost done ...';
              await this.storageService.set('espStationIP', dataObj.localIP);
              await this.router.navigate(['/lamp']);
            }
          }
        } catch (err) {
          await this.showErr(err.message);
        }
      });
    });
    this.socketService.onError(async (errorMessage) => {
      this.ngZone.run(async () => {
        console.log('errorMessage', errorMessage);
        await this.showErr(errorMessage);
      });
    });
    this.socketService.onClose(async (hasError) => {
      if (!this.isTryingToConnect) {
        this.ngZone.run(async () => {
          console.log(`Socket disconnected unexpectedly ${hasError}`);
          await this.socketService.safeClose();
          this.isTryingToConnect = true;
          await this.tryUntilConnect(async (err, connected) => {
            this.isTryingToConnect = false;
            if (err) {
              await this.showErr(
                "Can't connect to socket for 60 seconds. Make sure you are connected to the board's access point."
              );
            }
          });
        });
      }
    });
  }

  async ionViewWillLeave() {
    await this.socketService.safeClose();
  }

  async parseDataObjErrors(dataObj: any) {
    if (dataObj.op === 'scan') {
      await this.showErr(
        `Error while scanning networks. code: ${dataObj.code}`
      );
    } else if (dataObj.op === 'ssid') {
      await this.showErr(`Can't send SSID to the board. code: ${dataObj.code}`);
    } else if (dataObj.op == 'pass') {
      await this.showErr(`Can't send pass to the board. code: ${dataObj.code}`);
    } else if (dataObj.op == 'connect') {
      await this.showErr(
        `The board can't connect to the network. Make sure you entered password correctly. code: ${dataObj.code}`
      );
    } else {
      await this.showErr(
        `General error. op: ${dataObj.op}, code: ${dataObj.code}`
      );
    }
  }

  async showErr(msg) {
    this.spin = false;
    this.connectMsg = '';
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: 'Something went wrong',
      message: msg,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async tryUntilConnect(cb?: Function) {
    await this.checkAndReconnect();
    if (this.socketService.isOpen()) {
      return await cb(false, true);
    }
    if (this.failedConnectAttempt >= 10) {
      return await cb(true, false);
    }

    setTimeout(async () => {
      this.failedConnectAttempt++;
      await this.tryUntilConnect(cb);
    }, 6000);
  }

  async checkAndReAndScan() {
    await this.checkAndReconnect();
    this.socketService.send('scan');
  }

  async checkAndReconnect() {
    if (!this.socketService.isOpen()) {
      console.log('checkAndReconnect');
      try {
        await this.socketService.open('192.168.4.1', 8080);
      } catch (err) {
        await this.showErr("Can't connect to the board");
      }
    }
  }

  async sendCredentials(ssid: string) {
    await this.checkAndReconnect();
    this.connectMsg = 'Sending credentials ...';
    await this.socketService.send(`ssid ${ssid}`); // send ssid
  }

  async presentAlertPrompt(ssid: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-alert',
      header: ssid,
      message: 'Enter network password:',
      inputs: [
        {
          label: 'password',
          name: 'password',
          type: 'password',
          value: this.userInputPass,
          placeholder: 'Password',
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {},
        },
        {
          text: 'Connect',
          handler: async (alertData) => {
            console.log('Confirm Ok');
            this.userInputPass = alertData.password;
            await this.sendCredentials(ssid);
          },
        },
      ],
    });
    await alert.present();
  }
}
