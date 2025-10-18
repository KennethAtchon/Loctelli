/**
 * HTTP client utilities for API communication
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import {
  AIReceptionistError,
  AuthenticationError,
  ValidationError,
  RateLimitError,
  NetworkError,
} from '../errors';

export interface HttpClientConfig {
  baseURL: string;
  apiKey: string;
  timeout?: number;
  debug?: boolean;
}

export class HttpClient {
  private client: AxiosInstance;
  private debug: boolean;

  constructor(config: HttpClientConfig) {
    this.debug = config.debug || false;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((request) => {
      if (this.debug) {
        console.log('[HTTP Request]', request.method?.toUpperCase(), request.url);
      }
      return request;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        if (this.debug) {
          console.log('[HTTP Response]', response.status, response.config.url);
        }
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): AIReceptionistError {
    if (error.response) {
      const { status, data } = error.response;
      const message = (data as any)?.message || error.message;

      switch (status) {
        case 401:
        case 403:
          return new AuthenticationError(message, data);
        case 400:
          return new ValidationError(message, data);
        case 429:
          return new RateLimitError(message, data);
        default:
          return new AIReceptionistError(message, 'API_ERROR', status, data);
      }
    } else if (error.request) {
      return new NetworkError('No response received from server', error);
    } else {
      return new NetworkError(error.message, error);
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}
