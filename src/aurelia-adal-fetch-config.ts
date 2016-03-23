import {HttpClient, HttpClientConfiguration} from 'aurelia-fetch-client';
import {AureliaAdalManager} from './aurelia-adal-manager';
import {inject} from 'aurelia-framework';

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