import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {ProductsComponent} from './products/products.component';
import {ContactUsComponent} from './contact-us/contact-us.component';
import {TermsConditionsComponent} from './terms-conditions/terms-conditions.component';
import {PrivacyPolicyComponent} from './privacy-policy/privacy-policy.component';
import {AboutUsComponent} from './about-us/about-us.component';

const routes: Routes = [
  {path: 'products', component: ProductsComponent},
  {path: 'contact-us', component: ContactUsComponent},
  {path: 'terms-conditions', component: TermsConditionsComponent},
  {path: 'privacy-policy', component: PrivacyPolicyComponent},
  {path: 'about-us', component: AboutUsComponent},
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GeneralRoutingModule { }
