import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import "reflect-metadata";

(window as any).global = window;
(window as any).process = {
  env: {DEBUG: undefined},
};
import {Amplify} from 'aws-amplify';
import amplifyconfig from './amplifyconfiguration.json';
Amplify.configure(amplifyconfig);


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


