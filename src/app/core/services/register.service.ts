import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShelterRegisterRequest, UserRegisterRequest } from '../models/register.model';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  private http = inject(HttpClient);

  registerUser(payload: UserRegisterRequest): Observable<unknown> {
    return this.postWithFallback(payload, [
      '/users',
      '/user/register',
      '/auth/register/user'
    ]);
  }

  registerShelter(payload: ShelterRegisterRequest): Observable<unknown> {
    return this.postWithFallback(payload, [
      '/shelters',
      '/shelter/register',
      '/auth/register/shelter'
    ]);
  }

  private postWithFallback<T>(payload: T, paths: string[]): Observable<unknown> {
    const [currentPath, ...remainingPaths] = paths;

    if (!currentPath) {
      return throwError(() => new Error('No registration endpoint configured.'));
    }

    return this.http.post(`${environment.apiUrl}${currentPath}`, payload).pipe(
      catchError((error) => {
        if (remainingPaths.length > 0) {
          return this.postWithFallback(payload, remainingPaths);
        }
        return throwError(() => error);
      })
    );
  }
}
