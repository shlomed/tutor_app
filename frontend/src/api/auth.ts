import client from './client';
import type { TokenResponse, User } from '../types/auth';

export async function login(username: string, password: string): Promise<TokenResponse> {
  const form = new URLSearchParams();
  form.append('username', username);
  form.append('password', password);
  const { data } = await client.post<TokenResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return data;
}

export async function register(username: string, name: string, password: string): Promise<void> {
  await client.post('/auth/register', { username, name, password });
}

export async function getMe(): Promise<User> {
  const { data } = await client.get<User>('/auth/me');
  return data;
}

export async function updatePreferences(learning_preferences: string): Promise<void> {
  await client.put('/auth/preferences', { learning_preferences });
}
