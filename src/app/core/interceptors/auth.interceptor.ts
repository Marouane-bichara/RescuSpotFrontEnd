import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenService } from '../services/token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const token = tokenService.getToken();
  const isLoginCall = req.url.indexOf('/auth/login') >= 0;

  if (token && !isLoginCall) {
    req = req.clone({
      setHeaders: { 
        Authorization: `Bearer ${token}` 
      }
    });
  }

  return next(req);
};