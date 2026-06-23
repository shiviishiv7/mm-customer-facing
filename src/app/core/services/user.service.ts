import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseVO} from '../models/vo/base-vo';
import {environment} from '@environments/environment';
import {UserModel} from '../models/class/user-model';


@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseURL: string = environment.apiUrl;
  private pathURL: string = '/base-user-profile'; // Set a default value

  constructor(private http: HttpClient) {
    //console.log(this.baseURL);
  }

  // createUser removed — user creation is handled by AWS Lambda post-Cognito signup

  updateUser(user: UserModel): Observable<BaseVO<UserModel>> {
    return this.http.post<BaseVO<UserModel>>(`${this.baseURL}${this.pathURL}/update`, user);
  }

  fetchUserListByInstitutionCode(): Observable<BaseVO<Array<UserModel>>> {
    return this.http.get<BaseVO<Array<UserModel>>>(`${this.baseURL}${this.pathURL}/all`);
  }

  fetchUserByEmail(email: string): Observable<BaseVO<UserModel>> {
    return this.http.get<BaseVO<UserModel>>(`${this.baseURL}${this.pathURL}/by-email/${email}`);
  }

  fetchUserByCognitoSub(cognitoSub: string): Observable<BaseVO<UserModel>> {
    return this.http.get<BaseVO<UserModel>>(`${this.baseURL}${this.pathURL}/${cognitoSub}`);
  }

  removeUserFromInstitution(sub: string = '') {
    const params = new HttpParams().set('sub', sub);
    return this.http.delete<BaseVO<any>>(`${this.baseURL}${this.pathURL}/remove/institution`, {params});
  }

  addUserFromInstitution(institutionCode: string) {
    return this.http.post<BaseVO<any>>(`${this.baseURL}${this.pathURL}/add/institution/${institutionCode}`, null);
  }
}
