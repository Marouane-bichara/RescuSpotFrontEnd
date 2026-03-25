import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationRequest, ConversationResponse } from '../models/conversation.model';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private baseUrl = `${environment.apiUrl}/conversations`;

  constructor(private http: HttpClient) {}

  createConversation(payload: ConversationRequest): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(this.baseUrl, payload);
  }
}
