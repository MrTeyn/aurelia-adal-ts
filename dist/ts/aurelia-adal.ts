import * as Adal from 'adal';
import {inject,FrameworkConfiguration} from 'aurelia-framework';
import {NavigationInstruction,Redirect} from 'aurelia-router';
import {HttpClient,HttpClientConfiguration} from 'aurelia-fetch-client';

export interface AureliaAdalConfig {
    tenant?: string;
    clientId?: string;
    endpoints?: { [id: string]: string; };
}
@inject(Adal)
export class AureliaAdalManager {

  private adal: Adal;
  private oauthData = {
    isAuthenticated: false,
    userName: '',
    loginError: '',
    profile: null
  }

  constructor(private adalConstructor: Adal) {
    
  }
  
  configure(config: AureliaAdalConfig) {
    try {
      let configOptions: AdalConfig = {};
      
      configOptions.tenant = config.tenant;
      configOptions.clientId = config.clientId;
      configOptions.endpoints = config.endpoints;

      // redirect and logout_redirect are set to current location by default
      let existingHash = window.location.hash;
      let pathDefault = window.location.href;
      if (existingHash) {
        pathDefault = pathDefault.replace(existingHash, '');
      }

      configOptions.redirectUri = configOptions.redirectUri || pathDefault;
      configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;

      this.adal = this.adalConstructor.inject(configOptions);
      
      window.AuthenticationContext = () => {
        return this.adal;
      }
      
      this.updateDataFromCache(this.adal.config.loginResource);
    }
    catch (e) {
      console.log(e);
    }
  }

  updateDataFromCache(resource: string): void {
    var token = this.adal.getCachedToken(resource);
    this.oauthData.isAuthenticated = token !== null && token.length > 0;
    var user = this.adal.getCachedUser() || { userName: '', profile: null };
    this.oauthData.userName = user.userName;
    this.oauthData.profile = user.profile;
    this.oauthData.loginError = this.adal.getLoginError();
  }

