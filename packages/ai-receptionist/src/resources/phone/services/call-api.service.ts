/**
 * Phone Call API Service
 * Handles HTTP requests for phone call operations
 */

import { HttpClient } from '../../../utils/http';
import { CallOptions, CallSession, CallSummary } from '../../../types';

export class CallApiService {
  constructor(private http: HttpClient) {}

  /**
   * Initiate an outbound phone call
   */
  async initiateCall(params: CallOptions): Promise<CallSession> {
    return this.http.post('/phone/calls', params);
  }

  /**
   * Get call details by ID
   */
  async getCall(callId: string): Promise<CallSession> {
    return this.http.get(`/phone/calls/${callId}`);
  }

  /**
   * List all calls with optional filters
   */
  async listCalls(filters?: {
    status?: string;
    leadId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ calls: CallSession[]; total: number }> {
    return this.http.get('/phone/calls', { params: filters });
  }

  /**
   * Hang up an active call
   */
  async hangup(callId: string): Promise<void> {
    return this.http.post(`/phone/calls/${callId}/hangup`);
  }

  /**
   * Get call summary/transcript
   */
  async getCallSummary(callId: string): Promise<CallSummary> {
    return this.http.get(`/phone/calls/${callId}/summary`);
  }

  /**
   * Get call recording URL
   */
  async getRecording(callId: string): Promise<{ url: string }> {
    return this.http.get(`/phone/calls/${callId}/recording`);
  }
}
