import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { StorageService } from '../services/storage.service';

@Injectable({
  providedIn: 'root',
})
export class BoardIPService implements CanActivate {
  constructor(private router: Router, private storageService: StorageService) {}
  async canActivate() {
    const espStationIP = await this.storageService.get('espStationIP');
    if (espStationIP) {
      return true;
    } else {
      this.router.navigate(['/setup']);
      return false;
    }
  }
}
