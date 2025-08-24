import { IsString, IsNotEmpty } from 'class-validator';

export class CreateContactNoteDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}