import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LampPageRoutingModule } from './lamp-routing.module';

import { LampPage } from './lamp.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LampPageRoutingModule
  ],
  declarations: [LampPage]
})
export class LampPageModule {}
