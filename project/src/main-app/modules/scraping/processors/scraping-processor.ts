import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

interface ScrapingJobData {
  jobId: number;
  targetUrl: string;
  maxPages: number;
  maxDepth: number;
  selectors: Record<string, string>;
  filters?: any;
  userAgent?: string;
  delayMin: number;
  delayMax: number;
  timeout: number;
}

@Processor('scraping')
export class ScrapingProcessor {
  private readonly logger = new Logger(ScrapingProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('scrape-website')
  async handleScrapingJob(job: Job<ScrapingJobData>) {
    const { jobId, targetUrl, maxPages, selectors, delayMin, delayMax, timeout, userAgent } = job.data;
    
    this.logger.log(`🚀 Starting scraping job ${jobId} for URL: ${targetUrl}`);

    let browser: puppeteer.Browser | null = null;
    const scrapedData: any[] = [];
    let processedPages = 0;
    
    try {
      // Update job status to running
      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'RUNNING',
          startedAt: new Date(),
          processedPages: 0,
          extractedItems: 0,
        },
      });

      // Launch browser with optimized settings for scraping
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();
      
      // Set user agent if provided
      if (userAgent) {
        await page.setUserAgent(userAgent);
      }

      // Set viewport and timeout
      await page.setViewport({ width: 1280, height: 720 });
      page.setDefaultTimeout(timeout);

      // Navigate to target URL
      this.logger.log(`📄 Navigating to: ${targetUrl}`);
      await page.goto(targetUrl, { 
        waitUntil: 'networkidle2',
        timeout 
      });

      // Extract data from the current page
      const pageData = await this.extractDataFromPage(page, selectors, targetUrl);
      
      if (pageData && Object.keys(pageData).length > 0) {
        scrapedData.push(pageData);
        processedPages = 1;

        this.logger.log(`✅ Extracted data from page 1: ${JSON.stringify(pageData)}`);

        // Update progress
        await this.updateJobProgress(jobId, 1, scrapedData.length, scrapedData);
      }

      // For MVP, we'll just scrape the single page
      // TODO: Implement multi-page scraping with pagination detection
      
      // Add random delay between requests (if we were doing multiple pages)
      if (delayMin > 0) {
        const delay = Math.random() * (delayMax - delayMin) + delayMin;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      await browser.close();
      browser = null;

      // Mark job as completed
      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalPages: processedPages,
          processedPages,
          extractedItems: scrapedData.length,
          results: scrapedData,
        },
      });

      this.logger.log(`🎉 Scraping job ${jobId} completed successfully. Extracted ${scrapedData.length} items.`);

    } catch (error) {
      this.logger.error(`❌ Scraping job ${jobId} failed: ${error.message}`, error.stack);

      // Close browser if still open
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          this.logger.error(`Failed to close browser: ${closeError.message}`);
        }
      }

      // Mark job as failed
      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errors: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          },
          totalPages: processedPages,
          processedPages,
          extractedItems: scrapedData.length,
          results: scrapedData.length > 0 ? scrapedData : undefined,
        },
      });

      throw error;
    }
  }

  private async extractDataFromPage(
    page: puppeteer.Page, 
    selectors: Record<string, string>,
    url: string
  ): Promise<any> {
    try {
      const html = await page.content();
      const $ = cheerio.load(html);
      
      const extractedData: any = {
        url,
        scrapedAt: new Date().toISOString(),
      };

      // Extract data using provided selectors
      for (const [fieldName, selector] of Object.entries(selectors)) {
        try {
          const elements = $(selector);
          
          if (elements.length === 0) {
            this.logger.warn(`No elements found for selector "${selector}" (field: ${fieldName})`);
            extractedData[fieldName] = null;
            continue;
          }

          // If multiple elements, collect all values
          if (elements.length === 1) {
            extractedData[fieldName] = $(elements[0]).text().trim();
          } else {
            extractedData[fieldName] = elements.map((i, el) => $(el).text().trim()).get();
          }

        } catch (selectorError) {
          this.logger.error(`Error extracting field "${fieldName}" with selector "${selector}": ${selectorError.message}`);
          extractedData[fieldName] = null;
        }
      }

      return extractedData;

    } catch (error) {
      this.logger.error(`Error extracting data from page: ${error.message}`);
      throw error;
    }
  }

  private async updateJobProgress(
    jobId: number, 
    processedPages: number, 
    extractedItems: number, 
    results: any[]
  ) {
    try {
      await this.prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          processedPages,
          extractedItems,
          results,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`📊 Updated job ${jobId} progress: ${processedPages} pages, ${extractedItems} items`);
    } catch (error) {
      this.logger.error(`Failed to update job progress: ${error.message}`);
    }
  }
}