import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LampPage } from './lamp.page';

const routes: Routes = [
  {
    path: '',
    component: LampPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LampPageRoutingModule {}
