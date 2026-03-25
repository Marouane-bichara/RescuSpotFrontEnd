import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { ConversationType, ConversationResponse } from '../../../core/models/conversation.model';
import { MessageRequest, MessageResponse } from '../../../core/models/message.model';
import { UserResponse } from '../../../core/models/user.model';
import { ChatWebsocketService } from '../../../core/services/chat-websocket.service';
import { MessageService } from '../../../core/services/message.service';

interface ChatContactItem {
  peerAccountId: number;
  displayName: string;
  photo?: string;
}

@Component({
  selector: 'app-shelter-messages-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './messages-page.component.html'
})
export class ShelterMessagesPageComponent implements OnChanges, OnDestroy {
  @Input() currentAccountId: number | null = null;
  @Input() openUserAccountId: number | null = null;
  @Input() users: UserResponse[] = [];
  @Input() localImageServerUrl = 'http://localhost:8090';

  private messageService = inject(MessageService);
  private chatWebsocketService = inject(ChatWebsocketService);

  contacts: ChatContactItem[] = [];
  selectedContact: ChatContactItem | null = null;
  messages: MessageResponse[] = [];
  draftMessage = '';
  isLoadingContacts = false;
  isLoadingMessages = false;
  isSendingMessage = false;
  chatError = '';

  private conversationByPeerAccount = new Map<number, number>();
  private realtimeSub: Subscription | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentAccountId']) {
      this.loadContacts();
    }

    if (changes['openUserAccountId']) {
      this.openUserFromInput();
    }

    if (changes['users'] && this.openUserAccountId) {
      this.openUserFromInput();
    }
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
    this.chatWebsocketService.disconnect();
  }

  selectContact(contact: ChatContactItem): void {
    this.selectedContact = contact;
    this.messages = [];
    this.chatError = '';

    const conversationId = this.conversationByPeerAccount.get(contact.peerAccountId);
    if (!conversationId) {
      this.realtimeSub?.unsubscribe();
      return;
    }

    this.loadConversation(conversationId);
  }

  sendMessage(): void {
    const text = this.draftMessage.trim();
    if (!text || !this.currentAccountId || !this.selectedContact) {
      return;
    }

    const payload: MessageRequest = {
      senderId: this.currentAccountId,
      receiverId: this.selectedContact.peerAccountId,
      content: text,
      conversationType: 'ADOPTION' as ConversationType
    };

    this.isSendingMessage = true;
    this.chatError = '';

    this.messageService.sendMessage(payload).pipe(
      finalize(() => this.isSendingMessage = false)
    ).subscribe({
      next: (response) => {
        this.draftMessage = '';

        if (response.conversationId && this.selectedContact) {
          this.conversationByPeerAccount.set(this.selectedContact.peerAccountId, response.conversationId);
          this.subscribeRealtime(response.conversationId);
        }

        this.pushIfNew(response);
        this.chatWebsocketService.sendMessage(payload);
      },
      error: (error) => {
        this.chatError = error?.error?.message || 'Could not send message.';
      }
    });
  }

  getContactPhoto(contact: ChatContactItem): string {
    const rawPath = (contact.photo || '').trim();

    if (!rawPath) {
      return 'https://placehold.co/96x96/0f172a/cbd5e1?text=U';
    }

    if (rawPath.startsWith('http') || rawPath.startsWith('data:')) {
      return rawPath;
    }

    if (rawPath.startsWith('/')) {
      return `${this.localImageServerUrl}${rawPath}`;
    }

    return `${this.localImageServerUrl}/${rawPath}`;
  }

  isMine(message: MessageResponse): boolean {
    return message.senderId === this.currentAccountId;
  }

  formatTime(value: string | Date): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private loadContacts(): void {
    if (!this.currentAccountId) {
      return;
    }

    this.isLoadingContacts = true;

    this.messageService.getUserConversations(this.currentAccountId).pipe(
      finalize(() => this.isLoadingContacts = false)
    ).subscribe({
      next: (conversations) => {
        this.mapContacts(conversations || []);

        this.openUserFromInput();

        if (this.selectedContact) {
          this.tryLoadSelectedConversation();
        }

        const currentContacts = this.contacts;
        if (!this.selectedContact && currentContacts.length > 0) {
          this.selectContact(currentContacts[0]);
        }
      },
      error: () => {
        this.contacts = [];
      }
    });
  }

  private mapContacts(conversations: ConversationResponse[]): void {
    this.conversationByPeerAccount.clear();

    const nextContacts: ChatContactItem[] = [];

    for (const conversation of conversations) {
      const peerAccountId = conversation.receiverId;
      const conversationId = conversation.idConversation;

      if (!peerAccountId || !conversationId) {
        continue;
      }

      this.conversationByPeerAccount.set(peerAccountId, conversationId);

      const exists = nextContacts.some((item) => item.peerAccountId === peerAccountId);
      if (exists) {
        continue;
      }

      const user = this.users.find((item) => {
        const accountId = item.accountId || item.account?.idAccount;
        return accountId === peerAccountId;
      });

      nextContacts.push({
        peerAccountId,
        displayName: conversation.receiverUsername || user?.account?.username || `User ${peerAccountId}`,
        photo: user?.account?.profilePhoto || ''
      });
    }

    this.contacts = nextContacts;
  }

  private loadConversation(conversationId: number): void {
    this.isLoadingMessages = true;

    this.messageService.getConversationMessages(conversationId).pipe(
      finalize(() => this.isLoadingMessages = false)
    ).subscribe({
      next: (messages) => {
        this.messages = messages || [];
        this.subscribeRealtime(conversationId);
      },
      error: (error) => {
        this.chatError = error?.error?.message || 'Could not load messages.';
      }
    });
  }

  private subscribeRealtime(conversationId: number): void {
    this.realtimeSub?.unsubscribe();
    this.realtimeSub = this.chatWebsocketService.subscribeToConversation(conversationId).subscribe({
      next: (message) => {
        this.pushIfNew(message);
      }
    });
  }

  private pushIfNew(message: MessageResponse): void {
    const exists = this.messages.some((item) => item.idMessage === message.idMessage);
    if (!exists) {
      this.messages = [...this.messages, message];
    }
  }

  private openUserFromInput(): void {
    const accountId = this.openUserAccountId;
    if (!accountId) {
      return;
    }

    let contact = this.contacts.find((item) => item.peerAccountId === accountId);

    if (!contact) {
      const user = this.users.find((item) => {
        const id = item.accountId || item.account?.idAccount;
        return id === accountId;
      });

      contact = {
        peerAccountId: accountId,
        displayName: user?.account?.username || user?.firstName || `User ${accountId}`,
        photo: user?.account?.profilePhoto || ''
      };

      this.contacts = [contact, ...this.contacts];
    }

    if (this.selectedContact?.peerAccountId === accountId) {
      this.tryLoadSelectedConversation();
      return;
    }

    this.selectContact(contact);
  }

  private tryLoadSelectedConversation(): void {
    if (!this.selectedContact) {
      return;
    }

    const conversationId = this.conversationByPeerAccount.get(this.selectedContact.peerAccountId);
    if (!conversationId) {
      return;
    }

    this.loadConversation(conversationId);
  }
}
