import { Controller, Get, Query, Logger, NotFoundException } from '@nestjs/common';
import { AgentFactoryService } from './agent-factory.service';
import { AgentConfigService } from './config/agent-config.service';
import { sql } from 'drizzle-orm';

/**
 * Dev controller for AI-receptionist
 * Provides development/debugging endpoints for inspecting agent state and SDK tables
 */
@Controller('ai-receptionist/dev')
export class AIReceptionistDevController {
  private readonly logger = new Logger(AIReceptionistDevController.name);

  constructor(
    private agentFactory: AgentFactoryService,
    private agentConfig: AgentConfigService
  ) {}

  /**
   * Get table data with pagination
   */
  @Get('table-data')
  async getTableData(
    @Query('tableName') tableName: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50'
  ) {
    if (!tableName) {
      throw new NotFoundException('tableName query parameter is required');
    }

    try {
      const factory = this.agentFactory.getFactory();
      const storage = factory.getStorage();

      if (!storage) {
        return {
          data: [],
          totalRows: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
          message: 'No database storage configured'
        };
      }

      const db = (storage as any).db;
      if (!db) {
        return {
          data: [],
          totalRows: 0,
          page: 1,
          pageSize: 50,
          totalPages: 0,
          message: 'Database connection not available'
        };
      }

      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const pageSizeNum = Math.max(1, Math.min(1000, parseInt(pageSize, 10) || 50));
      const offset = (pageNum - 1) * pageSizeNum;

      // Get total row count
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}
      `);
      const totalRows = parseInt(countResult.rows?.[0]?.count || countResult[0]?.count || '0', 10);
      const totalPages = Math.ceil(totalRows / pageSizeNum);

      // Get paginated data
      let data: any[] = [];
      if (totalRows > 0) {
        try {
          const dataResult = await db.execute(sql`
            SELECT * FROM ${sql.identifier(tableName)} 
            ORDER BY created_at DESC NULLS LAST, id DESC 
            LIMIT ${pageSizeNum} OFFSET ${offset}
          `);
          data = dataResult.rows || dataResult || [];
        } catch (err) {
          this.logger.warn(`Failed to fetch data for ${tableName} with ordering:`, err);
          // If created_at doesn't exist, try without ordering
          try {
            const dataResult = await db.execute(sql`
              SELECT * FROM ${sql.identifier(tableName)} 
              LIMIT ${pageSizeNum} OFFSET ${offset}
            `);
            data = dataResult.rows || dataResult || [];
          } catch (err2) {
            this.logger.warn(`Failed to fetch data for ${tableName} without ordering:`, err2);
          }
        }
      }

      return {
        data,
        totalRows,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages
      };
    } catch (error) {
      this.logger.error('Failed to get table data', error);
      throw error;
    }
  }

  /**
   * Get SDK-created tables information
   * Returns list of tables created by the SDK (ai_receptionist_*)
   */
  @Get('tables')
  async getSDKTables() {
    try {
      const factory = this.agentFactory.getFactory();
      const storage = factory.getStorage();

      if (!storage) {
        return {
          tables: [],
          message: 'No database storage configured'
        };
      }

      // Get database instance from storage
      const db = (storage as any).db;
      if (!db) {
        return {
          tables: [],
          message: 'Database connection not available'
        };
      }

      // Query for tables matching ai_receptionist_* pattern
      const tablesResult = await db.execute(sql`
        SELECT 
          table_name,
          (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        AND table_name LIKE 'ai_receptionist_%'
        ORDER BY table_name
      `);

      const tables: any[] = [];

      for (const row of tablesResult.rows || tablesResult) {
        const tableName = row.table_name || row[0];
        
        // Get column information
        const columnsResult = await db.execute(sql`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
          ORDER BY ordinal_position
        `);

        // Get row count
        const countResult = await db.execute(sql`
          SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}
        `);
        const rowCount = parseInt(countResult.rows?.[0]?.count || countResult[0]?.count || '0', 10);

        const tableObject: any = {
          name: tableName,
          columns: (columnsResult.rows || columnsResult).map((col: any) => ({
            name: col.column_name || col[0],
            type: col.data_type || col[1],
            nullable: col.is_nullable === 'YES' || col[2] === 'YES',
            default: col.column_default || col[3]
          })),
          rowCount
        }

        tables.push(tableObject);
      }

      return {
        tables,
        count: tables.length
      };
    } catch (error) {
      this.logger.error('Failed to get SDK tables', error);
      throw error;
    }
  }

  /**
   * Get agent information for debugging
   * Returns agent configuration, tools, providers, etc.
   */
  @Get('agent-info')
  async getAgentInfo(
    @Query('userId') userId: string,
    @Query('leadId') leadId: string
  ) {
    if (!userId || !leadId) {
      throw new NotFoundException('userId and leadId query parameters are required');
    }

    try {
      const userIdNum = parseInt(userId, 10);
      const leadIdNum = parseInt(leadId, 10);

      if (isNaN(userIdNum) || isNaN(leadIdNum)) {
        throw new NotFoundException('userId and leadId must be valid numbers');
      }

      // Get agent instance
      const agentConfig = await this.agentConfig.getAgentConfig(userIdNum, leadIdNum);
      const agentInstance = await this.agentFactory.getOrCreateAgent(
        userIdNum,
        leadIdNum,
        agentConfig
      );

      const agent = agentInstance.agent;
      const factory = this.agentFactory.getFactory();

      // Get identity
      const identity = agent.getIdentity();
      const identityInfo = {
        name: identity.name,
        role: identity.role,
        title: (identity as any).title,
        authorityLevel: identity.authorityLevel
      };

      // Get tools
      const toolRegistry = (agent as any).toolRegistry;
      const tools = toolRegistry ? toolRegistry.listAvailable().map((tool: any) => ({
        name: tool.name,
        description: tool.description
      })) : [];

      // Get providers
      const providerRegistry = factory.getProviderRegistry();
      const providers = providerRegistry ? providerRegistry.list() : [];

      // Get model info from factory config
      const factoryConfig = (factory as any).config;
      const modelInfo = factoryConfig?.model ? {
        provider: factoryConfig.model.provider || 'unknown',
        model: factoryConfig.model.model || 'unknown',
        temperature: factoryConfig.model.temperature,
        maxTokens: factoryConfig.model.maxTokens
      } : {
        provider: 'unknown',
        model: 'unknown',
        temperature: undefined,
        maxTokens: undefined
      };

      // Get memory config
      const memory = agent.getMemory();
      const memoryConfig = (memory as any).config || {};
      const memoryManager = (memory as any).memoryManager;
      const longTermMemory = memoryManager?.longTermMemory;
      const longTermEnabled = !!longTermMemory;
      
      // Get autoPersist config
      let autoPersist: {
        persistAll: boolean;
        minImportance?: number;
        types?: string[];
      } | null = null;
      if (memoryConfig.autoPersist) {
        autoPersist = {
          persistAll: memoryConfig.autoPersist.persistAll || false,
          minImportance: memoryConfig.autoPersist.minImportance,
          types: memoryConfig.autoPersist.types
        };
      } else if (longTermMemory) {
        // Try to get from longTermMemory config
        const ltmConfig = (longTermMemory as any).config;
        if (ltmConfig?.autoPersist) {
          autoPersist = {
            persistAll: ltmConfig.autoPersist.persistAll || false,
            minImportance: ltmConfig.autoPersist.minImportance,
            types: ltmConfig.autoPersist.types
          };
        }
      }

      const memoryInfo = {
        contextWindow: memoryConfig.contextWindow || 20,
        longTermEnabled,
        autoPersist
      };

      // Get full system prompt
      const systemPrompt = agent.getSystemPrompt();
      const systemPromptPreview = systemPrompt.substring(0, 500) + (systemPrompt.length > 500 ? '...' : '');

      // Get agent metadata
      const agentMetadata = {
        id: agent.id,
        status: agent.getStatus(),
        createdAt: (agent as any).createdAt,
        lastUsed: (agent as any).lastUsed
      };

      return {
        identity: identityInfo,
        tools,
        providers,
        model: modelInfo,
        memory: memoryInfo,
        systemPromptPreview,
        systemPromptFull: systemPrompt, // Include full prompt
        systemPromptLength: systemPrompt.length,
        agentId: agent.id,
        status: agent.getStatus(),
        metadata: agentMetadata
      };
    } catch (error) {
      this.logger.error('Failed to get agent info', error);
      throw error;
    }
  }
}

