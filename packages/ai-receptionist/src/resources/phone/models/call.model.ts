/**
 * Call Model
 * Represents a phone call session with helper methods
 */

import { CallSession, CallSummary } from '../../../types';

export class Call {
  public readonly id: string;
  public readonly channel: 'phone' | 'video';
  public phoneNumber?: string;
  public status: 'pending' | 'ringing' | 'active' | 'ended' | 'missed';
  public direction: 'inbound' | 'outbound';
  public startedAt?: Date;
  public endedAt?: Date;

  constructor(data: CallSession) {
    this.id = data.id;
    this.channel = data.channel;
    this.phoneNumber = data.phoneNumber;
    this.status = data.status;
    this.direction = data.direction;
    this.startedAt = data.startedAt;
    this.endedAt = data.endedAt;
  }

  /**
   * Check if call is currently active
   */
  isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Check if call is ringing
   */
  isRinging(): boolean {
    return this.status === 'ringing';
  }

  /**
   * Check if call has ended
   */
  hasEnded(): boolean {
    return this.status === 'ended' || this.status === 'missed';
  }

  /**
   * Get call duration in seconds
   */
  getDuration(): number | null {
    if (!this.startedAt || !this.endedAt) {
      return null;
    }
    return Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
  }

  /**
   * Convert to plain object
   */
  toJSON(): CallSession {
    return {
      id: this.id,
      channel: this.channel,
      phoneNumber: this.phoneNumber,
      status: this.status,
      direction: this.direction,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
    };
  }
}
