import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageRequest, MessageResponse } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class ChatWebsocketService {
  private client: Client | null = null;
  private sockJsFactory: ((url: string) => WebSocket) | null = null;

  async connect(): Promise<void> {
    if (this.client?.active) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    if (!this.sockJsFactory) {
      const sockJsModule = await import('sockjs-client');
      const SockJsCtor = (sockJsModule.default || sockJsModule) as unknown as new (url: string) => WebSocket;
      this.sockJsFactory = (url: string) => new SockJsCtor(url);
    }

    this.client = new Client({
      webSocketFactory: () => this.sockJsFactory!(environment.wsUrl),
      reconnectDelay: 3000
    });

    this.client.activate();
  }

  disconnect(): void {
    if (!this.client) {
      return;
    }

    this.client.deactivate();
    this.client = null;
  }

  subscribeToConversation(conversationId: number): Observable<MessageResponse> {
    return new Observable<MessageResponse>((observer) => {
      this.connect();

      const destination = `/topic/conversation/${conversationId}`;

      const waitForConnection = globalThis.setInterval(() => {
        if (!this.client?.connected) {
          return;
        }

        globalThis.clearInterval(waitForConnection);

        const subscription = this.client.subscribe(destination, (message: IMessage) => {
          const payload = JSON.parse(message.body) as MessageResponse;
          observer.next(payload);
        });

        observer.add(() => {
          subscription.unsubscribe();
        });
      }, 200);

      observer.add(() => {
        globalThis.clearInterval(waitForConnection);
      });
    });
  }

  sendMessage(message: MessageRequest): void {
    if (!this.client?.connected) {
      return;
    }

    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify(message)
    });
  }
}
