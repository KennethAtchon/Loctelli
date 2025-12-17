import { Injectable, Logger } from '@nestjs/common';

/**
 * Service for detecting timezone based on location data (postal code, city, state, country)
 * Uses US postal code/state mapping and city/country fallbacks
 */
@Injectable()
export class TimezoneDetectorService {
  private readonly logger = new Logger(TimezoneDetectorService.name);

  // US State to primary timezone mapping (IANA timezone identifiers)
  private readonly stateTimezones: Record<string, string> = {
    // Eastern Time
    CT: 'America/New_York',
    DE: 'America/New_York',
    FL: 'America/New_York',
    GA: 'America/New_York',
    ME: 'America/New_York',
    MD: 'America/New_York',
    MA: 'America/New_York',
    NH: 'America/New_York',
    NJ: 'America/New_York',
    NY: 'America/New_York',
    NC: 'America/New_York',
    OH: 'America/New_York',
    PA: 'America/New_York',
    RI: 'America/New_York',
    SC: 'America/New_York',
    VT: 'America/New_York',
    VA: 'America/New_York',
    WV: 'America/New_York',
    DC: 'America/New_York',

    // Central Time
    AL: 'America/Chicago',
    AR: 'America/Chicago',
    IL: 'America/Chicago',
    IA: 'America/Chicago',
    KS: 'America/Chicago',
    KY: 'America/Chicago',
    LA: 'America/Chicago',
    MN: 'America/Chicago',
    MS: 'America/Chicago',
    MO: 'America/Chicago',
    NE: 'America/Chicago',
    ND: 'America/Chicago',
    OK: 'America/Chicago',
    SD: 'America/Chicago',
    TN: 'America/Chicago',
    TX: 'America/Chicago',
    WI: 'America/Chicago',

    // Mountain Time
    AZ: 'America/Phoenix',
    CO: 'America/Denver',
    ID: 'America/Denver',
    MT: 'America/Denver',
    NM: 'America/Denver',
    UT: 'America/Denver',
    WY: 'America/Denver',

    // Pacific Time
    CA: 'America/Los_Angeles',
    NV: 'America/Los_Angeles',
    OR: 'America/Los_Angeles',
    WA: 'America/Los_Angeles',

    // Alaska Time
    AK: 'America/Anchorage',

    // Hawaii Time
    HI: 'Pacific/Honolulu',
  };

  // US Postal code ranges to timezone mapping (first 3 digits)
  private readonly postalCodeRanges: Record<string, string> = {
    // Eastern Time (ranges 006-199, 220-268, 270-329, 369-397, 400-549)
    '006': 'America/New_York',
    '007': 'America/New_York',
    '008': 'America/New_York',
    '009': 'America/New_York',
    '010': 'America/New_York',
    '011': 'America/New_York',
    '012': 'America/New_York',
    '013': 'America/New_York',
    '014': 'America/New_York',

    // Central Time (ranges 350-368, 500-567, 600-658, 700-729, 730-799, 850-885)
    '350': 'America/Chicago',
    '351': 'America/Chicago',
    '352': 'America/Chicago',

    // Mountain Time (ranges 569-599, 800-847, 820-831, 832-838, 870-884, 889-891)
    '800': 'America/Denver',
    '801': 'America/Denver',
    '802': 'America/Denver',

    // Pacific Time (ranges 900-961)
    '900': 'America/Los_Angeles',
    '901': 'America/Los_Angeles',

    // Alaska (ranges 995-999)
    '995': 'America/Anchorage',
    '996': 'America/Anchorage',

    // Hawaii (ranges 967-968)
    '967': 'Pacific/Honolulu',
    '968': 'Pacific/Honolulu',
  };

  // Country to default timezone mapping
  private readonly countryTimezones: Record<string, string> = {
    US: 'America/New_York', // Default to Eastern for US
    CA: 'America/Toronto', // Canada
    MX: 'America/Mexico_City', // Mexico
    GB: 'Europe/London', // United Kingdom
    DE: 'Europe/Berlin', // Germany
    FR: 'Europe/Paris', // France
    ES: 'Europe/Madrid', // Spain
    IT: 'Europe/Rome', // Italy
    AU: 'Australia/Sydney', // Australia
    NZ: 'Pacific/Auckland', // New Zealand
    JP: 'Asia/Tokyo', // Japan
    CN: 'Asia/Shanghai', // China
    IN: 'Asia/Kolkata', // India
    BR: 'America/Sao_Paulo', // Brazil
  };

