import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { BoardIPService } from './middlewares/boardip.service';

const routes: Routes = [
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
    canActivate: [BoardIPService],
  },
  {
    path: 'setup',
    loadChildren: () =>
      import('./setup/setup.module').then((m) => m.SetupPageModule),
  },
  {
    path: 'setup-2',
    loadChildren: () =>
      import('./setup2/setup2.module').then((m) => m.Setup2PageModule),
  },
  {
    path: 'lamp',
    loadChildren: () =>
      import('./lamp/lamp.module').then((m) => m.LampPageModule),
    canActivate: [BoardIPService],
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
