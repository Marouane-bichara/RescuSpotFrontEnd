import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AnimalRequest, AnimalResponse } from '../models/animal.model';

@Injectable({
  providedIn: 'root'
})
export class AnimalService {
  private baseUrl = `${environment.apiUrl}/animals`;

  constructor(private http: HttpClient) {}

  createAnimal(payload: AnimalRequest): Observable<AnimalResponse> {
    return this.http.post<AnimalResponse>(this.baseUrl, payload);
  }

  getAllAnimals(): Observable<AnimalResponse[]> {
    return this.http.get<AnimalResponse[]>(this.baseUrl);
  }

  getAnimalById(id: number): Observable<AnimalResponse> {
    return this.http.get<AnimalResponse>(`${this.baseUrl}/${id}`);
  }

  updateAnimal(id: number, payload: AnimalRequest): Observable<AnimalResponse> {
    return this.http.put<AnimalResponse>(`${this.baseUrl}/${id}`, payload);
  }

  deleteAnimal(id: number): Observable<string> {
    return this.http.delete(`${this.baseUrl}/${id}`, { responseType: 'text' });
  }
}
