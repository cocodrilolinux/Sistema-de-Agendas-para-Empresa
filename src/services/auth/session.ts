import type { User } from '../../types/user';

let currentUser: User | null = null;

export function getSessionUser(): User | null {
  return currentUser;
}

export function setSessionUser(user: User | null): void {
  currentUser = user;
}
