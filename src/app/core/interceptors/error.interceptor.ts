import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError(error => {
      
      if (error.status === 401) {
        auth.logout();
      }

      let message = 'Une erreur est survenue';
      
      if (error.status === 401) {
        message = 'Session expirée. Veuillez vous reconnecter.';
      } else if (error.status === 403) {
        message = 'Accès refusé';
      } else if (error.status === 404) {
        message = 'Ressource non trouvée';
      } else if (error.error?.message) {
        message = error.error.message;
      }

      console.error('HTTP Error:', error);
      return throwError(() => ({ ...error, message }));
    })
  );
};