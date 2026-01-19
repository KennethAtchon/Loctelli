import {
  Controller,
  Get,
  Query,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AgentConfigService } from './config/agent-config.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Dev controller for AI-receptionist
 * Provides development/debugging endpoints for inspecting agent state and SDK tables
 */
@Controller('ai-receptionist/dev')
export class AIReceptionistDevController {
  private readonly logger = new Logger(AIReceptionistDevController.name);

  constructor(
    private agentConfig: AgentConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get table data with pagination
   * Updated to use PrismaService directly
   */
  @Get('table-data')
  async getTableData(
    @Query('tableName') tableName: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    if (!tableName) {
      throw new NotFoundException('tableName query parameter is required');
    }

    try {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSizeNum = Math.max(
        1,
        Math.min(1000, parseInt(pageSize, 10) || 50),
      );
      const offset = (pageNum - 1) * pageSizeNum;

      // Get total row count using Prisma raw query
      const countResult = await this.prisma.$queryRawUnsafe<
        Array<{ count: bigint }>
      >(`SELECT COUNT(*) as count FROM "${tableName}"`);
      const totalRows = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(totalRows / pageSizeNum);

      // Get paginated data
      let data: any[] = [];
      if (totalRows > 0) {
        try {
          const dataResult = await this.prisma.$queryRawUnsafe(
            `SELECT * FROM "${tableName}" ORDER BY created_at DESC NULLS LAST, id DESC LIMIT ${pageSizeNum} OFFSET ${offset}`,
          );
          data = Array.isArray(dataResult) ? dataResult : [];
        } catch (err) {
          this.logger.warn(
            `Failed to fetch data for ${tableName} with ordering:`,
            err,
          );
          // If created_at doesn't exist, try without ordering
          try {
            const dataResult = await this.prisma.$queryRawUnsafe(
              `SELECT * FROM "${tableName}" LIMIT ${pageSizeNum} OFFSET ${offset}`,
            );
            data = Array.isArray(dataResult) ? dataResult : [];
          } catch (err2) {
            this.logger.warn(
              `Failed to fetch data for ${tableName} without ordering:`,
              err2,
            );
          }
        }
      }

      return {
        data,
        totalRows,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages,
      };
    } catch (error) {
      this.logger.error('Failed to get table data', error);
      throw error;
    }
  }

  /**
   * Get SDK-created tables information
   * Returns list of tables created by the old SDK (ai_receptionist_*)
   * Updated to use PrismaService
   */
  @Get('tables')
  async getSDKTables() {
    try {
      // Query for tables matching ai_receptionist_* pattern using Prisma
      const tablesResult = await this.prisma.$queryRawUnsafe<
        Array<{
          table_name: string;
          column_count: bigint;
        }>
      >(
        `SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        AND table_name LIKE 'ai_receptionist_%'
        ORDER BY table_name`,
      );

      const tables: any[] = [];

      for (const row of tablesResult) {
        const tableName = row.table_name;

        // Get column information
        const columnsResult = await this.prisma.$queryRawUnsafe<
          Array<{
            column_name: string;
            data_type: string;
            is_nullable: string;
            column_default: string | null;
          }>
        >(
          `SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = '${tableName}'
          ORDER BY ordinal_position`,
        );

        // Get row count
        const countResult = await this.prisma.$queryRawUnsafe<
          Array<{ count: bigint }>
        >(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const rowCount = Number(countResult[0]?.count || 0);

        const tableObject: any = {
          name: tableName,
          columns: columnsResult.map((col) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            default: col.column_default,
          })),
          rowCount,
        };

        tables.push(tableObject);
      }

      return {
        tables,
        count: tables.length,
      };
    } catch (error) {
      this.logger.error('Failed to get SDK tables', error);
      throw error;
    }
  }

  /**
   * Get agent information for debugging
   * Updated for config-based approach (no agent instances)
   */
  @Get('agent-info')
  async getAgentInfo(
    @Query('userId') userId: string,
    @Query('leadId') leadId: string,
  ) {
    if (!userId || !leadId) {
      throw new NotFoundException(
        'userId and leadId query parameters are required',
      );
    }

    try {
      const userIdNum = parseInt(userId, 10);
      const leadIdNum = parseInt(leadId, 10);

      if (isNaN(userIdNum) || isNaN(leadIdNum)) {
        throw new NotFoundException('userId and leadId must be valid numbers');
      }

      // Get agent configuration (config-based, no agent instance)
      const agentConfig = await this.agentConfig.getAgentConfig(
        userIdNum,
        leadIdNum,
      );
      const modelConfig = this.agentConfig.getModelConfig();

      // Build system prompt preview
      const { SystemPromptBuilderService } =
        await import('./services/system-prompt-builder.service');
      const promptBuilder = new SystemPromptBuilderService();
      const systemPrompt = promptBuilder.buildSystemPrompt(agentConfig);
      const systemPromptPreview =
        systemPrompt.substring(0, 500) +
        (systemPrompt.length > 500 ? '...' : '');

      return {
        identity: agentConfig.identity,
        personality: agentConfig.personality,
        knowledge: agentConfig.knowledge,
        goals: agentConfig.goals,
        memory: agentConfig.memory,
        model: {
          provider: modelConfig.provider || 'openai',
          model: modelConfig.model || 'gpt-4o-mini',
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens,
        },
        systemPromptPreview,
        systemPromptFull: systemPrompt,
        systemPromptLength: systemPrompt.length,
        note: 'Config-based approach - no agent instance (stateless)',
      };
    } catch (error) {
      this.logger.error('Failed to get agent info', error);
      throw error;
    }
  }
}
