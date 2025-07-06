import { Apilead } from '../lead';
import { User, CreateUserDto } from '@/types';

export class UsersApi extends Apilead {
  async getUsers(): Promise<User[]> {
    return this.get<User[]>('/user');
  }

  async getUser(id: number): Promise<User> {
    return this.get<User>(`/user/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.post<User>('/user', data);
  }

  async updateUser(id: number, data: Partial<CreateUserDto>): Promise<User> {
    return this.patch<User>(`/user/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete<void>(`/user/${id}`);
  }
} 