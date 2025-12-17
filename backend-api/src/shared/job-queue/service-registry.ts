/**
 * Service Registry for Generic Task Processor
 *
 * This registry allows services to register callable methods that can be executed
 * by the GenericTaskProcessor without needing direct dependency injection.
 */

export type ServiceMethod = (...args: any[]) => Promise<any> | any;

export interface RegisteredService {
  instance: any;
  methods: Map<string, ServiceMethod>;
}

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services = new Map<string, RegisteredService>();

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service with its callable methods
   */
  registerService(
    serviceName: string,
    serviceInstance: any,
    methods: string[] = [],
  ): void {
    const registeredService: RegisteredService = {
      instance: serviceInstance,
      methods: new Map(),
    };

    // If methods are specified, register only those methods
    if (methods.length > 0) {
      methods.forEach((methodName) => {
        if (typeof serviceInstance[methodName] === 'function') {
          registeredService.methods.set(
            methodName,
            serviceInstance[methodName].bind(serviceInstance),
          );
        } else {
          console.warn(
            `Method ${methodName} not found on service ${serviceName}`,
          );
        }
      });
    } else {
      // Auto-register all public methods
      const proto = Object.getPrototypeOf(serviceInstance);
      const methodNames = Object.getOwnPropertyNames(proto).filter(
        (name) =>
          name !== 'constructor' && typeof serviceInstance[name] === 'function',
      );

      methodNames.forEach((methodName) => {
        registeredService.methods.set(
          methodName,
          serviceInstance[methodName].bind(serviceInstance),
        );
      });
    }

    this.services.set(serviceName, registeredService);
    console.log(
      `✅ Registered service: ${serviceName} with methods: ${Array.from(registeredService.methods.keys()).join(', ')}`,
    );
  }

  /**
   * Get a registered service method
   */
  getServiceMethod(
    serviceName: string,
    methodName: string,
  ): ServiceMethod | undefined {
    const service = this.services.get(serviceName);
    if (!service) {
      return undefined;
    }
    return service.methods.get(methodName);
  }

  /**
   * Check if a service is registered
   */
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * Get all registered services (for debugging)
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get all methods for a service (for debugging)
   */
  getServiceMethods(serviceName: string): string[] {
    const service = this.services.get(serviceName);
    return service ? Array.from(service.methods.keys()) : [];
  }
}
