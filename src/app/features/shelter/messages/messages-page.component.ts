import { Component, Input, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, finalize, interval } from 'rxjs';
import { ConversationType, ConversationResponse } from '../../../core/models/conversation.model';
import { MessageRequest, MessageResponse } from '../../../core/models/message.model';
import { UserResponse } from '../../../core/models/user.model';
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

  contacts: ChatContactItem[] = [];
  selectedContact: ChatContactItem | null = null;
  messages: MessageResponse[] = [];
  draftMessage = '';
  isLoadingContacts = false;
  isLoadingMessages = false;
  isSendingMessage = false;
  chatError = '';

  private conversationPairs: { peerAccountId: number; conversationId: number }[] = [];
  private pollingSub: Subscription | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentAccountId']) {
      this.refreshContacts(true);

      if (this.currentAccountId) {
        this.startPolling();
      } else {
        this.stopPolling();
        this.contacts = [];
        this.messages = [];
        this.selectedContact = null;
      }
    }

    if (changes['openUserAccountId']) {
      this.openUserFromInput();
    }

    if (changes['users'] && this.openUserAccountId) {
      this.openUserFromInput();
    }
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  selectContact(contact: ChatContactItem): void {
    this.selectedContact = contact;
    this.messages = [];
    this.chatError = '';
    this.refreshMessages(true);
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
          this.setConversationId(this.selectedContact.peerAccountId, response.conversationId);
        }

        this.refreshMessages(false);
        this.refreshContacts(false);
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

  private refreshContacts(showLoader: boolean): void {
    if (!this.currentAccountId) {
      return;
    }

    if (showLoader) {
      this.isLoadingContacts = true;
    }

    this.messageService.getUserConversations(this.currentAccountId).pipe(
      finalize(() => {
        if (showLoader) {
          this.isLoadingContacts = false;
        }
      })
    ).subscribe({
      next: (conversations) => {
        const nextContacts: ChatContactItem[] = [];
        const   nextPairs: { peerAccountId: number; conversationId: number }[] = [];

        for (const conversation of conversations || []) {
          const peerAccountId = conversation.receiverId;
          const conversationId = conversation.idConversation;

          if (!peerAccountId || !conversationId) {
            continue;
          }

          let pairExists = false;
          for (const pair of nextPairs) {
            if (pair.peerAccountId === peerAccountId) {
              pairExists = true;
              break;
            }
          }

          if (!pairExists) {
            nextPairs.push({ peerAccountId, conversationId });
          }

          let contactExists = false;
          for (const item of nextContacts) {
            if (item.peerAccountId === peerAccountId) {
              contactExists = true;
              break;
            }
          }

          if (contactExists) {
            continue;
          }

          const user = this.findUserByAccountId(peerAccountId);

          nextContacts.push({
            peerAccountId,
            displayName: conversation.receiverUsername || user?.account?.username || `User ${peerAccountId}`,
            photo: user?.account?.profilePhoto || ''
          });
        }

        this.conversationPairs = nextPairs;
        this.contacts = nextContacts;

        this.openUserFromInput();

        if (!this.selectedContact && this.contacts.length > 0) {
          this.selectedContact = this.contacts[0];
          this.refreshMessages(true);
          return;
        }

        if (this.selectedContact) {
          const selectedId = this.selectedContact.peerAccountId;
          let stillExists: ChatContactItem | null = null;

          for (const item of this.contacts) {
            if (item.peerAccountId === selectedId) {
              stillExists = item;
              break;
            }
          }

          if (stillExists) {
            this.selectedContact = stillExists;
            this.refreshMessages(false);
          } else {
            this.selectedContact = null;
            this.messages = [];
          }
        }
      },
      error: () => {
        this.contacts = [];
      }
    });
  }

  private refreshMessages(showLoader: boolean): void {
    if (!this.selectedContact) {
      this.messages = [];
      return;
    }

    const conversationId = this.getConversationId(this.selectedContact.peerAccountId);
    if (!conversationId) {
      this.messages = [];
      return;
    }

    if (showLoader) {
      this.isLoadingMessages = true;
    }

    this.messageService.getConversationMessages(conversationId).pipe(
      finalize(() => {
        if (showLoader) {
          this.isLoadingMessages = false;
        }
      })
    ).subscribe({
      next: (messages) => {
        this.messages = messages || [];
      },
      error: (error) => {
        this.chatError = error?.error?.message || 'Could not load messages.';
      }
    });
  }

  private openUserFromInput(): void {
    const accountId = this.openUserAccountId;
    if (!accountId) {
      return;
    }

    let contact = this.findContactByPeerAccountId(this.contacts, accountId);

    if (!contact) {
      const user = this.findUserByAccountId(accountId);

      contact = {
        peerAccountId: accountId,
        displayName: user?.account?.username || user?.firstName || `User ${accountId}`,
        photo: user?.account?.profilePhoto || ''
      };

      this.contacts = [contact, ...this.contacts];
    }

    if (this.selectedContact?.peerAccountId === accountId) {
      this.refreshMessages(true);
      return;
    }

    this.selectContact(contact);
  }

  private findUserByAccountId(accountId: number): UserResponse | undefined {
    for (const item of this.users) {
      const id = item.accountId || item.account?.idAccount;
      if (id === accountId) {
        return item;
      }
    }

    return undefined;
  }

  private findContactByPeerAccountId(contacts: ChatContactItem[], peerAccountId: number): ChatContactItem | undefined {
    for (const item of contacts) {
      if (item.peerAccountId === peerAccountId) {
        return item;
      }
    }

    return undefined;
  }

  private getConversationId(peerAccountId: number): number | null {
    for (const pair of this.conversationPairs) {
      if (pair.peerAccountId === peerAccountId) {
        return pair.conversationId;
      }
    }

    return null;
  }

  private setConversationId(peerAccountId: number, conversationId: number): void {
    for (const pair of this.conversationPairs) {
      if (pair.peerAccountId === peerAccountId) {
        pair.conversationId = conversationId;
        return;
      }
    }

    this.conversationPairs.push({ peerAccountId, conversationId });
  }

  private startPolling(): void {
    this.stopPolling();

    this.pollingSub = interval(3000).subscribe(() => {
      this.refreshContacts(false);
    });
  }

  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }
}
