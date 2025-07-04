import { ApiClient } from '../client';
import { User, CreateUserDto } from '@/types';

export class UsersApi extends ApiClient {
  async getUsers(): Promise<User[]> {
    return this.get<User[]>('/users');
  }

  async getUser(id: number): Promise<User> {
    return this.get<User>(`/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.post<User>('/users', data);
  }

  async updateUser(id: number, data: Partial<CreateUserDto>): Promise<User> {
    return this.patch<User>(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete<void>(`/users/${id}`);
  }
} 