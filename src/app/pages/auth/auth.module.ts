import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {AuthRoutingModule} from './auth-routing.module';

import {AmplifyAuthenticatorModule} from '@aws-amplify/ui-angular';
import {SharedModule} from '@shared/shared.module';
import {SigninComponent} from './signin/signin.component';
import {SignoutComponent} from './signout/signout.component';
import {ReactiveFormsModule} from "@angular/forms";


@NgModule({
  declarations: [SigninComponent, SignoutComponent],
    imports: [
        CommonModule,
        AmplifyAuthenticatorModule,
        AuthRoutingModule,
        SharedModule,
        ReactiveFormsModule
    ]
})
export class AuthModule {
}
