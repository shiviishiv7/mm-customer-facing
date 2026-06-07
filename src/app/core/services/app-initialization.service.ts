import {Injectable} from '@angular/core';
import {fetchAuthSession, signOut} from 'aws-amplify/auth';
import {AuthService} from '@core/services/auth.service';
import {ApplicationRoutingEnum} from '@core/enums/application-routing-enum';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {
  constructor(private authService: AuthService) {
  }

  /**
   * Loads the application configuration on startup.
   * @returns A promise resolving when initialization is complete.
   */
  async loadConfig(): Promise<void> {
    await this.checkCurrentUser();
  }

  /**
   * Checks the current user's authentication state.
   */
  private async checkCurrentUser(): Promise<void> {
    try {
      console.log('Checking current user');
      // If user is not authenticated, check AWS Amplify for session
      if (!this.authService.isAuthenticated()) {

        console.log('No valid token found, checking AWS Amplify session...');
        const {accessToken, idToken} = (await fetchAuthSession()).tokens ?? {};

        if (idToken && idToken.payload?.sub) {
          this.authService.saveToken(idToken.toString());
        } else {
          this.authService.clearUserData();
          return;
        }
      } else {
        // console.log('User is already authenticated.');
        console.log('valid token found, checking AWS Amplify session...');
      }
    } catch (err) {
      console.log(err);
      // this.authService.clearUserData();
      // signOut();
    }
  }
}
