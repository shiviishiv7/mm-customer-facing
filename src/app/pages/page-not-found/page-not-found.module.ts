import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageNotFoundComponent } from './page-not-found.component';
import { RouterModule } from '@angular/router';
import {SharedModule} from '@shared/shared.module';



@NgModule({
  declarations: [PageNotFoundComponent],
  imports: [
    CommonModule,   SharedModule ,RouterModule.forChild([{ path: '', component: PageNotFoundComponent }])
  ]
})
export class PageNotFoundModule { }
