import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShelterRegisterRequest, UserRegisterRequest } from '../models/register.model';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  constructor(private http: HttpClient) {}

  registerUser(payload: UserRegisterRequest): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/users`, payload);
  }

  registerShelter(payload: ShelterRegisterRequest): Observable<unknown> {
    return this.http.post(`${environment.apiUrl}/shelters`, payload);
  }
}
