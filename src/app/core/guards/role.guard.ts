import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
	return () => {
		const authService = inject(AuthService);
		const tokenService = inject(TokenService);
		const router = inject(Router);

		if (!tokenService.isTokenValid()) {
			tokenService.clear();
			router.navigateByUrl('/login');
			return false;
		}

		const isAllowed = allowedRoles.some((role) => authService.hasRole(role));
		if (isAllowed) {
			return true;
		}

		router.navigateByUrl('/unauthorized');
		return false;
	};
};
