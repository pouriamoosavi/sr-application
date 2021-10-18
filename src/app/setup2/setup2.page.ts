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
  userInputSsid: string;
  userInputPass: string;
  connectButtonPending: boolean;
  connectButtonText: string;
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
    try {
      await this.checkAndReconnect();
      this.socketService.onData(async (data) => {
        if (data[0] == 0b00000001 && data[1] != 0b00000000) {
          // ssid result successful
          await this.socketService.sendStPass(this.userInputPass); // send password
        } else if (data[0] == 0b00000010 && data[1] != 0b00000000) {
          // password result successful
          this.connectButtonText = 'Trying to connect to network';
          await this.socketService.sendConnectToSt(); // send connect
        } else if (data[0] == 0b00000011 && data[1] != 0b11111111) {
          // connect board to router as station successful
          this.connectButtonText = 'Almost done';
          let stIP = '';
          for (let i = 2; i < data.length; i++) {
            stIP += String(data[i]);
          }
          await this.storageService.set('espStationIP', stIP);
          await this.router.navigate(['/lamp']);
        } else {
          await this.showErr(
            `Can't send SSID and/or password to the board. code: ${data[1]}`
          );
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

  ionViewWillLeave() {
    this.socketService.safeClose();
  }

  async showErr(msg) {
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: 'Something went wrong',
      message: msg,
      buttons: ['OK'],
    });

    this.resetButton();
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
  }

  async sendCredentials() {
    await this.checkAndReconnect();
    this.connectButtonPending = true;
    this.connectButtonText = 'Sending credentials';
    await this.socketService.sendStSsid(this.userInputPass); // send ssid
  }
}
