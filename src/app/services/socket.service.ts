import { Injectable } from '@angular/core';
import * as Socket from '@vendus/sockets-for-cordova';
import { stringify } from 'querystring';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  /*    
    WL_NO_SHIELD        = 255,   // for compatibility with WiFi Shield library
    WL_IDLE_STATUS      = 0,
    WL_NO_SSID_AVAIL    = 1,
    WL_SCAN_COMPLETED   = 2,
    WL_CONNECTED        = 3,
    WL_CONNECT_FAILED   = 4,
    WL_CONNECTION_LOST  = 5,
    WL_DISCONNECTED     = 6

  */
  socket: Socket;
  constructor() {
    this.socket = new Socket();
  }

  async open(ip: string, port: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.open(
        ip,
        port,
        () => {
          resolve(true);
        },
        (errorMsg: string) => {
          reject(new Error(errorMsg));
        }
      );
    });
  }

  async close(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.close(
        () => {
          resolve(true);
        },
        (errorMsg: string) => {
          reject(new Error(errorMsg));
        }
      );
    });
  }

  onData(func: Function) {
    this.socket.onData = func;
  }

  onDataObj(func: Function) {
    this.socket.onData = (dataArray: Uint8Array) => {
      try {
        let out = {
          reqOp: dataArray[0],
          code: dataArray[1],
          data: {},
        };
        let dataStr = '';
        for (let i = 2; i < dataArray.length; i++) {
          dataStr += String.fromCharCode(dataArray[i]);
        }
        dataStr = dataStr.replace(/\0/g, '');
        out.data = JSON.parse(dataStr);
        func(out);
        // const bb = new Blob([dataArray]);
        // const f = new FileReader();
        // f.onload = function (e) {
        //   func(e.target.result);
        // };
        // f.readAsText(bb);
      } catch (err) {
        throw err;
      }
    };
  }

  onError(func: Function) {
    this.socket.onError = func;
  }

  onClose(func: Function) {
    this.socket.onClose = func;
  }

  private async write(byte: Uint8Array): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.write(
        byte,
        () => {
          resolve(true);
        },
        (errorMsg: string) => {
          reject(new Error(errorMsg));
        }
      );
    });
  }

  async shutdownWrite(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.socket.shutdownWrite(
        () => {
          resolve(true);
        },
        (errorMsg: string) => {
          reject(new Error(errorMsg));
        }
      );
    });
  }

  async safeClose() {
    try {
      if (this.isOpen()) {
        await this.shutdownWrite();
        await this.close();
      }
    } catch (err) {
      throw err;
    }
  }

  isOpen(): boolean {
    return this.socket.state == Socket.State.OPENED;
  }

  async sendReset() {
    try {
      let data = new Uint8Array(4);
      data[0] = 0b00000100;
      data[1] = 0;
      data[2] = 0;
      data[3] = 0b00000000;
      await this.write(data);
    } catch (err) {
      throw err;
    }
  }

  async sendStSsid(ssid: String) {
    try {
      let data = new Uint8Array(ssid.length + 4);
      data[0] = ssid.length + 4;
      data[1] = 0;
      data[2] = 0;
      data[3] = 0b00000001;
      for (let i = 0; i < ssid.length; i++) {
        data[i] = ssid.charCodeAt(i);
      }
      await this.write(data);
    } catch (err) {
      throw err;
    }
  }

  async sendStPass(pass: String) {
    try {
      let data = new Uint8Array(pass.length + 4);
      data[0] = pass.length + 4;
      data[1] = 0;
      data[2] = 0;
      data[3] = 0b00000010;
      for (let i = 0; i < pass.length; i++) {
        data[i] = pass.charCodeAt(i);
      }
      await this.write(data);
    } catch (err) {
      throw err;
    }
  }

  async sendConnectToSt() {
    try {
      let data = new Uint8Array(4);
      data[0] = 0b00000100;
      data[1] = 0;
      data[2] = 0;
      data[3] = 0b00000011;
      await this.write(data);
    } catch (err) {
      throw err;
    }
  }

  async sendDisableAp() {}

  async sendStatusCheck() {
    try {
      let data = new Uint8Array(4);
      data[0] = 0b00000100;
      data[1] = 0;
      data[2] = 0;
      data[3] = 0b00000101;
      await this.write(data);
    } catch (err) {
      throw err;
    }
  }
}
