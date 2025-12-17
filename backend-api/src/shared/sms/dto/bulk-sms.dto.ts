import {
  IsString,
  IsNotEmpty,
  Length,
  IsArray,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkSmsRecipient {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class BulkSmsDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 1600, {
    message: 'Message must be between 1 and 1600 characters',
  })
  message: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one recipient is required' })
  @ValidateNested({ each: true })
  @Type(() => BulkSmsRecipient)
  recipients: BulkSmsRecipient[];
}
