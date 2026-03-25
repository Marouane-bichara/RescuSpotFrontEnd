import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ShelterRequest, ShelterResponse } from '../models/shelter.model';

@Injectable({
  providedIn: 'root'
})
export class ShelterService {
  private baseUrl = `${environment.apiUrl}/shelters`;

  constructor(private http: HttpClient) {}

  createShelter(payload: ShelterRequest): Observable<ShelterResponse> {
    return this.http.post<ShelterResponse>(this.baseUrl, payload);
  }

  getAllShelters(): Observable<ShelterResponse[]> {
    return this.http.get<ShelterResponse[]>(this.baseUrl);
  }

  getShelterById(id: number): Observable<ShelterResponse> {
    return this.http.get<ShelterResponse>(`${this.baseUrl}/${id}`);
  }

  getShelterIdByAccountId(accountId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/${accountId}/getShelterByAccount`);
  }

  updateShelter(id: number, payload: ShelterRequest): Observable<ShelterResponse> {
    return this.http.put<ShelterResponse>(`${this.baseUrl}/${id}`, payload);
  }

  deleteShelter(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
