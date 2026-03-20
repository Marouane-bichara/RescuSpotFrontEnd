import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import { environment } from '../../../environments/environment';
import { AppUser, AuthResponse, JwtPayload, LoginRequest } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  currentUser = signal<AppUser | null>(this.tokenService.getUser());
  isAuthenticated = signal<boolean>(this.tokenService.isTokenValid());

  login(email: string, password: string): Observable<AuthResponse> {
    const payload: LoginRequest = { email, password };

    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((response) => {
          this.tokenService.saveToken(response.token);

          const decoded = this.tokenService.decodeToken(response.token);
          const user = this.mapPayloadToUser(decoded, email);

          this.tokenService.saveUser(user);

          this.currentUser.set(user);
          this.isAuthenticated.set(this.tokenService.isTokenValid());
        })
      );
  }

  logout(): void {
    this.tokenService.clear();
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    const normalizedRole = role.toUpperCase();
    return user?.roles?.some((userRole) => userRole.toUpperCase() === normalizedRole) || false;
  }

  private mapPayloadToUser(decoded: JwtPayload | null, fallbackEmail: string): AppUser {
    const extractedRoles = decoded?.roles ?? (decoded?.role ? [decoded.role] : ['USER']);

    return {
      email: (decoded?.sub as string) || fallbackEmail,
      roles: extractedRoles.map((role) => role.toUpperCase()),
      firstName: (decoded?.firstName as string) || fallbackEmail.split('@')[0],
      lastName: (decoded?.lastName as string) || ''
    };
  }
}