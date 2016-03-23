'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

System.register(['adal', 'aurelia-framework', 'aurelia-router', 'aurelia-fetch-client'], function (exports_1) {
    var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
        var c = arguments.length,
            r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
            d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = this && this.__metadata || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var __awaiter = this && this.__awaiter || function (thisArg, _arguments, Promise, generator) {
        return new Promise(function (resolve, reject) {
            generator = generator.call(thisArg, _arguments);
            function cast(value) {
                return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) {
                    resolve(value);
                });
            }
            function onfulfill(value) {
                try {
                    step("next", value);
                } catch (e) {
                    reject(e);
                }
            }
            function onreject(value) {
                try {
                    step("throw", value);
                } catch (e) {
                    reject(e);
                }
            }
            function step(verb, value) {
                var result = generator[verb](value);
                result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
            }
            step("next", void 0);
        });
    };
    var Adal, aurelia_framework_1, aurelia_router_1, aurelia_fetch_client_1;
    var AureliaAdalManager, AureliaAdalAuthorizeStep, AureliaAdalFetchConfig;
    function configure(frameworkConfig, config) {
        var aureliaAdal = frameworkConfig.container.get(AureliaAdalManager);
        aureliaAdal.configure(config);
    }
    exports_1("configure", configure);
    return {
        setters: [function (Adal_1) {
            Adal = Adal_1;
        }, function (aurelia_framework_1_1) {
            aurelia_framework_1 = aurelia_framework_1_1;
        }, function (aurelia_router_1_1) {
            aurelia_router_1 = aurelia_router_1_1;
        }, function (aurelia_fetch_client_1_1) {
            aurelia_fetch_client_1 = aurelia_fetch_client_1_1;
        }],
        execute: function execute() {
            var AureliaAdalManager = (function () {
                function AureliaAdalManager(adalConstructor) {
                    _classCallCheck(this, AureliaAdalManager);

                    this.adalConstructor = adalConstructor;
                    this.oauthData = {
                        isAuthenticated: false,
                        userName: '',
                        loginError: '',
                        profile: null
                    };
                }

                _createClass(AureliaAdalManager, [{
                    key: 'configure',
                    value: function configure(config) {
                        var _this = this;

                        try {
                            var configOptions = {};
                            configOptions.tenant = config.tenant;
                            configOptions.clientId = config.clientId;
                            configOptions.endpoints = config.endpoints;
                            var existingHash = window.location.hash;
                            var pathDefault = window.location.href;
                            if (existingHash) {
                                pathDefault = pathDefault.replace(existingHash, '');
                            }
                            configOptions.redirectUri = configOptions.redirectUri || pathDefault;
                            configOptions.postLogoutRedirectUri = configOptions.postLogoutRedirectUri || pathDefault;
                            this.adal = this.adalConstructor.inject(configOptions);
                            window.AuthenticationContext = function () {
                                return _this.adal;
                            };
                            this.updateDataFromCache(this.adal.config.loginResource);
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }, {
                    key: 'updateDataFromCache',
                    value: function updateDataFromCache(resource) {
                        var token = this.adal.getCachedToken(resource);
                        this.oauthData.isAuthenticated = token !== null && token.length > 0;
                        var user = this.adal.getCachedUser() || { userName: '', profile: null };
                        this.oauthData.userName = user.userName;
                        this.oauthData.profile = user.profile;
                        this.oauthData.loginError = this.adal.getLoginError();
                    }
                }, {
                    key: 'hashHandler',
                    value: function hashHandler(hash, redirectHandler, isNotCallbackHandler, nextHandler) {
                        if (this.adal.isCallback(hash)) {
                            var requestInfo = this.adal.getRequestInfo(hash);
                            this.adal.saveTokenFromHash(requestInfo);
                            if (requestInfo.requestType !== this.adal.REQUEST_TYPE.LOGIN) {
                                this.adal.callback = window.parent.AuthenticationContext().callback;
                                if (requestInfo.requestType === this.adal.REQUEST_TYPE.RENEW_TOKEN) {
                                    this.adal.callback = window.parent.callBackMappedToRenewStates[requestInfo.stateResponse];
                                }
                            }
                            if (requestInfo.stateMatch) {
                                if (typeof this.adal.callback === 'function') {
                                    if (requestInfo.requestType === this.adal.REQUEST_TYPE.RENEW_TOKEN) {
                                        if (requestInfo.parameters['access_token']) {
                                            this.adal.callback(this.adal._getItem(this.adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters['access_token']);
                                            return nextHandler();
                                        } else if (requestInfo.parameters['id_token']) {
                                            this.adal.callback(this.adal._getItem(this.adal.CONSTANTS.STORAGE.ERROR_DESCRIPTION), requestInfo.parameters['id_token']);
                                            return nextHandler();
                                        }
                                    }
                                } else {
                                    this.updateDataFromCache(this.adal.config.loginResource);
                                    if (this.oauthData.userName) {
                                        var _self = this;
                                        _self.updateDataFromCache(_self.adal.config.loginResource);
                                        var loginStartPage = _self.adal._getItem(_self.adal.CONSTANTS.STORAGE.START_PAGE);
                                        if (loginStartPage) {
                                            return redirectHandler(loginStartPage);
                                        }
                                    } else {}
                                }
                            }
                        } else {
                            return isNotCallbackHandler();
                        }
                    }
                }, {
                    key: 'loginHandler',
                    value: function loginHandler(path, redirectHandler, handler) {
                        this.adal.info('Login event for:' + path);
                        if (this.adal.config && this.adal.config.localLoginUrl) {
                            return redirectHandler(this.adal.config.localLoginUrl);
                        } else {
                            this.adal._saveItem(this.adal.CONSTANTS.STORAGE.START_PAGE, path);
                            this.adal.info('Start login at:' + window.location.href);
                            this.adal.login();
                            return handler();
                        }
                    }
                }, {
                    key: 'config',
                    value: function config() {
                        return this.adal.config;
                    }
                }, {
                    key: 'login',
                    value: function login() {
                        this.adal.login();
                    }
                }, {
                    key: 'loginInProgress',
                    value: function loginInProgress() {
                        return this.adal.loginInProgress();
                    }
                }, {
                    key: 'logOut',
                    value: function logOut() {
                        this.adal.logOut();
                    }
                }, {
                    key: 'getCachedToken',
                    value: function getCachedToken(resource) {
                        return this.adal.getCachedToken(resource);
                    }
                }, {
                    key: 'getUserInfo',
                    value: function getUserInfo() {
                        return this.oauthData;
                    }
                }, {
                    key: 'acquireToken',
                    value: function acquireToken(resource) {
                        var _this2 = this;

                        return new Promise(function (resolve, reject) {
                            _this2.adal.acquireToken(resource, function (error, tokenOut) {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(tokenOut);
                                }
                            });
                        });
                    }
                }, {
                    key: 'getUser',
                    value: function getUser() {
                        return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$4$0() {
                            return regeneratorRuntime.wrap(function callee$4$0$(context$5$0) {
                                var _this3 = this;

                                while (1) switch (context$5$0.prev = context$5$0.next) {
                                    case 0:
                                        context$5$0.next = 2;
                                        return new Promise(function (resolve, reject) {
                                            _this3.adal.getUser(function (error, user) {
                                                if (error) {
                                                    reject(error);
                                                } else {
                                                    resolve(user);
                                                }
                                            });
                                        });

                                    case 2:
                                        return context$5$0.abrupt('return', context$5$0.sent);

                                    case 3:
                                    case 'end':
                                        return context$5$0.stop();
                                }
                            }, callee$4$0, this);
                        }));
                    }
                }, {
                    key: 'getResourceForEndpoint',
                    value: function getResourceForEndpoint(endpoint) {
                        return this.adal.getResourceForEndpoint(endpoint);
                    }
                }, {
                    key: 'clearCache',
                    value: function clearCache() {
                        this.adal.clearCache();
                    }
                }, {
                    key: 'clearCacheForResource',
                    value: function clearCacheForResource(resource) {
                        this.adal.clearCacheForResource(resource);
                    }
                }, {
                    key: 'info',
                    value: function info(message) {
                        this.adal.info(message);
                    }
                }, {
                    key: 'verbose',
                    value: function verbose(message) {
                        this.adal.verbose(message);
                    }
                }, {
                    key: 'isAuthenticated',
                    value: function isAuthenticated() {
                        return this.oauthData.isAuthenticated;
                    }
                }]);

                return AureliaAdalManager;
            })();
            AureliaAdalManager = __decorate([aurelia_framework_1.inject(Adal), __metadata('design:paramtypes', [Object])], AureliaAdalManager);
            AureliaAdalManager = AureliaAdalManager;
            var AureliaAdalAuthorizeStep = (function () {
                function AureliaAdalAuthorizeStep(aureliaAdal) {
                    _classCallCheck(this, AureliaAdalAuthorizeStep);

                    this.aureliaAdal = aureliaAdal;
                }

                _createClass(AureliaAdalAuthorizeStep, [{
                    key: 'run',
                    value: function run(routingContext, next) {
                        var _this4 = this;

                        var hash = window.location.hash;
                        return this.aureliaAdal.hashHandler(hash, function (url) {
                            return next.cancel(new aurelia_router_1.Redirect(url));
                        }, function () {
                            var loginRoute = '';
                            if (routingContext.getAllInstructions().some(function (i) {
                                return !!i.config.settings.requireAdalLogin;
                            })) {
                                if (!_this4.aureliaAdal.isAuthenticated()) {
                                    return _this4.aureliaAdal.loginHandler(routingContext.fragment, function (url) {
                                        return next.cancel(new aurelia_router_1.Redirect(url));
                                    }, function () {
                                        return next.cancel('login redirect');
                                    });
                                }
                            } else if (_this4.aureliaAdal.isAuthenticated() && routingContext.getAllInstructions().some(function (i) {
                                return i.fragment == loginRoute;
                            })) {
                                var loginRedirect = '';
                                return next.cancel(new aurelia_router_1.Redirect(loginRedirect));
                            }
                            return next();
                        }, function () {
                            return next();
                        });
                    }
                }]);

                return AureliaAdalAuthorizeStep;
            })();
            AureliaAdalAuthorizeStep = __decorate([aurelia_framework_1.inject(AureliaAdalManager), __metadata('design:paramtypes', [AureliaAdalManager])], AureliaAdalAuthorizeStep);
            AureliaAdalAuthorizeStep = AureliaAdalAuthorizeStep;
            var AureliaAdalFetchConfig = (function () {
                function AureliaAdalFetchConfig(httpClient, aureliaAdal) {
                    _classCallCheck(this, AureliaAdalFetchConfig);

                    this.httpClient = httpClient;
                    this.aureliaAdal = aureliaAdal;
                }

                _createClass(AureliaAdalFetchConfig, [{
                    key: 'configure',
                    value: function configure() {
                        var aureliaAdal = this.aureliaAdal;
                        this.httpClient.configure(function (httpConfig) {
                            httpConfig.withDefaults({
                                headers: {
                                    'Accept': 'application/json'
                                }
                            }).withInterceptor({
                                request: function request(_request) {
                                    return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$6$0() {
                                        var resource, tokenStored, isEndpoint, endpointUrl, token;
                                        return regeneratorRuntime.wrap(function callee$6$0$(context$7$0) {
                                            while (1) switch (context$7$0.prev = context$7$0.next) {
                                                case 0:
                                                    resource = aureliaAdal.getResourceForEndpoint(_request.url);

                                                    if (!(resource == null)) {
                                                        context$7$0.next = 3;
                                                        break;
                                                    }

                                                    return context$7$0.abrupt('return', _request);

                                                case 3:
                                                    tokenStored = aureliaAdal.getCachedToken(resource);
                                                    isEndpoint = false;

                                                    if (!tokenStored) {
                                                        context$7$0.next = 11;
                                                        break;
                                                    }

                                                    aureliaAdal.info('Token is avaliable for this url ' + _request.url);
                                                    _request.headers.append('Authorization', 'Bearer ' + tokenStored);
                                                    return context$7$0.abrupt('return', _request);

                                                case 11:
                                                    if (aureliaAdal.config) {
                                                        for (endpointUrl in aureliaAdal.config().endpoints) {
                                                            if (_request.url.indexOf(endpointUrl) > -1) {
                                                                isEndpoint = true;
                                                            }
                                                        }
                                                    }

                                                    if (!aureliaAdal.loginInProgress()) {
                                                        context$7$0.next = 17;
                                                        break;
                                                    }

                                                    aureliaAdal.info('login already started.');
                                                    throw new Error('login already started');

                                                case 17:
                                                    if (!(aureliaAdal.config && isEndpoint)) {
                                                        context$7$0.next = 23;
                                                        break;
                                                    }

                                                    context$7$0.next = 20;
                                                    return aureliaAdal.acquireToken(resource);

                                                case 20:
                                                    token = context$7$0.sent;

                                                    aureliaAdal.verbose('Token is avaliable');
                                                    _request.headers.set('Authorization', 'Bearer ' + token);

                                                case 23:
                                                    return context$7$0.abrupt('return', _request);

                                                case 24:
                                                case 'end':
                                                    return context$7$0.stop();
                                            }
                                        }, callee$6$0, this);
                                    }));
                                },
                                responseError: function responseError(rejection) {
                                    aureliaAdal.info('Getting error in the response');
                                    if (rejection && rejection.status === 401) {
                                        var resource = aureliaAdal.getResourceForEndpoint(rejection.config.url);
                                        aureliaAdal.clearCacheForResource(resource);
                                    }
                                    return rejection;
                                }
                            });
                        });
                    }
                }]);

                return AureliaAdalFetchConfig;
            })();
            AureliaAdalFetchConfig = __decorate([aurelia_framework_1.inject(aurelia_fetch_client_1.HttpClient, AureliaAdalManager), __metadata('design:paramtypes', [aurelia_fetch_client_1.HttpClient, AureliaAdalManager])], AureliaAdalFetchConfig);
            AureliaAdalFetchConfig = AureliaAdalFetchConfig;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1cmVsaWEtYWRhbC5qcyIsImF1cmVsaWEtYWRhbC50cyJdLCJuYW1lcyI6WyJjb25maWd1cmUiLCJBdXJlbGlhQWRhbE1hbmFnZXIiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY29uc3RydWN0b3IiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY29uZmlndXJlIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLnVwZGF0ZURhdGFGcm9tQ2FjaGUiLCJBdXJlbGlhQWRhbE1hbmFnZXIuaGFzaEhhbmRsZXIiLCJBdXJlbGlhQWRhbE1hbmFnZXIubG9naW5IYW5kbGVyIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmNvbmZpZyIsIkF1cmVsaWFBZGFsTWFuYWdlci5sb2dpbiIsIkF1cmVsaWFBZGFsTWFuYWdlci5sb2dpbkluUHJvZ3Jlc3MiLCJBdXJlbGlhQWRhbE1hbmFnZXIubG9nT3V0IiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldENhY2hlZFRva2VuIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldFVzZXJJbmZvIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmFjcXVpcmVUb2tlbiIsIkF1cmVsaWFBZGFsTWFuYWdlci5nZXRVc2VyIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldFJlc291cmNlRm9yRW5kcG9pbnQiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY2xlYXJDYWNoZSIsIkF1cmVsaWFBZGFsTWFuYWdlci5jbGVhckNhY2hlRm9yUmVzb3VyY2UiLCJBdXJlbGlhQWRhbE1hbmFnZXIuaW5mbyIsIkF1cmVsaWFBZGFsTWFuYWdlci52ZXJib3NlIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmlzQXV0aGVudGljYXRlZCIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcC5jb25zdHJ1Y3RvciIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcC5ydW4iLCJBdXJlbGlhQWRhbEZldGNoQ29uZmlnIiwiQXVyZWxpYUFkYWxGZXRjaENvbmZpZy5jb25zdHJ1Y3RvciIsIkF1cmVsaWFBZGFsRmV0Y2hDb25maWcuY29uZmlndXJlIiwiQXVyZWxpYUFkYWxGZXRjaENvbmZpZy5jb25maWd1cmUucmVxdWVzdCIsIkF1cmVsaWFBZGFsRmV0Y2hDb25maWcuY29uZmlndXJlLnJlc3BvbnNlRXJyb3IiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLENBQUMsRUFBRSxVQUFTLFNBQVMsRUFBRTtBQUN6RyxRQUFJLFVBQVUsR0FBRyxBQUFDLElBQUksSUFBSSxJQUFJLENBQUMsVUFBVSxJQUFLLFVBQVUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQ25GLFlBQUksQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNO1lBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsTUFBTSxHQUFHLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEdBQUcsSUFBSTtZQUFFLENBQUMsQ0FBQztBQUM3SCxZQUFJLE9BQU8sT0FBTyxLQUFLLFFBQVEsSUFBSSxPQUFPLE9BQU8sQ0FBQyxRQUFRLEtBQUssVUFBVSxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDLEtBQzFILEtBQUssSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLEdBQUcs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LElBQUlBLFNBQVNBLENBQUNBLE1BQU1BLEtBQUtBLEdBQUdBLEVBQUVBO0FBQ3pDQSw0Q0FBSUEsUUFBUUEsR0FBR0EsV0FBV0EsQ0FBQ0Esc0JBQXNCQSxDQUFDQSxTQUFTQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtBQUN4RUEsbURBQVdBLENBQUNBLHFCQUFxQkEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7cUNBRTdDQTtBQUVEQSwyQ0FBT0EsU0FBU0EsQ0FBQ0E7aUNBQ2xCQTs2QkFDRkYsQ0FBQ0EsQ0FBQ0E7eUJBQ05BLENBQUNBLENBQUNBO3FCQUNKQTs7OztnQkFDRkYsQ0FBQUE7QUF0RUQsa0NBQUEsR0FBQSxVQUFBLENBQUEsQ0FBQyxtQkFBQSxDQUFBLE1BQU0sQ0FBQyxzQkFBQSxDQUFBLFVBQVUsRUFBRSxrQkFBa0IsQ0FBQyxFRDhEdkIsVUFBVSxDQUFDLG1CQUFtQixFQUFFLENBQUMsc0JBQXNCLENBQUMsVUFBVSxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FDM0YsRUFBRSxzQkFBc0IsQ0FBQyxDQ09yQztBQXJFWSxrQ0FBc0IsR0FBQSxzQkFxRWxDLENBQUE7U0RMUTtLQUNKLENBQUE7Q0FDSixDQUFDLENBQUMiLCJmaWxlIjoiYXVyZWxpYS1hZGFsLmpzIiwic291cmNlc0NvbnRlbnQiOlsiU3lzdGVtLnJlZ2lzdGVyKFsnYWRhbCcsICdhdXJlbGlhLWZyYW1ld29yaycsICdhdXJlbGlhLXJvdXRlcicsICdhdXJlbGlhLWZldGNoLWNsaWVudCddLCBmdW5jdGlvbihleHBvcnRzXzEpIHtcbiAgICB2YXIgX19kZWNvcmF0ZSA9ICh0aGlzICYmIHRoaXMuX19kZWNvcmF0ZSkgfHwgZnVuY3Rpb24gKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKSB7XG4gICAgICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgICAgIGVsc2UgZm9yICh2YXIgaSA9IGRlY29yYXRvcnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIGlmIChkID0gZGVjb3JhdG9yc1tpXSkgciA9IChjIDwgMyA/IGQocikgOiBjID4gMyA/IGQodGFyZ2V0LCBrZXksIHIpIDogZCh0YXJnZXQsIGtleSkpIHx8IHI7XG4gICAgICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG4gICAgfTtcbiAgICB2YXIgX19tZXRhZGF0YSA9ICh0aGlzICYmIHRoaXMuX19tZXRhZGF0YSkgfHwgZnVuY3Rpb24gKGssIHYpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xuICAgIH07XG4gICAgdmFyIF9fYXdhaXRlciA9ICh0aGlzICYmIHRoaXMuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUHJvbWlzZSwgZ2VuZXJhdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgICBnZW5lcmF0b3IgPSBnZW5lcmF0b3IuY2FsbCh0aGlzQXJnLCBfYXJndW1lbnRzKTtcbiAgICAgICAgICAgIGZ1bmN0aW9uIGNhc3QodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUHJvbWlzZSAmJiB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gUHJvbWlzZSA/IHZhbHVlIDogbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgICAgICAgICBmdW5jdGlvbiBvbmZ1bGZpbGwodmFsdWUpIHsgdHJ5IHsgc3RlcChcIm5leHRcIiwgdmFsdWUpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgICAgICBmdW5jdGlvbiBvbnJlamVjdCh2YWx1ZSkgeyB0cnkgeyBzdGVwKFwidGhyb3dcIiwgdmFsdWUpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgICAgICBmdW5jdGlvbiBzdGVwKHZlcmIsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBjYXN0KHJlc3VsdC52YWx1ZSkudGhlbihvbmZ1bGZpbGwsIG9ucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZvaWQgMCk7XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgdmFyIEFkYWwsIGF1cmVsaWFfZnJhbWV3b3JrXzEsIGF1cmVsaWFfcm91dGVyXzEsIGF1cmVsaWFfZmV0Y2hfY2xpZW50XzE7XG4gICAgdmFyIEF1cmVsaWFBZGFsTWFuYWdlciwgQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwLCBBdXJlbGlhQWRhbEZldGNoQ29uZmlnO1xuICAgIGZ1bmN0aW9uIGNvbmZpZ3VyZShmcmFtZXdvcmtDb25maWcsIGNvbmZpZykge1xuICAgICAgICBsZXQgYXVyZWxpYUFkYWwgPSBmcmFtZXdvcmtDb25maWcuY29udGFpbmVyLmdldChBdXJlbGlhQWRhbE1hbmFnZXIpO1xuICAgICAgICBhdXJlbGlhQWRhbC5jb25maWd1cmUoY29uZmlnKTtcbiAgICB9XG4gICAgZXhwb3J0c18xKFwiY29uZmlndXJlXCIsIGNvbmZpZ3VyZSk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc2V0dGVyczpbXG4gICAgICAgICAgICBmdW5jdGlvbiAoQWRhbF8xKSB7XG4gICAgICAgICAgICAgICAgQWRhbCA9IEFkYWxfMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoYXVyZWxpYV9mcmFtZXdvcmtfMV8xKSB7XG4gICAgICAgICAgICAgICAgYXVyZWxpYV9mcmFtZXdvcmtfMSA9IGF1cmVsaWFfZnJhbWV3b3JrXzFfMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoYXVyZWxpYV9yb3V0ZXJfMV8xKSB7XG4gICAgICAgICAgICAgICAgYXVyZWxpYV9yb3V0ZXJfMSA9IGF1cmVsaWFfcm91dGVyXzFfMTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoYXVyZWxpYV9mZXRjaF9jbGllbnRfMV8xKSB7XG4gICAgICAgICAgICAgICAgYXVyZWxpYV9mZXRjaF9jbGllbnRfMSA9IGF1cmVsaWFfZmV0Y2hfY2xpZW50XzFfMTtcbiAgICAgICAgICAgIH1dLFxuICAgICAgICBleGVjdXRlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxldCBBdXJlbGlhQWRhbE1hbmFnZXIgPSBjbGFzcyB7XG4gICAgICAgICAgICAgICAgY29uc3RydWN0b3IoYWRhbENvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbENvbnN0cnVjdG9yID0gYWRhbENvbnN0cnVjdG9yO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9hdXRoRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQXV0aGVudGljYXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyTmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dpbkVycm9yOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGU6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uZmlndXJlKGNvbmZpZykge1xuICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNvbmZpZ09wdGlvbnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMudGVuYW50ID0gY29uZmlnLnRlbmFudDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMuY2xpZW50SWQgPSBjb25maWcuY2xpZW50SWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWdPcHRpb25zLmVuZHBvaW50cyA9IGNvbmZpZy5lbmRwb2ludHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdIYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aERlZmF1bHQgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChleGlzdGluZ0hhc2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoRGVmYXVsdCA9IHBhdGhEZWZhdWx0LnJlcGxhY2UoZXhpc3RpbmdIYXNoLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWdPcHRpb25zLnJlZGlyZWN0VXJpID0gY29uZmlnT3B0aW9ucy5yZWRpcmVjdFVyaSB8fCBwYXRoRGVmYXVsdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMucG9zdExvZ291dFJlZGlyZWN0VXJpID0gY29uZmlnT3B0aW9ucy5wb3N0TG9nb3V0UmVkaXJlY3RVcmkgfHwgcGF0aERlZmF1bHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwgPSB0aGlzLmFkYWxDb25zdHJ1Y3Rvci5pbmplY3QoY29uZmlnT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuQXV0aGVudGljYXRpb25Db250ZXh0ID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkYWw7XG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEYXRhRnJvbUNhY2hlKHRoaXMuYWRhbC5jb25maWcubG9naW5SZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHVwZGF0ZURhdGFGcm9tQ2FjaGUocmVzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRva2VuID0gdGhpcy5hZGFsLmdldENhY2hlZFRva2VuKHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYXV0aERhdGEuaXNBdXRoZW50aWNhdGVkID0gdG9rZW4gIT09IG51bGwgJiYgdG9rZW4ubGVuZ3RoID4gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVzZXIgPSB0aGlzLmFkYWwuZ2V0Q2FjaGVkVXNlcigpIHx8IHsgdXNlck5hbWU6ICcnLCBwcm9maWxlOiBudWxsIH07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub2F1dGhEYXRhLnVzZXJOYW1lID0gdXNlci51c2VyTmFtZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYXV0aERhdGEucHJvZmlsZSA9IHVzZXIucHJvZmlsZTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vYXV0aERhdGEubG9naW5FcnJvciA9IHRoaXMuYWRhbC5nZXRMb2dpbkVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGhhc2hIYW5kbGVyKGhhc2gsIHJlZGlyZWN0SGFuZGxlciwgaXNOb3RDYWxsYmFja0hhbmRsZXIsIG5leHRIYW5kbGVyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmFkYWwuaXNDYWxsYmFjayhoYXNoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RJbmZvID0gdGhpcy5hZGFsLmdldFJlcXVlc3RJbmZvKGhhc2gpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLnNhdmVUb2tlbkZyb21IYXNoKHJlcXVlc3RJbmZvKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSAhPT0gdGhpcy5hZGFsLlJFUVVFU1RfVFlQRS5MT0dJTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayA9IHdpbmRvdy5wYXJlbnQuQXV0aGVudGljYXRpb25Db250ZXh0KCkuY2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlID09PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLlJFTkVXX1RPS0VOKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayA9IHdpbmRvdy5wYXJlbnQuY2FsbEJhY2tNYXBwZWRUb1JlbmV3U3RhdGVzW3JlcXVlc3RJbmZvLnN0YXRlUmVzcG9uc2VdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5zdGF0ZU1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmFkYWwuY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlID09PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLlJFTkVXX1RPS0VOKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdEluZm8ucGFyYW1ldGVyc1snYWNjZXNzX3Rva2VuJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sodGhpcy5hZGFsLl9nZXRJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5FUlJPUl9ERVNDUklQVElPTiksIHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2FjY2Vzc190b2tlbiddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dEhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2lkX3Rva2VuJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sodGhpcy5hZGFsLl9nZXRJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5FUlJPUl9ERVNDUklQVElPTiksIHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2lkX3Rva2VuJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0SGFuZGxlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ2FjaGUodGhpcy5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMub2F1dGhEYXRhLnVzZXJOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZURhdGFGcm9tQ2FjaGUoc2VsZi5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsb2dpblN0YXJ0UGFnZSA9IHNlbGYuYWRhbC5fZ2V0SXRlbShzZWxmLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuU1RBUlRfUEFHRSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9naW5TdGFydFBhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVkaXJlY3RIYW5kbGVyKGxvZ2luU3RhcnRQYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBpc05vdENhbGxiYWNrSGFuZGxlcigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxvZ2luSGFuZGxlcihwYXRoLCByZWRpcmVjdEhhbmRsZXIsIGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmluZm8oJ0xvZ2luIGV2ZW50IGZvcjonICsgcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmFkYWwuY29uZmlnICYmIHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZGlyZWN0SGFuZGxlcih0aGlzLmFkYWwuY29uZmlnLmxvY2FsTG9naW5VcmwpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLl9zYXZlSXRlbSh0aGlzLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuU1RBUlRfUEFHRSwgcGF0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwuaW5mbygnU3RhcnQgbG9naW4gYXQ6JyArIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5sb2dpbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGhhbmRsZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25maWcoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkYWwuY29uZmlnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsb2dpbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmxvZ2luKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGxvZ2luSW5Qcm9ncmVzcygpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRhbC5sb2dpbkluUHJvZ3Jlc3MoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbG9nT3V0KCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwubG9nT3V0KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdldENhY2hlZFRva2VuKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBnZXRVc2VySW5mbygpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMub2F1dGhEYXRhO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhY3F1aXJlVG9rZW4ocmVzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5hY3F1aXJlVG9rZW4ocmVzb3VyY2UsIChlcnJvciwgdG9rZW5PdXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodG9rZW5PdXQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZ2V0VXNlcigpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIFByb21pc2UsIGZ1bmN0aW9uKiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5nZXRVc2VyKChlcnJvciwgdXNlcikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGdldFJlc291cmNlRm9yRW5kcG9pbnQoZW5kcG9pbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KGVuZHBvaW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2xlYXJDYWNoZSgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmNsZWFyQ2FjaGUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2xlYXJDYWNoZUZvclJlc291cmNlKHJlc291cmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5jbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpbmZvKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmluZm8obWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZlcmJvc2UobWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwudmVyYm9zZShtZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaXNBdXRoZW50aWNhdGVkKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5vYXV0aERhdGEuaXNBdXRoZW50aWNhdGVkO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBBdXJlbGlhQWRhbE1hbmFnZXIgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgICAgICAgICBhdXJlbGlhX2ZyYW1ld29ya18xLmluamVjdChBZGFsKSwgXG4gICAgICAgICAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnBhcmFtdHlwZXMnLCBbT2JqZWN0XSlcbiAgICAgICAgICAgIF0sIEF1cmVsaWFBZGFsTWFuYWdlcik7XG4gICAgICAgICAgICBBdXJlbGlhQWRhbE1hbmFnZXIgPSBBdXJlbGlhQWRhbE1hbmFnZXI7XG4gICAgICAgICAgICBsZXQgQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwID0gY2xhc3Mge1xuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yKGF1cmVsaWFBZGFsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXVyZWxpYUFkYWwgPSBhdXJlbGlhQWRhbDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcnVuKHJvdXRpbmdDb250ZXh0LCBuZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF1cmVsaWFBZGFsLmhhc2hIYW5kbGVyKGhhc2gsICh1cmwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgYXVyZWxpYV9yb3V0ZXJfMS5SZWRpcmVjdCh1cmwpKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvZ2luUm91dGUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyb3V0aW5nQ29udGV4dC5nZXRBbGxJbnN0cnVjdGlvbnMoKS5zb21lKGkgPT4gISFpLmNvbmZpZy5zZXR0aW5ncy5yZXF1aXJlQWRhbExvZ2luKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5hdXJlbGlhQWRhbC5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdXJlbGlhQWRhbC5sb2dpbkhhbmRsZXIocm91dGluZ0NvbnRleHQuZnJhZ21lbnQsICh1cmwpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgYXVyZWxpYV9yb3V0ZXJfMS5SZWRpcmVjdCh1cmwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQuY2FuY2VsKCdsb2dpbiByZWRpcmVjdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmF1cmVsaWFBZGFsLmlzQXV0aGVudGljYXRlZCgpICYmIHJvdXRpbmdDb250ZXh0LmdldEFsbEluc3RydWN0aW9ucygpLnNvbWUoaSA9PiBpLmZyYWdtZW50ID09IGxvZ2luUm91dGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxvZ2luUmVkaXJlY3QgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IGF1cmVsaWFfcm91dGVyXzEuUmVkaXJlY3QobG9naW5SZWRpcmVjdCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCA9IF9fZGVjb3JhdGUoW1xuICAgICAgICAgICAgICAgIGF1cmVsaWFfZnJhbWV3b3JrXzEuaW5qZWN0KEF1cmVsaWFBZGFsTWFuYWdlciksIFxuICAgICAgICAgICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgW0F1cmVsaWFBZGFsTWFuYWdlcl0pXG4gICAgICAgICAgICBdLCBBdXJlbGlhQWRhbEF1dGhvcml6ZVN0ZXApO1xuICAgICAgICAgICAgQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwID0gQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwO1xuICAgICAgICAgICAgbGV0IEF1cmVsaWFBZGFsRmV0Y2hDb25maWcgPSBjbGFzcyB7XG4gICAgICAgICAgICAgICAgY29uc3RydWN0b3IoaHR0cENsaWVudCwgYXVyZWxpYUFkYWwpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5odHRwQ2xpZW50ID0gaHR0cENsaWVudDtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdXJlbGlhQWRhbCA9IGF1cmVsaWFBZGFsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25maWd1cmUoKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhdXJlbGlhQWRhbCA9IHRoaXMuYXVyZWxpYUFkYWw7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaHR0cENsaWVudC5jb25maWd1cmUoKGh0dHBDb25maWcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0dHBDb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAud2l0aERlZmF1bHRzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC53aXRoSW50ZXJjZXB0b3Ioe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3QocmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGF1cmVsaWFBZGFsLmdldFJlc291cmNlRm9yRW5kcG9pbnQocmVxdWVzdC51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b2tlblN0b3JlZCA9IGF1cmVsaWFBZGFsLmdldENhY2hlZFRva2VuKHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpc0VuZHBvaW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW5TdG9yZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdUb2tlbiBpcyBhdmFsaWFibGUgZm9yIHRoaXMgdXJsICcgKyByZXF1ZXN0LnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmFwcGVuZCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHRva2VuU3RvcmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXJlbGlhQWRhbC5jb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZW5kcG9pbnRVcmwgaW4gYXVyZWxpYUFkYWwuY29uZmlnKCkuZW5kcG9pbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC51cmwuaW5kZXhPZihlbmRwb2ludFVybCkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRW5kcG9pbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXJlbGlhQWRhbC5sb2dpbkluUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdsb2dpbiBhbHJlYWR5IHN0YXJ0ZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbG9naW4gYWxyZWFkeSBzdGFydGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGF1cmVsaWFBZGFsLmNvbmZpZyAmJiBpc0VuZHBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b2tlbiA9IHlpZWxkIGF1cmVsaWFBZGFsLmFjcXVpcmVUb2tlbihyZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLnZlcmJvc2UoJ1Rva2VuIGlzIGF2YWxpYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuc2V0KCdBdXRob3JpemF0aW9uJywgJ0JlYXJlciAnICsgdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlRXJyb3IocmVqZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmluZm8oJ0dldHRpbmcgZXJyb3IgaW4gdGhlIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWplY3Rpb24gJiYgcmVqZWN0aW9uLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlamVjdGlvbi5jb25maWcudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmNsZWFyQ2FjaGVGb3JSZXNvdXJjZShyZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIEF1cmVsaWFBZGFsRmV0Y2hDb25maWcgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgICAgICAgICBhdXJlbGlhX2ZyYW1ld29ya18xLmluamVjdChhdXJlbGlhX2ZldGNoX2NsaWVudF8xLkh0dHBDbGllbnQsIEF1cmVsaWFBZGFsTWFuYWdlciksIFxuICAgICAgICAgICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgW2F1cmVsaWFfZmV0Y2hfY2xpZW50XzEuSHR0cENsaWVudCwgQXVyZWxpYUFkYWxNYW5hZ2VyXSlcbiAgICAgICAgICAgIF0sIEF1cmVsaWFBZGFsRmV0Y2hDb25maWcpO1xuICAgICAgICAgICAgQXVyZWxpYUFkYWxGZXRjaENvbmZpZyA9IEF1cmVsaWFBZGFsRmV0Y2hDb25maWc7XG4gICAgICAgIH1cbiAgICB9XG59KTtcbiIsImltcG9ydCAqIGFzIEFkYWwgZnJvbSAnYWRhbCc7XG5pbXBvcnQge2luamVjdCxGcmFtZXdvcmtDb25maWd1cmF0aW9ufSBmcm9tICdhdXJlbGlhLWZyYW1ld29yayc7XG5pbXBvcnQge05hdmlnYXRpb25JbnN0cnVjdGlvbixSZWRpcmVjdH0gZnJvbSAnYXVyZWxpYS1yb3V0ZXInO1xuaW1wb3J0IHtIdHRwQ2xpZW50LEh0dHBDbGllbnRDb25maWd1cmF0aW9ufSBmcm9tICdhdXJlbGlhLWZldGNoLWNsaWVudCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXVyZWxpYUFkYWxDb25maWcge1xyXG4gICAgdGVuYW50Pzogc3RyaW5nO1xyXG4gICAgY2xpZW50SWQ/OiBzdHJpbmc7XHJcbiAgICBlbmRwb2ludHM/OiB7IFtpZDogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG59XG5AaW5qZWN0KEFkYWwpXHJcbmV4cG9ydCBjbGFzcyBBdXJlbGlhQWRhbE1hbmFnZXIge1xyXG5cclxuICBwcml2YXRlIGFkYWw6IEFkYWw7XHJcbiAgcHJpdmF0ZSBvYXV0aERhdGEgPSB7XHJcbiAgICBpc0F1dGhlbnRpY2F0ZWQ6IGZhbHNlLFxyXG4gICAgdXNlck5hbWU6ICcnLFxyXG4gICAgbG9naW5FcnJvcjogJycsXHJcbiAgICBwcm9maWxlOiBudWxsXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFkYWxDb25zdHJ1Y3RvcjogQWRhbCkge1xyXG4gICAgXHJcbiAgfVxyXG4gIFxyXG4gIGNvbmZpZ3VyZShjb25maWc6IEF1cmVsaWFBZGFsQ29uZmlnKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBsZXQgY29uZmlnT3B0aW9uczogQWRhbENvbmZpZyA9IHt9O1xyXG4gICAgICBcclxuICAgICAgY29uZmlnT3B0aW9ucy50ZW5hbnQgPSBjb25maWcudGVuYW50O1xyXG4gICAgICBjb25maWdPcHRpb25zLmNsaWVudElkID0gY29uZmlnLmNsaWVudElkO1xyXG4gICAgICBjb25maWdPcHRpb25zLmVuZHBvaW50cyA9IGNvbmZpZy5lbmRwb2ludHM7XHJcblxyXG4gICAgICAvLyByZWRpcmVjdCBhbmQgbG9nb3V0X3JlZGlyZWN0IGFyZSBzZXQgdG8gY3VycmVudCBsb2NhdGlvbiBieSBkZWZhdWx0XHJcbiAgICAgIGxldCBleGlzdGluZ0hhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcclxuICAgICAgbGV0IHBhdGhEZWZhdWx0ID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgICAgIGlmIChleGlzdGluZ0hhc2gpIHtcclxuICAgICAgICBwYXRoRGVmYXVsdCA9IHBhdGhEZWZhdWx0LnJlcGxhY2UoZXhpc3RpbmdIYXNoLCAnJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbmZpZ09wdGlvbnMucmVkaXJlY3RVcmkgPSBjb25maWdPcHRpb25zLnJlZGlyZWN0VXJpIHx8IHBhdGhEZWZhdWx0O1xyXG4gICAgICBjb25maWdPcHRpb25zLnBvc3RMb2dvdXRSZWRpcmVjdFVyaSA9IGNvbmZpZ09wdGlvbnMucG9zdExvZ291dFJlZGlyZWN0VXJpIHx8IHBhdGhEZWZhdWx0O1xyXG5cclxuICAgICAgdGhpcy5hZGFsID0gdGhpcy5hZGFsQ29uc3RydWN0b3IuaW5qZWN0KGNvbmZpZ09wdGlvbnMpO1xyXG4gICAgICBcclxuICAgICAgd2luZG93LkF1dGhlbnRpY2F0aW9uQ29udGV4dCA9ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGFsO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ2FjaGUodGhpcy5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlRGF0YUZyb21DYWNoZShyZXNvdXJjZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB2YXIgdG9rZW4gPSB0aGlzLmFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xyXG4gICAgdGhpcy5vYXV0aERhdGEuaXNBdXRoZW50aWNhdGVkID0gdG9rZW4gIT09IG51bGwgJiYgdG9rZW4ubGVuZ3RoID4gMDtcclxuICAgIHZhciB1c2VyID0gdGhpcy5hZGFsLmdldENhY2hlZFVzZXIoKSB8fCB7IHVzZXJOYW1lOiAnJywgcHJvZmlsZTogbnVsbCB9O1xyXG4gICAgdGhpcy5vYXV0aERhdGEudXNlck5hbWUgPSB1c2VyLnVzZXJOYW1lO1xyXG4gICAgdGhpcy5vYXV0aERhdGEucHJvZmlsZSA9IHVzZXIucHJvZmlsZTtcclxuICAgIHRoaXMub2F1dGhEYXRhLmxvZ2luRXJyb3IgPSB0aGlzLmFkYWwuZ2V0TG9naW5FcnJvcigpO1xyXG4gIH1cclxuXHJcbiAgaGFzaEhhbmRsZXIoaGFzaDogc3RyaW5nLCByZWRpcmVjdEhhbmRsZXI6IEZ1bmN0aW9uLCBpc05vdENhbGxiYWNrSGFuZGxlcjogRnVuY3Rpb24sIG5leHRIYW5kbGVyOiBGdW5jdGlvbik6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuYWRhbC5pc0NhbGxiYWNrKGhhc2gpKSB7XHJcbiAgICAgIGxldCByZXF1ZXN0SW5mbyA9IHRoaXMuYWRhbC5nZXRSZXF1ZXN0SW5mbyhoYXNoKTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMuYWRhbC5zYXZlVG9rZW5Gcm9tSGFzaChyZXF1ZXN0SW5mbyk7XHJcblxyXG4gICAgICBpZiAocmVxdWVzdEluZm8ucmVxdWVzdFR5cGUgIT09IHRoaXMuYWRhbC5SRVFVRVNUX1RZUEUuTE9HSU4pIHtcclxuICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sgPSB3aW5kb3cucGFyZW50LkF1dGhlbnRpY2F0aW9uQ29udGV4dCgpLmNhbGxiYWNrO1xyXG4gICAgICAgIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSA9PT0gdGhpcy5hZGFsLlJFUVVFU1RfVFlQRS5SRU5FV19UT0tFTikge1xyXG4gICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrID0gd2luZG93LnBhcmVudC5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbcmVxdWVzdEluZm8uc3RhdGVSZXNwb25zZV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZXR1cm4gdG8gY2FsbGJhY2sgaWYgaXQgaXMgc2VudCBmcm9tIGlmcmFtZVxyXG4gICAgICBpZiAocmVxdWVzdEluZm8uc3RhdGVNYXRjaCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5hZGFsLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAvLyBDYWxsIHdpdGhpbiB0aGUgc2FtZSBjb250ZXh0IHdpdGhvdXQgZnVsbCBwYWdlIHJlZGlyZWN0IGtlZXBzIHRoZSBjYWxsYmFja1xyXG4gICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlID09PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLlJFTkVXX1RPS0VOKSB7XHJcbiAgICAgICAgICAgIC8vIElkdG9rZW4gb3IgQWNjZXN0b2tlbiBjYW4gYmUgcmVuZXdlZFxyXG4gICAgICAgICAgICBpZiAocmVxdWVzdEluZm8ucGFyYW1ldGVyc1snYWNjZXNzX3Rva2VuJ10pIHtcclxuICAgICAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sodGhpcy5hZGFsLl9nZXRJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5FUlJPUl9ERVNDUklQVElPTiksIHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2FjY2Vzc190b2tlbiddKTtcclxuICAgICAgICAgICAgICByZXR1cm4gbmV4dEhhbmRsZXIoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydpZF90b2tlbiddKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrKHRoaXMuYWRhbC5fZ2V0SXRlbSh0aGlzLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuRVJST1JfREVTQ1JJUFRJT04pLCByZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydpZF90b2tlbiddKTtcclxuICAgICAgICAgICAgICByZXR1cm4gbmV4dEhhbmRsZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBub3JtYWwgZnVsbCBsb2dpbiByZWRpcmVjdCBoYXBwZW5lZCBvbiB0aGUgcGFnZVxyXG4gICAgICAgICAgdGhpcy51cGRhdGVEYXRhRnJvbUNhY2hlKHRoaXMuYWRhbC5jb25maWcubG9naW5SZXNvdXJjZSk7XHJcbiAgICAgICAgICBpZiAodGhpcy5vYXV0aERhdGEudXNlck5hbWUpIHtcclxuICAgICAgICAgICAgLy9JRHRva2VuIGlzIGFkZGVkIGFzIHRva2VuIGZvciB0aGUgYXBwXHJcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHNlbGYudXBkYXRlRGF0YUZyb21DYWNoZShzZWxmLmFkYWwuY29uZmlnLmxvZ2luUmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAvLyByZWRpcmVjdCB0byBsb2dpbiByZXF1ZXN0ZWQgcGFnZVxyXG4gICAgICAgICAgICB2YXIgbG9naW5TdGFydFBhZ2UgPSBzZWxmLmFkYWwuX2dldEl0ZW0oc2VsZi5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLlNUQVJUX1BBR0UpO1xyXG4gICAgICAgICAgICBpZiAobG9naW5TdGFydFBhZ2UpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVkaXJlY3RIYW5kbGVyKGxvZ2luU3RhcnRQYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBUT0RPOiBicm9hZGNhc3QgbG9naW4gc3VjY2Vzcz9cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IGJyb2FkY2FzdCBsb2dpbiBmYWlsdXJlPyAocmVhc29uOiB0aGlzLmFkYWwuX2dldEl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLkVSUk9SX0RFU0NSSVBUSU9OKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBpc05vdENhbGxiYWNrSGFuZGxlcigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbG9naW5IYW5kbGVyKHBhdGg6IHN0cmluZywgcmVkaXJlY3RIYW5kbGVyOiBGdW5jdGlvbiwgaGFuZGxlcjogRnVuY3Rpb24pIHtcclxuICAgIHRoaXMuYWRhbC5pbmZvKCdMb2dpbiBldmVudCBmb3I6JyArIHBhdGgpO1xyXG5cclxuICAgIGlmICh0aGlzLmFkYWwuY29uZmlnICYmIHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCkge1xyXG4gICAgICByZXR1cm4gcmVkaXJlY3RIYW5kbGVyKHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBkaXJlY3RseSBzdGFydCBsb2dpbiBmbG93XHJcbiAgICAgIHRoaXMuYWRhbC5fc2F2ZUl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLlNUQVJUX1BBR0UsIHBhdGgpO1xyXG4gICAgICB0aGlzLmFkYWwuaW5mbygnU3RhcnQgbG9naW4gYXQ6JyArIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgICAgLy8gVE9ETzogYnJvYWRjYXN0IGxvZ2luIHJlZGlyZWN0P1xyXG4gICAgICB0aGlzLmFkYWwubG9naW4oKTtcclxuICAgICAgcmV0dXJuIGhhbmRsZXIoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbmZpZygpOiBBZGFsQ29uZmlnIHtcclxuICAgIHJldHVybiB0aGlzLmFkYWwuY29uZmlnO1xyXG4gIH1cclxuXHJcbiAgbG9naW4oKSB7XHJcbiAgICB0aGlzLmFkYWwubG9naW4oKTtcclxuICB9XHJcblxyXG4gIGxvZ2luSW5Qcm9ncmVzcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmFkYWwubG9naW5JblByb2dyZXNzKCk7XHJcbiAgfVxyXG5cclxuICBsb2dPdXQoKSB7XHJcbiAgICB0aGlzLmFkYWwubG9nT3V0KCk7XHJcbiAgfVxyXG5cclxuICBnZXRDYWNoZWRUb2tlbihyZXNvdXJjZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLmFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xyXG4gIH1cclxuXHJcbiAgZ2V0VXNlckluZm8oKTogYW55IHtcclxuICAgIHJldHVybiB0aGlzLm9hdXRoRGF0YTtcclxuICB9XHJcblxyXG4gIGFjcXVpcmVUb2tlbihyZXNvdXJjZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIC8vIGF1dG9tYXRlZCB0b2tlbiByZXF1ZXN0IGNhbGxcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5hZGFsLmFjcXVpcmVUb2tlbihyZXNvdXJjZSwgKGVycm9yOiBzdHJpbmcsIHRva2VuT3V0OiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJlc29sdmUodG9rZW5PdXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldFVzZXIoKTogUHJvbWlzZTxVc2VyPiB7XHJcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8VXNlcj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmFkYWwuZ2V0VXNlcigoZXJyb3I6IHN0cmluZywgdXNlcjogVXNlcikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBnZXRSZXNvdXJjZUZvckVuZHBvaW50KGVuZHBvaW50OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KGVuZHBvaW50KTtcclxuICB9XHJcblxyXG4gIGNsZWFyQ2FjaGUoKSB7XHJcbiAgICB0aGlzLmFkYWwuY2xlYXJDYWNoZSgpO1xyXG4gIH1cclxuXHJcbiAgY2xlYXJDYWNoZUZvclJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWRhbC5jbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpO1xyXG4gIH1cclxuXHJcbiAgaW5mbyhtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWRhbC5pbmZvKG1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgdmVyYm9zZShtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWRhbC52ZXJib3NlKG1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcblxyXG4gIGlzQXV0aGVudGljYXRlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLm9hdXRoRGF0YS5pc0F1dGhlbnRpY2F0ZWQ7XHJcbiAgfVxyXG59XG5AaW5qZWN0KEF1cmVsaWFBZGFsTWFuYWdlcilcclxuZXhwb3J0IGNsYXNzIEF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCB7XHJcbiAgXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhdXJlbGlhQWRhbDogQXVyZWxpYUFkYWxNYW5hZ2VyKSB7XHJcbiAgICBcclxuICB9XHJcblxyXG4gIHJ1bihyb3V0aW5nQ29udGV4dDogTmF2aWdhdGlvbkluc3RydWN0aW9uLCBuZXh0OiBhbnkpOiB2b2lkIHtcclxuICAgIGxldCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYXVyZWxpYUFkYWwuaGFzaEhhbmRsZXIoaGFzaCwgKHVybDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIC8vIFdhcyBjYWxsYmFja1xyXG4gICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IFJlZGlyZWN0KHVybCkpO1xyXG4gICAgfSwgKCkgPT4ge1xyXG4gICAgICAvLyBXYXMgbm90IGNhbGxiYWNrXHJcbiAgICAgIGxldCBsb2dpblJvdXRlID0gJyc7IC8vIFRPRE86IGdldCBsb2dpbiB1cmwgZnJvbSBhdXJlbGlhQWRhbFxyXG5cclxuICAgICAgaWYgKHJvdXRpbmdDb250ZXh0LmdldEFsbEluc3RydWN0aW9ucygpLnNvbWUoaSA9PiAhIWkuY29uZmlnLnNldHRpbmdzLnJlcXVpcmVBZGFsTG9naW4pKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmF1cmVsaWFBZGFsLmlzQXV0aGVudGljYXRlZCgpKSB7XHJcbiAgICAgICAgICAvLyBOb3QgbG9nZ2VkIGluLCByZWRpcmVjdCB0byBsb2dpbiByb3V0ZVxyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuYXVyZWxpYUFkYWwubG9naW5IYW5kbGVyKHJvdXRpbmdDb250ZXh0LmZyYWdtZW50LCAodXJsOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5leHQuY2FuY2VsKG5ldyBSZWRpcmVjdCh1cmwpKTtcclxuICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5leHQuY2FuY2VsKCdsb2dpbiByZWRpcmVjdCcpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuYXVyZWxpYUFkYWwuaXNBdXRoZW50aWNhdGVkKCkgJiYgcm91dGluZ0NvbnRleHQuZ2V0QWxsSW5zdHJ1Y3Rpb25zKCkuc29tZShpID0+IGkuZnJhZ21lbnQgPT0gbG9naW5Sb3V0ZSkpIHtcclxuICAgICAgICAvLyBMb2dnZWQgaW4sIGN1cnJlbnQgcm91dGUgaXMgdGhlIGxvZ2luIHJvdXRlXHJcbiAgICAgICAgbGV0IGxvZ2luUmVkaXJlY3QgPSAnJztcclxuICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IFJlZGlyZWN0KGxvZ2luUmVkaXJlY3QpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5leHQoKTtcclxuICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBuZXh0KCk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxufVxuQGluamVjdChIdHRwQ2xpZW50LCBBdXJlbGlhQWRhbE1hbmFnZXIpXHJcbmV4cG9ydCBjbGFzcyBBdXJlbGlhQWRhbEZldGNoQ29uZmlnIHtcclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGh0dHBDbGllbnQ6IEh0dHBDbGllbnQsIHByaXZhdGUgYXVyZWxpYUFkYWw6IEF1cmVsaWFBZGFsTWFuYWdlcikge1xyXG5cclxuICB9XHJcblxyXG4gIGNvbmZpZ3VyZSgpIHtcclxuICAgIGxldCBhdXJlbGlhQWRhbCA9IHRoaXMuYXVyZWxpYUFkYWw7XHJcblxyXG4gICAgdGhpcy5odHRwQ2xpZW50LmNvbmZpZ3VyZSgoaHR0cENvbmZpZzogSHR0cENsaWVudENvbmZpZ3VyYXRpb24pID0+IHtcclxuICAgICAgaHR0cENvbmZpZ1xyXG4gICAgICAgIC53aXRoRGVmYXVsdHMoe1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAud2l0aEludGVyY2VwdG9yKHtcclxuICAgICAgICAgIGFzeW5jIHJlcXVlc3QocmVxdWVzdCk6IFByb21pc2U8UmVxdWVzdD4ge1xyXG4gICAgICAgICAgICBsZXQgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlcXVlc3QudXJsKTtcclxuICAgICAgICAgICAgaWYgKHJlc291cmNlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHRva2VuU3RvcmVkID0gYXVyZWxpYUFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICBsZXQgaXNFbmRwb2ludCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRva2VuU3RvcmVkKSB7XHJcbiAgICAgICAgICAgICAgYXVyZWxpYUFkYWwuaW5mbygnVG9rZW4gaXMgYXZhbGlhYmxlIGZvciB0aGlzIHVybCAnICsgcmVxdWVzdC51cmwpO1xyXG4gICAgICAgICAgICAgIC8vIGNoZWNrIGVuZHBvaW50IG1hcHBpbmcgaWYgcHJvdmlkZWRcclxuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuYXBwZW5kKCdBdXRob3JpemF0aW9uJywgJ0JlYXJlciAnICsgdG9rZW5TdG9yZWQpO1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlmIChhdXJlbGlhQWRhbC5jb25maWcpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGVuZHBvaW50VXJsIGluIGF1cmVsaWFBZGFsLmNvbmZpZygpLmVuZHBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC51cmwuaW5kZXhPZihlbmRwb2ludFVybCkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzRW5kcG9pbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIENhbmNlbCByZXF1ZXN0IGlmIGxvZ2luIGlzIHN0YXJ0aW5nXHJcbiAgICAgICAgICAgICAgaWYgKGF1cmVsaWFBZGFsLmxvZ2luSW5Qcm9ncmVzcygpKSB7XHJcbiAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdsb2dpbiBhbHJlYWR5IHN0YXJ0ZWQuJyk7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2xvZ2luIGFscmVhZHkgc3RhcnRlZCcpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXVyZWxpYUFkYWwuY29uZmlnICYmIGlzRW5kcG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGV4dGVybmFsIGVuZHBvaW50c1xyXG4gICAgICAgICAgICAgICAgLy8gZGVsYXllZCByZXF1ZXN0IHRvIHJldHVybiBhZnRlciBpZnJhbWUgY29tcGxldGVzXHJcbiAgICAgICAgICAgICAgICBsZXQgdG9rZW4gPSBhd2FpdCBhdXJlbGlhQWRhbC5hY3F1aXJlVG9rZW4ocmVzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLnZlcmJvc2UoJ1Rva2VuIGlzIGF2YWxpYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLnNldCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHRva2VuKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHJlc3BvbnNlRXJyb3IocmVqZWN0aW9uKTogUmVzcG9uc2Uge1xyXG4gICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdHZXR0aW5nIGVycm9yIGluIHRoZSByZXNwb25zZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlamVjdGlvbiAmJiByZWplY3Rpb24uc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlamVjdGlvbi5jb25maWcudXJsKTtcclxuICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5jbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgIC8vIFRPRE86IGJyb2FkY2FzdCBub3RBdXRob3JpemVkP1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0aW9uO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKGZyYW1ld29ya0NvbmZpZzogRnJhbWV3b3JrQ29uZmlndXJhdGlvbiwgY29uZmlnOiBBdXJlbGlhQWRhbENvbmZpZykge1xyXG4gIGxldCBhdXJlbGlhQWRhbDogQXVyZWxpYUFkYWxNYW5hZ2VyID0gZnJhbWV3b3JrQ29uZmlnLmNvbnRhaW5lci5nZXQoQXVyZWxpYUFkYWxNYW5hZ2VyKTtcclxuXHJcbiAgYXVyZWxpYUFkYWwuY29uZmlndXJlKGNvbmZpZyk7XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
