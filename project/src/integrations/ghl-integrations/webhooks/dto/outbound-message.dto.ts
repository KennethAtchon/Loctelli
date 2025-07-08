import { IsString, IsOptional } from 'class-validator';

export class OutboundMessageDto {
  @IsString()
  contactId: string;

  @IsString()
  @IsOptional()
  messageType?: string;

  @IsString()
  @IsOptional()
  body?: string;
}
