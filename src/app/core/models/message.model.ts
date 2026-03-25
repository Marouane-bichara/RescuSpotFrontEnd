import { ConversationType } from './conversation.model';

export interface MessageRequest {
  senderId: number;
  receiverId: number;
  content: string;
  conversationType: ConversationType;
}

export interface MessageResponse {
  idMessage: number;
  conversationId: number;
  senderId: number;
  senderUsername: string;
  content: string;
  sentAt: string | Date;
}
