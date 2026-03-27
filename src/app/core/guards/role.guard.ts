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

		let isAllowed = false;

		for (const role of allowedRoles) {
			if (authService.hasRole(role)) {
				isAllowed = true;
				break;
			}
		}

		if (isAllowed) {
			return true;
		}

		router.navigateByUrl('/unauthorized');
		return false;
	};
};
