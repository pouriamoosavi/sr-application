import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { SocketService } from '../services/socket.service';

@Component({
  selector: 'app-setup',
  templateUrl: './setup.page.html',
  styleUrls: ['./setup.page.scss'],
})
export class SetupPage implements OnInit {
  userInputBoardIP: string;
  nextStep: string;
  checkButtonPending: boolean;
  checkButtonText: string;
  connectButtonPending: boolean;
  connectButtonText: string;
  constructor(
    private router: Router,
    private alertController: AlertController,
    private socketService: SocketService
  ) {}

  ngOnInit() {}

  resetButtons() {
    this.checkButtonPending = false;
    this.checkButtonText = '';
    this.connectButtonPending = false;
    this.connectButtonText = '';
  }

  ionViewDidEnter() {
    this.userInputBoardIP = '';
    this.nextStep = '';
    this.resetButtons();

    this.socketService.onDataObj(async (res) => {
      try {
        console.log(res);
        if (res.code == 0) {
          this.router.navigate([this.nextStep]);
        } else {
          await this.showErr(
            `Device response is not OK: ${JSON.stringify(res)}`
          );
        }
      } catch (err) {
        await this.showErr("Can't parse Device response");
        await this.socketService.safeClose();
      }
    });
    this.socketService.onError(async (errorMessage) => {
      await this.showErr(`Error: ${errorMessage}`);
      await this.socketService.safeClose();
    });
    this.socketService.onClose(async (hasError) => {
      await this.showErr(`Socket disconnected unexpectedly ${hasError}`);
      await this.socketService.safeClose();
    });
  }

  // async ionViewWillLeave() {
  //   await this.socketService.safeClose();
  // }

  async checkBoardIP() {
    await this.sendCheckPacket(this.userInputBoardIP);
    this.nextStep = '/lamp';
  }

  async connectBoardAP() {
    await this.sendCheckPacket('192.168.4.1');
    this.nextStep = '/setup-2';
  }

  async showErr(msg) {
    this.resetButtons();
    const alert = await this.alertController.create({
      header: 'Error',
      subHeader: 'Something went wrong',
      message: msg,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async sendCheckPacket(ip: string) {
    try {
      this.connectButtonPending = true;
      this.checkButtonPending = true;
      this.connectButtonText = 'Opening socket';
      this.checkButtonText = 'Opening socket';
      await this.socketService.open(ip, 8080);
      this.checkButtonText = 'Sending request';
      this.connectButtonText = 'Sending request';
      await this.socketService.send('status');
      this.resetButtons();
    } catch (err) {
      await this.showErr(err.message);
      await this.socketService.safeClose();
    }
  }
}
