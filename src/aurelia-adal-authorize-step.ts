import {inject} from 'aurelia-framework';
import {NavigationInstruction, Redirect} from 'aurelia-router';
import {AureliaAdalManager} from './aurelia-adal-manager';

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