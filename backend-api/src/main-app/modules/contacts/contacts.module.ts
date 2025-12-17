import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { EmailModule } from '../../../shared/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
