import { ApiClient } from "../client";
import { User, CreateUserDto } from "@/types";
import { EndpointApiBuilder, EndpointApi } from "../config/endpoint-builder";
import { usersConfig } from "../config/users.config";

export class UsersApi {
  private api: EndpointApi<typeof usersConfig>;

  constructor(private client: ApiClient) {
    const builder = new EndpointApiBuilder(client);
    this.api = builder.buildApi(usersConfig);
  }

  async getUsers(): Promise<User[]> {
    return this.api.getUsers();
  }

  async getUser(id: number): Promise<User> {
    return this.api.getUser({ id });
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.api.createUser(undefined, data);
  }

  async updateUser(id: number, data: Partial<CreateUserDto>): Promise<User> {
    return this.api.updateUser({ id }, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.api.deleteUser({ id });
  }
}