  hashHandler(hash: string, redirectHandler: Function, isNotCallbackHandler: Function, nextHandler: Function): void {
    if (this.adal.isCallback(hash)) {
      let requestInfo = this.adal.getRequestInfo(hash);
      
      this.adal.saveTokenFromHash(requestInfo);

      if (requestInfo.requestType !== this.adal.REQUEST_TYPE.LOGIN) {
        this.adal.callback = window.parent.AuthenticationContext().callback;
        if (requestInfo.requestType === this.adal.REQUEST_TYPE.RENEW_TOKEN) {
          this.adal.callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
        }
      }

      // Return to callback if it is sent from iframe
      if (requestInfo.stateMatch) {
        if (typeof this.adal.callback === 'function') {
          // Call within the same context without full page redirect keeps the callback
          if (requestInfo.requestType === this.adal.REQUEST_TYPE.RENEW_TOKEN) {
            // Idtoken or Accestoken can be renewed
            if (requestInfo.parameters['access_token']) {
              this.adal.callback(this.adal._getItem(this.adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters['access_token']);
              return nextHandler();
            } else if (requestInfo.parameters['id_token']) {
              this.adal.callback(this.adal._getItem(this.adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters['id_token']);
              return nextHandler();
            }
          }
        } else {
          // normal full login redirect happened on the page
          this.updateDataFromCache(this.adal.config.loginResource);
          if (this.oauthData.userName) {
            //IDtoken is added as token for the app
            let self = this;

            self.updateDataFromCache(self.adal.config.loginResource);
            // redirect to login requested page
            var loginStartPage = self.adal._getItem(self.adal.CONSTANTS.STORAGE.START_PAGE);
            if (loginStartPage) {
              return redirectHandler(loginStartPage);
            }
            // TODO: broadcast login success?
          } else {
            // TODO: broadcast login failure? (reason: this.adal._getItem(this.adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION))
          }
        }
      }
    } else {
      return isNotCallbackHandler();
    }
  }

  loginHandler(path: string, redirectHandler: Function, handler: Function) {
    this.adal.info('Login event for:' + path);

    if (this.adal.config && this.adal.config.localLoginUrl) {
      return redirectHandler(this.adal.config.localLoginUrl);
    } else {
      // directly start login flow
      this.adal._saveItem(this.adal.CONSTANTS.STORAGE.START_PAGE, path);
      this.adal.info('Start login at:' + window.location.href);
      // TODO: broadcast login redirect?
      this.adal.login();
      return handler();
    }
  }

  config(): AdalConfig {
    return this.adal.config;
  }

  login() {
    this.adal.login();
  }

  loginInProgress(): boolean {
    return this.adal.loginInProgress();
  }

  logOut() {
    this.adal.logOut();
  }

  getCachedToken(resource: string): string {
    return this.adal.getCachedToken(resource);
  }

  getUserInfo(): any {
    return this.oauthData;
  }

  acquireToken(resource: string): Promise<string> {
    // automated token request call
    return new Promise<string>((resolve, reject) => {
      this.adal.acquireToken(resource, (error: string, tokenOut: string) => {
        if (error) {
          reject(error);
        } else {
          resolve(tokenOut);
        }
      });
    });
  }

  async getUser(): Promise<User> {
    return await new Promise<User>((resolve, reject) => {
      this.adal.getUser((error: string, user: User) => {
        if (error) {
          reject(error);
        } else {
          resolve(user);
        }
      });
    });
  }

  getResourceForEndpoint(endpoint: string): string {
    return this.adal.getResourceForEndpoint(endpoint);
  }

  clearCache() {
    this.adal.clearCache();
  }

  clearCacheForResource(resource: string) {
    this.adal.clearCacheForResource(resource);
  }

  info(message: string) {
    this.adal.info(message);
  }

  verbose(message: string) {
    this.adal.verbose(message);
  }


  isAuthenticated() {
    return this.oauthData.isAuthenticated;
  }
}
@inject(AureliaAdalManager)
export class AureliaAdalAuthorizeStep {
  
  constructor(private aureliaAdal: AureliaAdalManager) {
    
  }

  run(routingContext: NavigationInstruction, next: any): void {
    let hash = window.location.hash;

    return this.aureliaAdal.hashHandler(hash, (url: string) => {
      // Was callback
      return next.cancel(new Redirect(url));
    }, () => {
      // Was not callback
      let loginRoute = ''; // TODO: get login url from aureliaAdal

      if (routingContext.getAllInstructions().some(i => !!i.config.settings.requireAdalLogin)) {
        if (!this.aureliaAdal.isAuthenticated()) {
          // Not logged in, redirect to login route
          return this.aureliaAdal.loginHandler(routingContext.fragment, (url: string) => {
            return next.cancel(new Redirect(url));
          }, () => {
            return next.cancel('login redirect');
          });
        }
      } else if (this.aureliaAdal.isAuthenticated() && routingContext.getAllInstructions().some(i => i.fragment == loginRoute)) {
        // Logged in, current route is the login route
        let loginRedirect = '';
        return next.cancel(new Redirect(loginRedirect));
      }

      return next();
      }, () => {
        return next();
      });
  }
}
@inject(HttpClient, AureliaAdalManager)
export class AureliaAdalFetchConfig {
  constructor(private httpClient: HttpClient, private aureliaAdal: AureliaAdalManager) {

  }

  configure() {
    let aureliaAdal = this.aureliaAdal;

    this.httpClient.configure((httpConfig: HttpClientConfiguration) => {
      httpConfig
        .withDefaults({
          headers: {
            'Accept': 'application/json'
          }
        })
        .withInterceptor({
          async request(request): Promise<Request> {
            let resource = aureliaAdal.getResourceForEndpoint(request.url);
            if (resource == null) {
              return request;
            }

            let tokenStored = aureliaAdal.getCachedToken(resource);
            let isEndpoint = false;

            if (tokenStored) {
              aureliaAdal.info('Token is avaliable for this url ' + request.url);
              // check endpoint mapping if provided
              request.headers.append('Authorization', 'Bearer ' + tokenStored);
              return request;
            } else {
              if (aureliaAdal.config) {
                for (let endpointUrl in aureliaAdal.config().endpoints) {
                  if (request.url.indexOf(endpointUrl) > -1) {
                    isEndpoint = true;
                  }
                }
              }
              
              // Cancel request if login is starting
              if (aureliaAdal.loginInProgress()) {
                aureliaAdal.info('login already started.');
                throw new Error('login already started');
              } else if (aureliaAdal.config && isEndpoint) {
                // external endpoints
                // delayed request to return after iframe completes
                let token = await aureliaAdal.acquireToken(resource);

                aureliaAdal.verbose('Token is avaliable');
                request.headers.set('Authorization', 'Bearer ' + token);
              }
            }

            return request;
          },
          responseError(rejection): Response {
            aureliaAdal.info('Getting error in the response');

            if (rejection && rejection.status === 401) {
              var resource = aureliaAdal.getResourceForEndpoint(rejection.config.url);
              aureliaAdal.clearCacheForResource(resource);
              // TODO: broadcast notAuthorized?
            }

            return rejection;
          }
        });
    });
  }
}
export function configure(frameworkConfig: FrameworkConfiguration, config: AureliaAdalConfig) {
  let aureliaAdal: AureliaAdalManager = frameworkConfig.container.get(AureliaAdalManager);

  aureliaAdal.configure(config);
}