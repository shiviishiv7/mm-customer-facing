import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MaterialModule} from './material/material.module';
import {HeaderComponent} from './header/header.component';
import {FooterComponent} from './footer/footer.component';
import {ConfirmationDialogComponent} from './confirmation-dialog/confirmation-dialog.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LoadingDialogComponent} from './loading-dialog/loading-dialog.component';
import {FeedbackUsComponent} from './feedback-us/feedback-us.component';
import {RouterModule} from '@angular/router';

import {ShowSettingProfileComponent} from './show-setting-profile/show-setting-profile.component';
import {ShowLoadingRefComponent} from './show-loading-ref/show-loading-ref.component';
import {PyqHomeButtonComponent} from './pyq-home-button/pyq-home-button.component';
import {PyqBackButtonComponent} from './pyq-back-button/pyq-back-button.component';
import {ReviewComponent} from './review/review.component';
import {FullscreenDirective} from '@shared/directive/full-screen.directive';
import {FabToggleTestComponent} from '@shared/fab-toggle-test/fab-toggle-test.component';
import {FabButtonDashboardComponent} from '@shared/fab-button-dashboard/fab-button-dashboard.component';

@NgModule({
  declarations: [FullscreenDirective, HeaderComponent, FooterComponent, ConfirmationDialogComponent, FabToggleTestComponent, FabButtonDashboardComponent,
    LoadingDialogComponent, ShowLoadingRefComponent, ReviewComponent,
    FeedbackUsComponent, ShowSettingProfileComponent, PyqHomeButtonComponent, PyqBackButtonComponent],
  imports: [
    CommonModule, MaterialModule, FormsModule, RouterModule,
    ReactiveFormsModule,
  ],
  exports: [MaterialModule, HeaderComponent, FooterComponent, PyqHomeButtonComponent,
    PyqBackButtonComponent, FabToggleTestComponent,
    FabButtonDashboardComponent, LoadingDialogComponent, ShowLoadingRefComponent, FullscreenDirective]
})
export class SharedModule {
}
