declare module 'adal' {
}

declare class Adal {
  inject(config: AdalConfig): Adal;
  getCachedToken(resource: string): string;
  getCachedUser(): User;
  getLoginError(): string;
  info(message: string): void;
  config: AdalConfig;
  _saveItem(key: string, obj: any);
  login(): void;
  logOut(): void;
  REQUEST_TYPE: AdalRequestType;
  CONSTANTS: AdalConstants;
  isCallback(hash: string): boolean;
  getRequestInfo(hash: string); AdalRequestInfo;
  saveTokenFromHash(requestInfo: AdalRequestInfo): void;
  callback: any;
  _getItem(key: string): any;
  loginInProgress(): boolean;
  acquireToken(resource: string, callback: Function): void;
  getUser(callback: Function): User;
  getResourceForEndpoint(endpoint: string): string;
  clearCache(): void;
  clearCacheForResource(resource: string): void;
  verbose(message: string): void;
}

declare interface AdalConfig {
  instance?: string;
  tenant?: string;
  clientId?: string;
  localLoginUrl?: string;
  loginResource?: string;
  redirectUri?: string;
  postLogoutRedirectUri?: string;
  displayCall?(url: string): void;
  endpoints?: { [id: string]: string; };
}

declare interface User {
  userName: string;
  profile: any;
}

declare interface AdalRequestInfo {
  valid: boolean;
  parameters: any;
  stateMatch: boolean;
  stateResponse: string;
  requestType: string;
}

declare interface AdalRequestType {
  LOGIN: string;
  RENEW_TOKEN: string;
  ID_TOKEN: string;
  UNKNOWN: string;
}

declare interface AdalConstants {
  ACCESS_TOKEN: string;
  EXPIRES_IN: string;
  ID_TOKEN: string;
  ERROR_DESCRIPTION: string;
  SESSION_STATE: string;
  STORAGE: AdalStorageConstants;
  RESOURCE_DELIMETER: string;
  ERR_MESSAGES: AdalErrorMessagesConstants;
  LOGGING_LEVEL: AdalLoggingLevelConstants;
  LEVEL_STRING_MAP: AdalLevelStringMapConstants;
}

declare interface AdalStorageConstants {
  TOKEN_KEYS: string;
  ACCESS_TOKEN_KEY: string;
  EXPIRATION_KEY: string;
  START_PAGE: string;
  FAILED_RENEW: string;
  STATE_LOGIN: string;
  STATE_RENEW: string;
  STATE_RENEW_RESOURCE: string;
  STATE_IDTOKEN: string;
  NONCE_IDTOKEN: string;
  SESSION_STATE: string;
  USERNAME: string;
  IDTOKEN: string;
  ERROR: string;
  ERROR_DESCRIPTION: string;
  LOGIN_REQUEST: string;
  LOGIN_ERROR: string;
}

declare interface AdalErrorMessagesConstants {
  NO_TOKEN: string;
}

declare interface AdalLoggingLevelConstants {
  ERROR: number;
  WARN: number;
  INFO: number;
  VERBOSE: number;
}

declare interface AdalLevelStringMapConstants {
  0: string,
  1: string,
  2: string,
  3: string
}


// TODO: move to separate d.ts file!
interface Window {
  AuthenticationContext: any;
  callBackMappedToRenewStates: any;
}