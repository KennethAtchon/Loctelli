import { Injectable, Logger } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { GenericTaskJobData } from '../interfaces/job-data.interface';
import { ServiceRegistry } from '../service-registry';

@Injectable()
export class GenericTaskProcessor extends BaseProcessor {
  private serviceRegistry = ServiceRegistry.getInstance();

  constructor() {
    super();
  }

  async process(data: GenericTaskJobData): Promise<any> {
    this.logStart('Generic Task', { taskName: data.taskName });

    try {
      let result: any;

      if (data.serviceName) {
        // Execute method on a service instance
        result = await this.executeServiceMethod(data);
      } else {
        // Execute standalone function
        result = await this.executeStandaloneFunction(data);
      }

      this.logSuccess('Generic Task', { taskName: data.taskName, result });
      return {
        taskName: data.taskName,
        functionName: data.functionName,
        serviceName: data.serviceName,
        result,
        executedAt: new Date(),
        success: true,
      };
    } catch (error) {
      this.logError('Generic Task', error);
      throw error;
    }
  }

  private async executeServiceMethod(data: GenericTaskJobData): Promise<any> {
    try {
      // Get service method from registry
      const method = this.serviceRegistry.getServiceMethod(
        data.serviceName!,
        data.functionName,
      );

      if (!method) {
        const availableServices = this.serviceRegistry.getRegisteredServices();
        const availableMethods = this.serviceRegistry.hasService(
          data.serviceName!,
        )
          ? this.serviceRegistry.getServiceMethods(data.serviceName!)
          : [];

        throw new Error(
          `Service method '${data.serviceName}.${data.functionName}' not found in registry.\n` +
            `Available services: ${availableServices.join(', ')}\n` +
            `Available methods for ${data.serviceName}: ${availableMethods.join(', ')}`,
        );
      }

      this.logger.log(
        `📞 Calling ${data.serviceName}.${data.functionName}() via registry`,
      );

      // Execute the method with provided parameters
      const result = await method(...data.parameters);

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute service method:`, error);
      throw error;
    }
  }

  private async executeStandaloneFunction(
    data: GenericTaskJobData,
  ): Promise<any> {
    try {
      // For standalone functions, we'll need to maintain a registry
      const taskRegistry = this.getTaskRegistry();

      if (!taskRegistry[data.functionName]) {
        throw new Error(
          `Function '${data.functionName}' not found in task registry`,
        );
      }

      this.logger.log(`🔧 Executing function ${data.functionName}()`);

      const func = taskRegistry[data.functionName];
      const result = await func(...data.parameters, data.context || {});

      return result;
    } catch (error) {
      this.logger.error(`Failed to execute standalone function:`, error);
      throw error;
    }
  }

  /**
   * Registry for standalone functions that can be executed
   * Add your custom functions here
   */
  private getTaskRegistry(): Record<string, Function> {
    return {
      // Example functions
      delay: async (ms: number) => {
        await new Promise((resolve) => setTimeout(resolve, ms));
        return { message: `Delayed for ${ms}ms`, completedAt: new Date() };
      },

      calculateSum: async (numbers: number[]) => {
        const sum = numbers.reduce((a, b) => a + b, 0);
        return { numbers, sum };
      },

      processData: async (data: any[], operation: string, context: any) => {
        switch (operation) {
          case 'count':
            return { count: data.length, operation };
          case 'filter':
            const filtered = data.filter((item) =>
              context.filterKey
                ? item[context.filterKey] === context.filterValue
                : true,
            );
            return {
              original: data.length,
              filtered: filtered.length,
              data: filtered,
            };
          case 'transform':
            const transformed = data.map((item) => ({
              ...item,
              processed: true,
              processedAt: new Date(),
            }));
            return { transformed };
          default:
            return { data, operation: 'none' };
        }
      },

      sendNotification: async (
        type: string,
        recipients: string[],
        message: string,
        context: any,
      ) => {
        // Simulate notification sending
        const results = recipients.map((recipient) => ({
          recipient,
          type,
          message,
          sent: true,
          sentAt: new Date(),
        }));

        return {
          type,
          totalRecipients: recipients.length,
          results,
          context,
        };
      },

      cleanupOldData: async (
        tableName: string,
        daysOld: number,
        context: any,
      ) => {
        // Simulate data cleanup
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return {
          tableName,
          cutoffDate,
          deletedRecords: Math.floor(Math.random() * 100), // Simulated
          cleanupCompletedAt: new Date(),
        };
      },

      generateReport: async (
        reportType: string,
        filters: any,
        context: any,
      ) => {
        // Simulate report generation
        return {
          reportType,
          filters,
          generatedAt: new Date(),
          recordCount: Math.floor(Math.random() * 1000),
          filePath: `/reports/${reportType}_${Date.now()}.pdf`,
          context,
        };
      },

      // Custom async task example
      customAsyncTask: async (taskId: string, data: any, context: any) => {
        // Your custom logic here
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate work

        return {
          taskId,
          processedData: data,
          context,
          customResult: 'Task completed successfully',
          completedAt: new Date(),
        };
      },
    };
  }
}
