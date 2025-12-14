import { Injectable } from '@nestjs/common';
import { BaseProcessor } from './base-processor';
import { DataExportJobData } from '../interfaces/job-data.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataExportProcessor extends BaseProcessor {
  constructor(private prismaService: PrismaService) {
    super();
  }

  async process(data: DataExportJobData): Promise<any> {
    this.logStart('Data Export', data);

    try {
      let exportData: any[];
      let filename: string;

      switch (data.exportType) {
        case 'leads':
          exportData = await this.exportLeads(data);
          filename = `leads_export_${Date.now()}.${data.format}`;
          break;
        case 'bookings':
          exportData = await this.exportBookings(data);
          filename = `bookings_export_${Date.now()}.${data.format}`;
          break;
        case 'users':
          exportData = await this.exportUsers(data);
          filename = `users_export_${Date.now()}.${data.format}`;
          break;
        default:
          throw new Error(`Unsupported export type: ${data.exportType}`);
      }

      // Format the data based on the requested format
      const formattedData = await this.formatData(exportData, data.format);

      const result = {
        exportType: data.exportType,
        format: data.format,
        filename,
        recordCount: exportData.length,
        data: formattedData,
        generatedAt: new Date(),
      };

      this.logSuccess('Data Export', result);
      return result;
    } catch (error) {
      this.logError('Data Export', error);
      throw error;
    }
  }

  private async exportLeads(data: DataExportJobData): Promise<any[]> {
    const where: any = { subAccountId: data.subAccountId };

    if (data.filters) {
      Object.assign(where, data.filters);
    }

    return await this.prismaService.lead.findMany({
      where,
      select: this.buildSelectClause(data.columns, {
        id: true,
        name: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }),
    });
  }

  private async exportBookings(data: DataExportJobData): Promise<any[]> {
    const where: any = { subAccountId: data.subAccountId };

    if (data.filters) {
      Object.assign(where, data.filters);
    }

    return await this.prismaService.booking.findMany({
      where,
      select: this.buildSelectClause(data.columns, {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }),
    });
  }

  private async exportUsers(data: DataExportJobData): Promise<any[]> {
    const where: any = { subAccountId: data.subAccountId };

    if (data.filters) {
      Object.assign(where, data.filters);
    }

    return await this.prismaService.user.findMany({
      where,
      select: this.buildSelectClause(data.columns, {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      }),
    });
  }

  private buildSelectClause(
    requestedColumns?: string[],
    defaultSelect?: Record<string, boolean>,
  ): Record<string, boolean> {
    if (!requestedColumns || requestedColumns.length === 0) {
      return defaultSelect || { id: true };
    }

    const select: Record<string, boolean> = {};
    requestedColumns.forEach((column) => {
      select[column] = true;
    });

    return select;
  }

  private async formatData(data: any[], format: string): Promise<any> {
    switch (format) {
      case 'csv':
        return this.formatAsCsv(data);
      case 'excel':
        return this.formatAsExcel(data);
      case 'pdf':
        return this.formatAsPdf(data);
      default:
        return data;
    }
  }

  private formatAsCsv(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (
          typeof value === 'string' &&
          (value.includes(',') || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return String(value);
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  private formatAsExcel(data: any[]): any {
    // TODO: Implement Excel formatting using xlsx library
    return { format: 'excel', data };
  }

  private formatAsPdf(data: any[]): any {
    // TODO: Implement PDF formatting using pdfkit library
    return { format: 'pdf', data };
  }
}
