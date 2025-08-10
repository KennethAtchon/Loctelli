import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { BusinessSearchResultDto } from '../dto/search-business.dto';
import { ExportResultsDto } from '../dto/export-results.dto';
import * as XLSX from 'xlsx';
import * as PDFDocument from 'pdfkit';
import { Response } from 'express';

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  async exportResults(
    results: BusinessSearchResultDto[],
    exportDto: ExportResultsDto,
    response: Response,
  ): Promise<void> {
    const filteredResults = this.filterResults(results, exportDto);
    const filename = exportDto.filename || `business_search_${Date.now()}`;

    switch (exportDto.format) {
      case 'csv':
        return this.exportToCsv(filteredResults, filename, response, exportDto.fields);

      case 'json':
        return this.exportToJson(filteredResults, filename, response, exportDto.fields);

      case 'txt':
        return this.exportToTxt(filteredResults, filename, response, exportDto.fields);

      case 'pdf':
        return this.exportToPdf(filteredResults, filename, response, exportDto.fields);

      default:
        throw new HttpException(
          `Unsupported export format: ${exportDto.format}`,
          HttpStatus.BAD_REQUEST,
        );
    }
  }

  private filterResults(
    results: BusinessSearchResultDto[],
    exportDto: ExportResultsDto,
  ): BusinessSearchResultDto[] {
    if (!exportDto.sources || exportDto.sources.length === 0) {
      return results;
    }

    return results.filter((result) => exportDto.sources!.includes(result.source));
  }

  private exportToCsv(
    results: BusinessSearchResultDto[],
    filename: string,
    response: Response,
    fields?: string[],
  ): void {
    const data = this.transformResultsForExport(results, fields);
    
    if (data.length === 0) {
      throw new HttpException('No data to export', HttpStatus.BAD_REQUEST);
    }

    // Convert to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Business Results');

    // Generate CSV buffer
    const csvBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });

    response.setHeader('Content-Type', 'text/csv');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    response.send(csvBuffer);

    this.logger.log(`Exported ${results.length} results to CSV`);
  }

  private exportToJson(
    results: BusinessSearchResultDto[],
    filename: string,
    response: Response,
    fields?: string[],
  ): void {
    const data = this.transformResultsForExport(results, fields);
    
    const jsonData = {
      exportedAt: new Date().toISOString(),
      totalResults: data.length,
      results: data,
    };

    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    response.send(JSON.stringify(jsonData, null, 2));

    this.logger.log(`Exported ${results.length} results to JSON`);
  }

  private exportToTxt(
    results: BusinessSearchResultDto[],
    filename: string,
    response: Response,
    fields?: string[],
  ): void {
    let txtContent = `Business Search Results\n`;
    txtContent += `Exported: ${new Date().toLocaleString()}\n`;
    txtContent += `Total Results: ${results.length}\n`;
    txtContent += `${'='.repeat(50)}\n\n`;

    results.forEach((result, index) => {
      txtContent += `${index + 1}. ${result.name}\n`;
      
      if (!fields || fields.includes('address')) {
        txtContent += `   Address: ${result.address || 'N/A'}\n`;
      }
      
      if (!fields || fields.includes('phone')) {
        txtContent += `   Phone: ${result.phone || 'N/A'}\n`;
      }
      
      if (!fields || fields.includes('website')) {
        txtContent += `   Website: ${result.website || 'N/A'}\n`;
      }
      
      if (!fields || fields.includes('rating')) {
        txtContent += `   Rating: ${result.rating ? `${result.rating}/5` : 'N/A'}\n`;
      }
      
      if (!fields || fields.includes('categories')) {
        txtContent += `   Categories: ${result.categories?.join(', ') || 'N/A'}\n`;
      }
      
      if (!fields || fields.includes('source')) {
        txtContent += `   Source: ${result.source}\n`;
      }

      txtContent += '\n';
    });

    response.setHeader('Content-Type', 'text/plain');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
    response.send(txtContent);

    this.logger.log(`Exported ${results.length} results to TXT`);
  }

  private exportToPdf(
    results: BusinessSearchResultDto[],
    filename: string,
    response: Response,
    fields?: string[],
  ): void {
    const doc = new PDFDocument({ margin: 50 });
    
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    
    doc.pipe(response);

    // Header
    doc.fontSize(20).text('Business Search Results', { align: 'center' });
    doc.fontSize(12).text(`Exported: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Total Results: ${results.length}`, { align: 'center' });
    doc.moveDown(2);

    // Results
    results.forEach((result, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(14).fillColor('black').text(`${index + 1}. ${result.name}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10);

      if (!fields || fields.includes('address')) {
        doc.text(`Address: ${result.address || 'N/A'}`);
      }
      
      if (!fields || fields.includes('phone')) {
        doc.text(`Phone: ${result.phone || 'N/A'}`);
      }
      
      if (!fields || fields.includes('website')) {
        doc.text(`Website: ${result.website || 'N/A'}`);
      }
      
      if (!fields || fields.includes('rating')) {
        doc.text(`Rating: ${result.rating ? `${result.rating}/5` : 'N/A'}`);
      }
      
      if (!fields || fields.includes('categories')) {
        doc.text(`Categories: ${result.categories?.join(', ') || 'N/A'}`);
      }
      
      if (!fields || fields.includes('source')) {
        doc.text(`Source: ${result.source}`);
      }

      if (result.coordinates && (!fields || fields.includes('coordinates'))) {
        doc.text(`Location: ${result.coordinates.lat}, ${result.coordinates.lng}`);
      }

      doc.moveDown(1);
      
      // Add a line separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
    });

    doc.end();

    this.logger.log(`Exported ${results.length} results to PDF`);
  }

  private transformResultsForExport(
    results: BusinessSearchResultDto[],
    fields?: string[],
  ): any[] {
    return results.map((result) => {
      const transformed: any = {};

      if (!fields || fields.includes('name')) {
        transformed.name = result.name;
      }
      
      if (!fields || fields.includes('address')) {
        transformed.address = result.address || '';
      }
      
      if (!fields || fields.includes('phone')) {
        transformed.phone = result.phone || '';
      }
      
      if (!fields || fields.includes('website')) {
        transformed.website = result.website || '';
      }
      
      if (!fields || fields.includes('rating')) {
        transformed.rating = result.rating || '';
      }
      
      if (!fields || fields.includes('priceLevel')) {
        transformed.priceLevel = result.priceLevel || '';
      }
      
      if (!fields || fields.includes('categories')) {
        transformed.categories = result.categories?.join(', ') || '';
      }
      
      if (!fields || fields.includes('coordinates')) {
        transformed.latitude = result.coordinates?.lat || '';
        transformed.longitude = result.coordinates?.lng || '';
      }
      
      if (!fields || fields.includes('source')) {
        transformed.source = result.source;
      }
      
      if (!fields || fields.includes('reviews')) {
        transformed.reviewCount = result.reviews?.count || '';
        transformed.averageRating = result.reviews?.averageRating || '';
      }

      // Business hours as a single field
      if (!fields || fields.includes('businessHours')) {
        if (result.businessHours) {
          const hoursText = Object.entries(result.businessHours)
            .map(([day, hours]) => `${day}: ${hours}`)
            .join('; ');
          transformed.businessHours = hoursText;
        } else {
          transformed.businessHours = '';
        }
      }

      return transformed;
    });
  }

  getAvailableFields(): string[] {
    return [
      'name',
      'address',
      'phone',
      'website',
      'rating',
      'priceLevel',
      'categories',
      'coordinates',
      'source',
      'reviews',
      'businessHours',
    ];
  }
}