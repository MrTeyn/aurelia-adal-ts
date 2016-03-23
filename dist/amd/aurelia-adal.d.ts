declare module 'aurelia-adal' {
  import { FrameworkConfiguration } from 'aurelia-framework';
  import { NavigationInstruction } from 'aurelia-router';
  import { HttpClient } from 'aurelia-fetch-client';
  export interface AureliaAdalConfig {
      tenant?: string;
      clientId?: string;
      endpoints?: {
          [id: string]: string;
      };
  }
  export class AureliaAdalManager {
      private adalConstructor;
      private adal;
      private oauthData;
      constructor(adalConstructor: Adal);
      configure(config: AureliaAdalConfig): void;
      updateDataFromCache(resource: string): void;
      hashHandler(hash: string, redirectHandler: Function, isNotCallbackHandler: Function, nextHandler: Function): void;
      loginHandler(path: string, redirectHandler: Function, handler: Function): any;
      config(): AdalConfig;
      login(): void;
      loginInProgress(): boolean;
      logOut(): void;
      getCachedToken(resource: string): string;
      getUserInfo(): any;
      acquireToken(resource: string): Promise<string>;
      getUser(): Promise<User>;
      getResourceForEndpoint(endpoint: string): string;
      clearCache(): void;
      clearCacheForResource(resource: string): void;
      info(message: string): void;
      verbose(message: string): void;
      isAuthenticated(): boolean;
  }
  export class AureliaAdalAuthorizeStep {
      private aureliaAdal;
      constructor(aureliaAdal: AureliaAdalManager);
      run(routingContext: NavigationInstruction, next: any): void;
  }
  export class AureliaAdalFetchConfig {
      private httpClient;
      private aureliaAdal;
      constructor(httpClient: HttpClient, aureliaAdal: AureliaAdalManager);
      configure(): void;
  }
  export function configure(frameworkConfig: FrameworkConfiguration, config: AureliaAdalConfig): void;
}