import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserResponse } from '../../../core/models/user.model';

@Component({
  selector: 'app-user-users-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-page.component.html'
})
export class UserUsersPageComponent {
  @Input() users: UserResponse[] = [];
  @Input() currentAccountId: number | null = null;
  @Input() localImageServerUrl = 'http://localhost:8090';

  @Output() messageUser = new EventEmitter<number>();

  searchText = '';

  getFilteredUsers(): UserResponse[] {
    const text = this.searchText.trim().toLowerCase();
    const result: UserResponse[] = [];

    for (const user of this.users) {
      const accountId = user.accountId || user.account?.idAccount;
      if (!accountId || accountId === this.currentAccountId) {
        continue;
      }

      if (!text) {
        result.push(user);
        continue;
      }

      const firstName = (user.firstName || '').toLowerCase();
      const lastName = (user.lastName || '').toLowerCase();
      const username = (user.account?.username || '').toLowerCase();
      const email = (user.account?.email || '').toLowerCase();

      if (
        firstName.indexOf(text) >= 0 ||
        lastName.indexOf(text) >= 0 ||
        username.indexOf(text) >= 0 ||
        email.indexOf(text) >= 0
      ) {
        result.push(user);
      }
    }

    return result;
  }

  getDisplayName(user: UserResponse): string {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    return fullName || user.account?.username || user.account?.email || `User ${user.idUser}`;
  }

  getPhoto(user: UserResponse): string {
    const rawPath = (user.account?.profilePhoto || '').trim();

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

  startChat(user: UserResponse): void {
    const accountId = user.accountId || user.account?.idAccount;
    if (!accountId) {
      return;
    }

    this.messageUser.emit(accountId);
  }
}
