export interface User {
  user_id: number;
  username: string;
  name: string;
  learning_preferences: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  name: string;
  learning_preferences: string;
}
