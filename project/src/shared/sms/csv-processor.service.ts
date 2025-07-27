import { Injectable, Logger } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { SmsService } from './sms.service';

export interface CsvProcessingResult {
  totalRows: number;
  validNumbers: string[];
  invalidNumbers: string[];
  duplicates: string[];
  errors: string[];
}

export interface CsvRow {
  phoneNumber?: string;
  phone?: string;
  number?: string;
  [key: string]: any;
}

@Injectable()
export class CsvProcessorService {
  private readonly logger = new Logger(CsvProcessorService.name);

  constructor(private readonly smsService: SmsService) {}

  /**
   * Process CSV file and extract phone numbers
   */
  async processCsvFile(fileBuffer: Buffer): Promise<CsvProcessingResult> {
    return new Promise((resolve, reject) => {
      const results: CsvProcessingResult = {
        totalRows: 0,
        validNumbers: [],
        invalidNumbers: [],
        duplicates: [],
        errors: [],
      };

      const phoneNumbers = new Set<string>();
      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('data', (row: CsvRow) => {
          results.totalRows++;
          
          try {
            const phoneNumber = this.extractPhoneNumber(row);
            
            if (!phoneNumber) {
              results.errors.push(`Row ${results.totalRows}: No phone number found`);
              return;
            }

            // Validate phone number
            const validation = this.smsService.validatePhoneNumber(phoneNumber);
            
            if (!validation.isValid) {
              results.invalidNumbers.push(phoneNumber);
              results.errors.push(`Row ${results.totalRows}: ${validation.error}`);
              return;
            }

            // Check for duplicates
            if (validation.formattedNumber && phoneNumbers.has(validation.formattedNumber)) {
              results.duplicates.push(validation.formattedNumber);
              return;
            }

            if (validation.formattedNumber) {
              phoneNumbers.add(validation.formattedNumber);
              results.validNumbers.push(validation.formattedNumber);
            }

          } catch (error) {
            results.errors.push(`Row ${results.totalRows}: ${error.message}`);
          }
        })
        .on('end', () => {
          this.logger.log(`CSV processing completed. Valid: ${results.validNumbers.length}, Invalid: ${results.invalidNumbers.length}, Duplicates: ${results.duplicates.length}`);
          resolve(results);
        })
        .on('error', (error) => {
          this.logger.error('CSV processing failed:', error);
          reject(error);
        });
    });
  }

  /**
   * Extract phone number from CSV row
   */
  private extractPhoneNumber(row: CsvRow): string | null {
    // Try common column names for phone numbers
    const phoneFields = ['phoneNumber', 'phone', 'number', 'mobile', 'cell', 'telephone', 'tel'];
    
    for (const field of phoneFields) {
      if (row[field] && typeof row[field] === 'string') {
        return row[field].trim();
      }
    }

    // Try case-insensitive search
    const keys = Object.keys(row);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (phoneFields.some(field => lowerKey.includes(field))) {
        if (row[key] && typeof row[key] === 'string') {
          return row[key].trim();
        }
      }
    }

    return null;
  }

  /**
   * Validate CSV format and structure
   */
  async validateCsvStructure(fileBuffer: Buffer): Promise<{
    isValid: boolean;
    hasPhoneColumn: boolean;
    columnNames: string[];
    sampleRows: any[];
    error?: string;
  }> {
    return new Promise((resolve) => {
      const columnNames: string[] = [];
      const sampleRows: any[] = [];
      let hasPhoneColumn = false;
      let rowCount = 0;

      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('headers', (headers: string[]) => {
          columnNames.push(...headers);
          
          // Check if any column might contain phone numbers
          const phoneFields = ['phoneNumber', 'phone', 'number', 'mobile', 'cell', 'telephone', 'tel'];
          hasPhoneColumn = headers.some(header => 
            phoneFields.some(field => 
              header.toLowerCase().includes(field.toLowerCase())
            )
          );
        })
        .on('data', (row: any) => {
          rowCount++;
          if (sampleRows.length < 5) {
            sampleRows.push(row);
          }
        })
        .on('end', () => {
          resolve({
            isValid: rowCount > 0 && columnNames.length > 0,
            hasPhoneColumn,
            columnNames,
            sampleRows,
          });
        })
        .on('error', (error) => {
          resolve({
            isValid: false,
            hasPhoneColumn: false,
            columnNames: [],
            sampleRows: [],
            error: error.message,
          });
        });
    });
  }

  /**
   * Create batches from phone numbers for processing
   */
  createBatches(phoneNumbers: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      batches.push(phoneNumbers.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Remove duplicates from phone number array
   */
  removeDuplicates(phoneNumbers: string[]): {
    unique: string[];
    duplicates: string[];
  } {
    const seen = new Set<string>();
    const unique: string[] = [];
    const duplicates: string[] = [];

    for (const number of phoneNumbers) {
      const validation = this.smsService.validatePhoneNumber(number);
      if (validation.isValid && validation.formattedNumber) {
        const formatted = validation.formattedNumber;
        if (seen.has(formatted)) {
          duplicates.push(number);
        } else {
          seen.add(formatted);
          unique.push(formatted);
        }
      }
    }

    return { unique, duplicates };
  }
}