/**
 * Base resource class for all API resources
 */

import { HttpClient } from '../utils/http';

export abstract class BaseResource {
  protected http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }
}
