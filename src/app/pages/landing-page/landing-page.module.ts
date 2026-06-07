import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LandingPageComponent} from './landing-page.component';
import {RouterModule, Routes} from '@angular/router';
import {SharedModule} from '@shared/shared.module';
import { HomeComponent } from '../general/home/home.component';
import { ProductsComponent } from '../general/products/products.component';
import { ContactUsComponent } from '../general/contact-us/contact-us.component';
import { TermsConditionsComponent } from '../general/terms-conditions/terms-conditions.component';
import { PrivacyPolicyComponent } from '../general/privacy-policy/privacy-policy.component';
import { AboutUsComponent } from '../general/about-us/about-us.component';

const routes: Routes = [
  {path: '', component: LandingPageComponent}
];


@NgModule({
  declarations: [LandingPageComponent, HomeComponent, ProductsComponent, ContactUsComponent, TermsConditionsComponent, PrivacyPolicyComponent, AboutUsComponent],
  imports: [
    CommonModule, SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class LandingPageModule {
}