  /**
   * Detect timezone from location data
   * Priority: postalCode > state > city > country > default
   */
  detectTimezone(params: {
    postalCode?: string;
    state?: string;
    city?: string;
    country?: string;
  }): string | null {
    const { postalCode, state, city, country } = params;

    this.logger.debug(
      `Detecting timezone for: postalCode=${postalCode}, state=${state}, city=${city}, country=${country}`,
    );

    // Try postal code first (most accurate for US)
    if (postalCode) {
      const timezone = this.getTimezoneFromPostalCode(postalCode);
      if (timezone) {
        this.logger.log(
          `Detected timezone ${timezone} from postal code ${postalCode}`,
        );
        return timezone;
      }
    }

    // Try state (works well for US)
    if (state) {
      const timezone = this.getTimezoneFromState(state);
      if (timezone) {
        this.logger.log(`Detected timezone ${timezone} from state ${state}`);
        return timezone;
      }
    }

    // Try country as fallback
    if (country) {
      const timezone = this.getTimezoneFromCountry(country);
      if (timezone) {
        this.logger.log(
          `Detected timezone ${timezone} from country ${country}`,
        );
        return timezone;
      }
    }

    this.logger.warn(`Could not detect timezone from provided location data`);
    return null;
  }

  /**
   * Get timezone from US postal code
   */
  private getTimezoneFromPostalCode(postalCode: string): string | null {
    // Extract first 3 digits
    const prefix = postalCode.substring(0, 3);

    // Direct lookup
    if (this.postalCodeRanges[prefix]) {
      return this.postalCodeRanges[prefix];
    }

    // Range-based lookup for common patterns
    const prefixNum = parseInt(prefix, 10);

    if (prefixNum >= 6 && prefixNum <= 199) return 'America/New_York';
    if (prefixNum >= 220 && prefixNum <= 268) return 'America/New_York';
    if (prefixNum >= 270 && prefixNum <= 329) return 'America/New_York';
    if (prefixNum >= 369 && prefixNum <= 397) return 'America/New_York';
    if (prefixNum >= 400 && prefixNum <= 549) return 'America/New_York';

    if (prefixNum >= 350 && prefixNum <= 368) return 'America/Chicago';
    if (prefixNum >= 500 && prefixNum <= 567) return 'America/Chicago';
    if (prefixNum >= 600 && prefixNum <= 658) return 'America/Chicago';
    if (prefixNum >= 700 && prefixNum <= 799) return 'America/Chicago';
    if (prefixNum >= 850 && prefixNum <= 885) return 'America/Chicago';

    if (prefixNum >= 569 && prefixNum <= 599) return 'America/Denver';
    if (prefixNum >= 800 && prefixNum <= 847) return 'America/Denver';
    if (prefixNum >= 870 && prefixNum <= 884) return 'America/Denver';
    if (prefixNum >= 889 && prefixNum <= 891) return 'America/Denver';

    if (prefixNum >= 850 && prefixNum <= 853) return 'America/Phoenix'; // Arizona

    if (prefixNum >= 900 && prefixNum <= 961) return 'America/Los_Angeles';

    if (prefixNum >= 995 && prefixNum <= 999) return 'America/Anchorage';

    if (prefixNum >= 967 && prefixNum <= 968) return 'Pacific/Honolulu';

    return null;
  }

  /**
   * Get timezone from US state code
   */
  private getTimezoneFromState(state: string): string | null {
    const stateUpper = state.toUpperCase();
    return this.stateTimezones[stateUpper] || null;
  }

  /**
   * Get timezone from country code
   */
  private getTimezoneFromCountry(country: string): string | null {
    const countryUpper = country.toUpperCase();
    return this.countryTimezones[countryUpper] || null;
  }

  /**
   * Validate if a timezone is a valid IANA timezone identifier
   */
  isValidTimezone(timezone: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }
}
