import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message:
      'Phone number must be a valid international format (e.g., +1234567890)',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 1600, {
    message: 'Message must be between 1 and 1600 characters',
  })
  message: string;
}
