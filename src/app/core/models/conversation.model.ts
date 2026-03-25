export type ConversationType = 'DIRECT' | 'ADOPTION' | 'POST' | 'REPORT' | 'SYSTEM';

export interface ConversationRequest {
  senderId: number;
  receiverId: number;
  type: ConversationType;
  relatedEntityType?: string;
}

export interface ConversationResponse {
  idConversation: number;
  senderId?: number;
  senderUsername?: string;
  receiverId?: number;
  receiverUsername?: string;
  type?: ConversationType;
  relatedEntityType?: string;
}
