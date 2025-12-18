import { ApiClient } from "../client";
import { User, CreateUserDto } from "@/types";

export class UsersApi {
  constructor(private client: ApiClient) {}
  async getUsers(): Promise<User[]> {
    return this.client.get<User[]>("/user");
  }

  async getUser(id: number): Promise<User> {
    return this.client.get<User>(`/user/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.client.post<User>("/user", data);
  }

  async updateUser(id: number, data: Partial<CreateUserDto>): Promise<User> {
    return this.client.patch<User>(`/user/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.client.delete<void>(`/user/${id}`);
  }
}
