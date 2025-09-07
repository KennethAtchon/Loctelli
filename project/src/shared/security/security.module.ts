import { Module } from '@nestjs/common';
import { PromptSecurityService } from './prompt-security.service';

@Module({
  providers: [PromptSecurityService],
  exports: [PromptSecurityService],
})
export class SecurityModule {}