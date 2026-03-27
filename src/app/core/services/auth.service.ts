import { Injectable } from '@angular/core';
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
  currentUser: AppUser | null;
  isAuthenticated: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    private tokenService: TokenService
  ) {
    this.currentUser = this.tokenService.getUser();
    this.isAuthenticated = this.tokenService.isTokenValid();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    const payload: LoginRequest = { email, password };

    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        tap((response) => {
          this.tokenService.saveToken(response.token);

          const decoded = this.tokenService.decodeToken(response.token);
          const user = this.mapPayloadToUser(decoded, email);

          this.tokenService.saveUser(user);

          this.currentUser = user;
          this.isAuthenticated = this.tokenService.isTokenValid();
        })
      );
  }

  logout(): void {
    this.http.post<{ message?: string }>(`${environment.apiUrl}/auth/logout`, {}).subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  hasRole(role: string): boolean {
    const user = this.currentUser;
    const normalizedRole = this.normalizeRole(role);

    if (!user?.roles) {
      return false;
    }

    for (const userRole of user.roles) {
      if (this.normalizeRole(userRole) === normalizedRole) {
        return true;
      }
    }

    return false;
  }

  getCurrentUser(): AppUser | null {
    return this.currentUser;
  }

  private mapPayloadToUser(decoded: JwtPayload | null, fallbackEmail: string): AppUser {
    const roleCandidates = [
      ...(decoded?.roles ?? []),
      ...(decoded?.['authorities'] ?? []),
      ...(decoded?.role ? [decoded.role] : [])
    ];

    const extractedRoles = roleCandidates.length > 0 ? roleCandidates : ['USER'];
    const normalizedRoles: string[] = [];

    for (const rawRole of extractedRoles) {
      const normalizedRole = this.normalizeRole(String(rawRole));
      if (!normalizedRole) {
        continue;
      }

      let alreadyExists = false;
      for (const existingRole of normalizedRoles) {
        if (existingRole === normalizedRole) {
          alreadyExists = true;
          break;
        }
      }

      if (!alreadyExists) {
        normalizedRoles.push(normalizedRole);
      }
    }

    return {
      email: (decoded?.sub as string) || fallbackEmail,
      roles: normalizedRoles,
      firstName: (decoded?.firstName as string) || fallbackEmail.split('@')[0],
      lastName: (decoded?.lastName as string) || ''
    };
  }

  private normalizeRole(role: string): string {
    const value = (role || '').toUpperCase().trim();
    return value.startsWith('ROLE_') ? value.substring(5) : value;
  }

  private finishLogout(): void {
    this.tokenService.clear();
    this.currentUser = null;
    this.isAuthenticated = false;
    this.router.navigate(['/login']);
  }
}