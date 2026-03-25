import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationResponse } from '../models/conversation.model';
import { MessageRequest, MessageResponse } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private baseUrl = `${environment.apiUrl}/messages`;

  constructor(private http: HttpClient) {}

  sendMessage(payload: MessageRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.baseUrl}/send`, payload);
  }

  getConversationMessages(conversationId: number): Observable<MessageResponse[]> {
    return this.http.get<MessageResponse[]>(`${this.baseUrl}/conversation/${conversationId}`);
  }

  getUserConversations(userId: number): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(`${this.baseUrl}/user/${userId}/conversations`);
  }
}
