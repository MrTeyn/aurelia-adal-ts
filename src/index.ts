import { FrameworkConfiguration } from 'aurelia-framework';
import { AureliaAdalConfig } from './aurelia-adal-config';
import { AureliaAdalManager } from './aurelia-adal-manager';
import { AureliaAdalFetchConfig } from './aurelia-adal-fetch-config';
import { AureliaAdalAuthorizeStep } from './aurelia-adal-authorize-step';

export function configure(frameworkConfig: FrameworkConfiguration, config: AureliaAdalConfig) {
  let aureliaAdal: AureliaAdalManager = frameworkConfig.container.get(AureliaAdalManager);

  aureliaAdal.configure(config);
}