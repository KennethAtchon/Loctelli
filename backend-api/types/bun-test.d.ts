// Type definitions for Bun test framework
declare module "bun:test" {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect<T>(actual: T): {
    toBe(expected: T): void;
    toEqual(expected: T): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeDefined(): void;
    toBeInstanceOf(constructor: new (...args: any[]) => any): void;
    toMatch(regexp: RegExp | string): void;
    toContain(item: any): void;
    toHaveProperty(key: string | number | symbol, value?: any): void;
    toHaveLength(length: number): void;
    toBeGreaterThan(value: number): void;
    toBeLessThan(value: number): void;
    toBeGreaterThanOrEqual(value: number): void;
    toBeLessThanOrEqual(value: number): void;
    toThrow(error?: string | RegExp | Error | (() => boolean)): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledTimes(times: number): void;
    toHaveBeenCalledWith(...args: any[]): void;
    rejects: {
      toThrow(error?: string | RegExp | Error | (() => boolean)): Promise<void>;
      toBe(expected: any): Promise<void>;
    };
    not: {
      toBe(expected: T): void;
      toEqual(expected: T): void;
      toBeTruthy(): void;
      toBeFalsy(): void;
      toBeNull(): void;
      toBeUndefined(): void;
      toBeDefined(): void;
      toBeInstanceOf(constructor: new (...args: any[]) => any): void;
      toMatch(regexp: RegExp | string): void;
      toContain(item: any): void;
      toHaveProperty(key: string | number | symbol, value?: any): void;
      toHaveLength(length: number): void;
      toBeGreaterThan(value: number): void;
      toBeLessThan(value: number): void;
      toBeGreaterThanOrEqual(value: number): void;
      toBeLessThanOrEqual(value: number): void;
      toThrow(error?: string | RegExp | Error | (() => boolean)): void;
      toHaveBeenCalled(): void;
      toHaveBeenCalledTimes(times: number): void;
      toHaveBeenCalledWith(...args: any[]): void;
    };
  };
  export function beforeAll(fn: () => void | Promise<void>): void;
  export function afterAll(fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function mock(fn?: (...args: any[]) => any): any;
}
