export interface SessionPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
}
