import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AdoptionDecision, AdoptionRequest, AdoptionResponse } from '../models/adoption.model';

@Injectable({
  providedIn: 'root'
})
export class AdoptionService {
  private baseUrl = `${environment.apiUrl}/adoptions`;

  constructor(private http: HttpClient) {}

  createAdoption(payload: AdoptionRequest): Observable<AdoptionResponse> {
    return this.http.post<AdoptionResponse>(this.baseUrl, payload);
  }

  getAllAdoptions(): Observable<AdoptionResponse[]> {
    return this.http.get<AdoptionResponse[]>(this.baseUrl);
  }

  getAdoptionById(id: number): Observable<AdoptionResponse> {
    return this.http.get<AdoptionResponse>(`${this.baseUrl}/${id}`);
  }

  reviewAdoption(id: number, payload: AdoptionDecision): Observable<AdoptionResponse> {
    return this.http.patch<AdoptionResponse>(`${this.baseUrl}/${id}/review`, payload);
  }

  deleteAdoption(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
