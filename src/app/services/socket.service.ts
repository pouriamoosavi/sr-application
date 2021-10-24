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

  // private onData(func: Function) {
  //   this.socket.onData = func;
  // }

  onDataObj(func: Function) {
    this.socket.onData = (dataArray: Uint8Array) => {
      try {
        if (dataArray.length > 0) {
          let dataStr = '';
          for (let i = 0; i < dataArray.length; i++) {
            dataStr += String.fromCharCode(dataArray[i]);
          }
          console.log('dataStr', dataStr);
          if (dataStr) {
            dataStr = dataStr.replace(/\0/g, '');
            const parsed = JSON.parse(dataStr);
            func(parsed);
          }
        }
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

  async send(command: string) {
    let data = new Uint8Array(command.length + 1);
    for (let i = 0; i < command.length; i++) {
      data[i] = command.charCodeAt(i);
    }
    data[command.length] = 0x0d;
    await this.write(data);
  }
}
