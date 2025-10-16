import { IsString, IsOptional } from 'class-validator';

export class JoinSubAccountDto {
  @IsString()
  invitationCode: string;

  @IsString()
  @IsOptional()
  password?: string; // Required if invitation is password-protected
}
