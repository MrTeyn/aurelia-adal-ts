"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
    var c = arguments.length,
        r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
        d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = undefined && undefined.__metadata || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, Promise, generator) {
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
define(["require", "exports", 'adal', 'aurelia-framework', 'aurelia-router', 'aurelia-fetch-client'], function (require, exports, Adal, aurelia_framework_1, aurelia_router_1, aurelia_fetch_client_1) {
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
            key: "configure",
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
            key: "updateDataFromCache",
            value: function updateDataFromCache(resource) {
                var token = this.adal.getCachedToken(resource);
                this.oauthData.isAuthenticated = token !== null && token.length > 0;
                var user = this.adal.getCachedUser() || { userName: '', profile: null };
                this.oauthData.userName = user.userName;
                this.oauthData.profile = user.profile;
                this.oauthData.loginError = this.adal.getLoginError();
            }
        }, {
            key: "hashHandler",
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
            key: "loginHandler",
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
            key: "config",
            value: function config() {
                return this.adal.config;
            }
        }, {
            key: "login",
            value: function login() {
                this.adal.login();
            }
        }, {
            key: "loginInProgress",
            value: function loginInProgress() {
                return this.adal.loginInProgress();
            }
        }, {
            key: "logOut",
            value: function logOut() {
                this.adal.logOut();
            }
        }, {
            key: "getCachedToken",
            value: function getCachedToken(resource) {
                return this.adal.getCachedToken(resource);
            }
        }, {
            key: "getUserInfo",
            value: function getUserInfo() {
                return this.oauthData;
            }
        }, {
            key: "acquireToken",
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
            key: "getUser",
            value: function getUser() {
                return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$3$0() {
                    return regeneratorRuntime.wrap(function callee$3$0$(context$4$0) {
                        var _this3 = this;

                        while (1) switch (context$4$0.prev = context$4$0.next) {
                            case 0:
                                context$4$0.next = 2;
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
                                return context$4$0.abrupt("return", context$4$0.sent);

                            case 3:
                            case "end":
                                return context$4$0.stop();
                        }
                    }, callee$3$0, this);
                }));
            }
        }, {
            key: "getResourceForEndpoint",
            value: function getResourceForEndpoint(endpoint) {
                return this.adal.getResourceForEndpoint(endpoint);
            }
        }, {
            key: "clearCache",
            value: function clearCache() {
                this.adal.clearCache();
            }
        }, {
            key: "clearCacheForResource",
            value: function clearCacheForResource(resource) {
                this.adal.clearCacheForResource(resource);
            }
        }, {
            key: "info",
            value: function info(message) {
                this.adal.info(message);
            }
        }, {
            key: "verbose",
            value: function verbose(message) {
                this.adal.verbose(message);
            }
        }, {
            key: "isAuthenticated",
            value: function isAuthenticated() {
                return this.oauthData.isAuthenticated;
            }
        }]);

        return AureliaAdalManager;
    })();
    AureliaAdalManager = __decorate([aurelia_framework_1.inject(Adal), __metadata('design:paramtypes', [Object])], AureliaAdalManager);
    exports.AureliaAdalManager = AureliaAdalManager;
    var AureliaAdalAuthorizeStep = (function () {
        function AureliaAdalAuthorizeStep(aureliaAdal) {
            _classCallCheck(this, AureliaAdalAuthorizeStep);

            this.aureliaAdal = aureliaAdal;
        }

        _createClass(AureliaAdalAuthorizeStep, [{
            key: "run",
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
    exports.AureliaAdalAuthorizeStep = AureliaAdalAuthorizeStep;
    var AureliaAdalFetchConfig = (function () {
        function AureliaAdalFetchConfig(httpClient, aureliaAdal) {
            _classCallCheck(this, AureliaAdalFetchConfig);

            this.httpClient = httpClient;
            this.aureliaAdal = aureliaAdal;
        }

        _createClass(AureliaAdalFetchConfig, [{
            key: "configure",
            value: function configure() {
                var aureliaAdal = this.aureliaAdal;
                this.httpClient.configure(function (httpConfig) {
                    httpConfig.withDefaults({
                        headers: {
                            'Accept': 'application/json'
                        }
                    }).withInterceptor({
                        request: function request(_request) {
                            return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$5$0() {
                                var resource, tokenStored, isEndpoint, endpointUrl, token;
                                return regeneratorRuntime.wrap(function callee$5$0$(context$6$0) {
                                    while (1) switch (context$6$0.prev = context$6$0.next) {
                                        case 0:
                                            resource = aureliaAdal.getResourceForEndpoint(_request.url);

                                            if (!(resource == null)) {
                                                context$6$0.next = 3;
                                                break;
                                            }

                                            return context$6$0.abrupt("return", _request);

                                        case 3:
                                            tokenStored = aureliaAdal.getCachedToken(resource);
                                            isEndpoint = false;

                                            if (!tokenStored) {
                                                context$6$0.next = 11;
                                                break;
                                            }

                                            aureliaAdal.info('Token is avaliable for this url ' + _request.url);
                                            _request.headers.append('Authorization', 'Bearer ' + tokenStored);
                                            return context$6$0.abrupt("return", _request);

                                        case 11:
                                            if (aureliaAdal.config) {
                                                for (endpointUrl in aureliaAdal.config().endpoints) {
                                                    if (_request.url.indexOf(endpointUrl) > -1) {
                                                        isEndpoint = true;
                                                    }
                                                }
                                            }

                                            if (!aureliaAdal.loginInProgress()) {
                                                context$6$0.next = 17;
                                                break;
                                            }

                                            aureliaAdal.info('login already started.');
                                            throw new Error('login already started');

                                        case 17:
                                            if (!(aureliaAdal.config && isEndpoint)) {
                                                context$6$0.next = 23;
                                                break;
                                            }

                                            context$6$0.next = 20;
                                            return aureliaAdal.acquireToken(resource);

                                        case 20:
                                            token = context$6$0.sent;

                                            aureliaAdal.verbose('Token is avaliable');
                                            _request.headers.set('Authorization', 'Bearer ' + token);

                                        case 23:
                                            return context$6$0.abrupt("return", _request);

                                        case 24:
                                        case "end":
                                            return context$6$0.stop();
                                    }
                                }, callee$5$0, this);
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
    exports.AureliaAdalFetchConfig = AureliaAdalFetchConfig;
    function configure(frameworkConfig, config) {
        var aureliaAdal = frameworkConfig.container.get(AureliaAdalManager);
        aureliaAdal.configure(config);
    }
    exports.configure = configure;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1cmVsaWEtYWRhbC5qcyIsImF1cmVsaWEtYWRhbC50cyJdLCJuYW1lcyI6WyJBdXJlbGlhQWRhbE1hbmFnZXIiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY29uc3RydWN0b3IiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY29uZmlndXJlIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLnVwZGF0ZURhdGFGcm9tQ2FjaGUiLCJBdXJlbGlhQWRhbE1hbmFnZXIuaGFzaEhhbmRsZXIiLCJBdXJlbGlhQWRhbE1hbmFnZXIubG9naW5IYW5kbGVyIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmNvbmZpZyIsIkF1cmVsaWFBZGFsTWFuYWdlci5sb2dpbiIsIkF1cmVsaWFBZGFsTWFuYWdlci5sb2dpbkluUHJvZ3Jlc3MiLCJBdXJlbGlhQWRhbE1hbmFnZXIubG9nT3V0IiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldENhY2hlZFRva2VuIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldFVzZXJJbmZvIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmFjcXVpcmVUb2tlbiIsIkF1cmVsaWFBZGFsTWFuYWdlci5nZXRVc2VyIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldFJlc291cmNlRm9yRW5kcG9pbnQiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY2xlYXJDYWNoZSIsIkF1cmVsaWFBZGFsTWFuYWdlci5jbGVhckNhY2hlRm9yUmVzb3VyY2UiLCJBdXJlbGlhQWRhbE1hbmFnZXIuaW5mbyIsIkF1cmVsaWFBZGFsTWFuYWdlci52ZXJib3NlIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmlzQXV0aGVudGljYXRlZCIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcC5jb25zdHJ1Y3RvciIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcC5ydW4iLCJBdXJlbGlhQWRhbEZldGNoQ29uZmlnIiwiQXVyZWxpYUFkYWxGZXRjaENvbmZpZy5jb25zdHJ1Y3RvciIsIkF1cmVsaWFBZGFsRmV0Y2hDb25maWcuY29uZmlndXJlIiwiQXVyZWxpYUFkYWxGZXRjaENvbmZpZy5jb25maWd1cmUucmVxdWVzdCIsIkF1cmVsaWFBZGFsRmV0Y2hDb25maWcuY29uZmlndXJlLnJlc3BvbnNlRXJyb3IiLCJjb25maWd1cmUiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUksVUFBVSxHQUFHLEFBQUMsYUFBUSxVQUFLLFVBQVUsSUFBSyxVQUFVLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtBQUNuRixRQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTTtRQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUk7UUFBRSxDQUFDLENBQUM7QUFDN0gsUUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUMxSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQSxJQUFLLENBQUMsQ0FBQztBQUNsSixXQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJ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QSxHQUF1QkEsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxDQUFDQTtBQUV4RkEsbUJBQVdBLENBQUNBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO0tBQy9CQTtBQUplLFdBQUEsQ0FBQSxTQUFTLEdBQUEsU0FJeEIsQ0FBQTtDRDNCQSxDQUFDLENBQUMiLCJmaWxlIjoiYXVyZWxpYS1hZGFsLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fbWV0YWRhdGEgPSAodGhpcyAmJiB0aGlzLl9fbWV0YWRhdGEpIHx8IGZ1bmN0aW9uIChrLCB2KSB7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0Lm1ldGFkYXRhID09PSBcImZ1bmN0aW9uXCIpIHJldHVybiBSZWZsZWN0Lm1ldGFkYXRhKGssIHYpO1xufTtcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFByb21pc2UsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGdlbmVyYXRvciA9IGdlbmVyYXRvci5jYWxsKHRoaXNBcmcsIF9hcmd1bWVudHMpO1xuICAgICAgICBmdW5jdGlvbiBjYXN0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFByb21pc2UgJiYgdmFsdWUuY29uc3RydWN0b3IgPT09IFByb21pc2UgPyB2YWx1ZSA6IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfVxuICAgICAgICBmdW5jdGlvbiBvbmZ1bGZpbGwodmFsdWUpIHsgdHJ5IHsgc3RlcChcIm5leHRcIiwgdmFsdWUpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIG9ucmVqZWN0KHZhbHVlKSB7IHRyeSB7IHN0ZXAoXCJ0aHJvd1wiLCB2YWx1ZSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcCh2ZXJiLCB2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGdlbmVyYXRvclt2ZXJiXSh2YWx1ZSk7XG4gICAgICAgICAgICByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IGNhc3QocmVzdWx0LnZhbHVlKS50aGVuKG9uZnVsZmlsbCwgb25yZWplY3QpO1xuICAgICAgICB9XG4gICAgICAgIHN0ZXAoXCJuZXh0XCIsIHZvaWQgMCk7XG4gICAgfSk7XG59O1xuZGVmaW5lKFtcInJlcXVpcmVcIiwgXCJleHBvcnRzXCIsICdhZGFsJywgJ2F1cmVsaWEtZnJhbWV3b3JrJywgJ2F1cmVsaWEtcm91dGVyJywgJ2F1cmVsaWEtZmV0Y2gtY2xpZW50J10sIGZ1bmN0aW9uIChyZXF1aXJlLCBleHBvcnRzLCBBZGFsLCBhdXJlbGlhX2ZyYW1ld29ya18xLCBhdXJlbGlhX3JvdXRlcl8xLCBhdXJlbGlhX2ZldGNoX2NsaWVudF8xKSB7XG4gICAgbGV0IEF1cmVsaWFBZGFsTWFuYWdlciA9IGNsYXNzIHtcbiAgICAgICAgY29uc3RydWN0b3IoYWRhbENvbnN0cnVjdG9yKSB7XG4gICAgICAgICAgICB0aGlzLmFkYWxDb25zdHJ1Y3RvciA9IGFkYWxDb25zdHJ1Y3RvcjtcbiAgICAgICAgICAgIHRoaXMub2F1dGhEYXRhID0ge1xuICAgICAgICAgICAgICAgIGlzQXV0aGVudGljYXRlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdXNlck5hbWU6ICcnLFxuICAgICAgICAgICAgICAgIGxvZ2luRXJyb3I6ICcnLFxuICAgICAgICAgICAgICAgIHByb2ZpbGU6IG51bGxcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlndXJlKGNvbmZpZykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBsZXQgY29uZmlnT3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMudGVuYW50ID0gY29uZmlnLnRlbmFudDtcbiAgICAgICAgICAgICAgICBjb25maWdPcHRpb25zLmNsaWVudElkID0gY29uZmlnLmNsaWVudElkO1xuICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMuZW5kcG9pbnRzID0gY29uZmlnLmVuZHBvaW50cztcbiAgICAgICAgICAgICAgICBsZXQgZXhpc3RpbmdIYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XG4gICAgICAgICAgICAgICAgbGV0IHBhdGhEZWZhdWx0ID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXN0aW5nSGFzaCkge1xuICAgICAgICAgICAgICAgICAgICBwYXRoRGVmYXVsdCA9IHBhdGhEZWZhdWx0LnJlcGxhY2UoZXhpc3RpbmdIYXNoLCAnJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMucmVkaXJlY3RVcmkgPSBjb25maWdPcHRpb25zLnJlZGlyZWN0VXJpIHx8IHBhdGhEZWZhdWx0O1xuICAgICAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMucG9zdExvZ291dFJlZGlyZWN0VXJpID0gY29uZmlnT3B0aW9ucy5wb3N0TG9nb3V0UmVkaXJlY3RVcmkgfHwgcGF0aERlZmF1bHQ7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGFsID0gdGhpcy5hZGFsQ29uc3RydWN0b3IuaW5qZWN0KGNvbmZpZ09wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5BdXRoZW50aWNhdGlvbkNvbnRleHQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFkYWw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ2FjaGUodGhpcy5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdXBkYXRlRGF0YUZyb21DYWNoZShyZXNvdXJjZSkge1xuICAgICAgICAgICAgdmFyIHRva2VuID0gdGhpcy5hZGFsLmdldENhY2hlZFRva2VuKHJlc291cmNlKTtcbiAgICAgICAgICAgIHRoaXMub2F1dGhEYXRhLmlzQXV0aGVudGljYXRlZCA9IHRva2VuICE9PSBudWxsICYmIHRva2VuLmxlbmd0aCA+IDA7XG4gICAgICAgICAgICB2YXIgdXNlciA9IHRoaXMuYWRhbC5nZXRDYWNoZWRVc2VyKCkgfHwgeyB1c2VyTmFtZTogJycsIHByb2ZpbGU6IG51bGwgfTtcbiAgICAgICAgICAgIHRoaXMub2F1dGhEYXRhLnVzZXJOYW1lID0gdXNlci51c2VyTmFtZTtcbiAgICAgICAgICAgIHRoaXMub2F1dGhEYXRhLnByb2ZpbGUgPSB1c2VyLnByb2ZpbGU7XG4gICAgICAgICAgICB0aGlzLm9hdXRoRGF0YS5sb2dpbkVycm9yID0gdGhpcy5hZGFsLmdldExvZ2luRXJyb3IoKTtcbiAgICAgICAgfVxuICAgICAgICBoYXNoSGFuZGxlcihoYXNoLCByZWRpcmVjdEhhbmRsZXIsIGlzTm90Q2FsbGJhY2tIYW5kbGVyLCBuZXh0SGFuZGxlcikge1xuICAgICAgICAgICAgaWYgKHRoaXMuYWRhbC5pc0NhbGxiYWNrKGhhc2gpKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlcXVlc3RJbmZvID0gdGhpcy5hZGFsLmdldFJlcXVlc3RJbmZvKGhhc2gpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5zYXZlVG9rZW5Gcm9tSGFzaChyZXF1ZXN0SW5mbyk7XG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlICE9PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLkxPR0lOKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayA9IHdpbmRvdy5wYXJlbnQuQXV0aGVudGljYXRpb25Db250ZXh0KCkuY2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSA9PT0gdGhpcy5hZGFsLlJFUVVFU1RfVFlQRS5SRU5FV19UT0tFTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrID0gd2luZG93LnBhcmVudC5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbcmVxdWVzdEluZm8uc3RhdGVSZXNwb25zZV07XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnN0YXRlTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmFkYWwuY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSA9PT0gdGhpcy5hZGFsLlJFUVVFU1RfVFlQRS5SRU5FV19UT0tFTikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydhY2Nlc3NfdG9rZW4nXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sodGhpcy5hZGFsLl9nZXRJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5FUlJPUl9ERVNDUklQVElPTiksIHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2FjY2Vzc190b2tlbiddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2lkX3Rva2VuJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrKHRoaXMuYWRhbC5fZ2V0SXRlbSh0aGlzLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuRVJST1JfREVTQ1JJUFRJT04pLCByZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydpZF90b2tlbiddKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVEYXRhRnJvbUNhY2hlKHRoaXMuYWRhbC5jb25maWcubG9naW5SZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vYXV0aERhdGEudXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi51cGRhdGVEYXRhRnJvbUNhY2hlKHNlbGYuYWRhbC5jb25maWcubG9naW5SZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvZ2luU3RhcnRQYWdlID0gc2VsZi5hZGFsLl9nZXRJdGVtKHNlbGYuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5TVEFSVF9QQUdFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobG9naW5TdGFydFBhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlZGlyZWN0SGFuZGxlcihsb2dpblN0YXJ0UGFnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXNOb3RDYWxsYmFja0hhbmRsZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsb2dpbkhhbmRsZXIocGF0aCwgcmVkaXJlY3RIYW5kbGVyLCBoYW5kbGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFkYWwuaW5mbygnTG9naW4gZXZlbnQgZm9yOicgKyBwYXRoKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmFkYWwuY29uZmlnICYmIHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCkge1xuICAgICAgICAgICAgICAgIHJldHVybiByZWRpcmVjdEhhbmRsZXIodGhpcy5hZGFsLmNvbmZpZy5sb2NhbExvZ2luVXJsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5fc2F2ZUl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLlNUQVJUX1BBR0UsIHBhdGgpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5pbmZvKCdTdGFydCBsb2dpbiBhdDonICsgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5sb2dpbigpO1xuICAgICAgICAgICAgICAgIHJldHVybiBoYW5kbGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlnKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRhbC5jb25maWc7XG4gICAgICAgIH1cbiAgICAgICAgbG9naW4oKSB7XG4gICAgICAgICAgICB0aGlzLmFkYWwubG9naW4oKTtcbiAgICAgICAgfVxuICAgICAgICBsb2dpbkluUHJvZ3Jlc3MoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hZGFsLmxvZ2luSW5Qcm9ncmVzcygpO1xuICAgICAgICB9XG4gICAgICAgIGxvZ091dCgpIHtcbiAgICAgICAgICAgIHRoaXMuYWRhbC5sb2dPdXQoKTtcbiAgICAgICAgfVxuICAgICAgICBnZXRDYWNoZWRUb2tlbihyZXNvdXJjZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRhbC5nZXRDYWNoZWRUb2tlbihyZXNvdXJjZSk7XG4gICAgICAgIH1cbiAgICAgICAgZ2V0VXNlckluZm8oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYXV0aERhdGE7XG4gICAgICAgIH1cbiAgICAgICAgYWNxdWlyZVRva2VuKHJlc291cmNlKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5hY3F1aXJlVG9rZW4ocmVzb3VyY2UsIChlcnJvciwgdG9rZW5PdXQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbk91dCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGdldFVzZXIoKSB7XG4gICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geWllbGQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkYWwuZ2V0VXNlcigoZXJyb3IsIHVzZXIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGdldFJlc291cmNlRm9yRW5kcG9pbnQoZW5kcG9pbnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmFkYWwuZ2V0UmVzb3VyY2VGb3JFbmRwb2ludChlbmRwb2ludCk7XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJDYWNoZSgpIHtcbiAgICAgICAgICAgIHRoaXMuYWRhbC5jbGVhckNhY2hlKCk7XG4gICAgICAgIH1cbiAgICAgICAgY2xlYXJDYWNoZUZvclJlc291cmNlKHJlc291cmNlKSB7XG4gICAgICAgICAgICB0aGlzLmFkYWwuY2xlYXJDYWNoZUZvclJlc291cmNlKHJlc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICBpbmZvKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMuYWRhbC5pbmZvKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHZlcmJvc2UobWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy5hZGFsLnZlcmJvc2UobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgaXNBdXRoZW50aWNhdGVkKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2F1dGhEYXRhLmlzQXV0aGVudGljYXRlZDtcbiAgICAgICAgfVxuICAgIH07XG4gICAgQXVyZWxpYUFkYWxNYW5hZ2VyID0gX19kZWNvcmF0ZShbXG4gICAgICAgIGF1cmVsaWFfZnJhbWV3b3JrXzEuaW5qZWN0KEFkYWwpLCBcbiAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnBhcmFtdHlwZXMnLCBbT2JqZWN0XSlcbiAgICBdLCBBdXJlbGlhQWRhbE1hbmFnZXIpO1xuICAgIGV4cG9ydHMuQXVyZWxpYUFkYWxNYW5hZ2VyID0gQXVyZWxpYUFkYWxNYW5hZ2VyO1xuICAgIGxldCBBdXJlbGlhQWRhbEF1dGhvcml6ZVN0ZXAgPSBjbGFzcyB7XG4gICAgICAgIGNvbnN0cnVjdG9yKGF1cmVsaWFBZGFsKSB7XG4gICAgICAgICAgICB0aGlzLmF1cmVsaWFBZGFsID0gYXVyZWxpYUFkYWw7XG4gICAgICAgIH1cbiAgICAgICAgcnVuKHJvdXRpbmdDb250ZXh0LCBuZXh0KSB7XG4gICAgICAgICAgICBsZXQgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXVyZWxpYUFkYWwuaGFzaEhhbmRsZXIoaGFzaCwgKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgYXVyZWxpYV9yb3V0ZXJfMS5SZWRpcmVjdCh1cmwpKTtcbiAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgbG9naW5Sb3V0ZSA9ICcnO1xuICAgICAgICAgICAgICAgIGlmIChyb3V0aW5nQ29udGV4dC5nZXRBbGxJbnN0cnVjdGlvbnMoKS5zb21lKGkgPT4gISFpLmNvbmZpZy5zZXR0aW5ncy5yZXF1aXJlQWRhbExvZ2luKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYXVyZWxpYUFkYWwuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF1cmVsaWFBZGFsLmxvZ2luSGFuZGxlcihyb3V0aW5nQ29udGV4dC5mcmFnbWVudCwgKHVybCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgYXVyZWxpYV9yb3V0ZXJfMS5SZWRpcmVjdCh1cmwpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwoJ2xvZ2luIHJlZGlyZWN0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0aGlzLmF1cmVsaWFBZGFsLmlzQXV0aGVudGljYXRlZCgpICYmIHJvdXRpbmdDb250ZXh0LmdldEFsbEluc3RydWN0aW9ucygpLnNvbWUoaSA9PiBpLmZyYWdtZW50ID09IGxvZ2luUm91dGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBsb2dpblJlZGlyZWN0ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgYXVyZWxpYV9yb3V0ZXJfMS5SZWRpcmVjdChsb2dpblJlZGlyZWN0KSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgICAgICB9LCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBBdXJlbGlhQWRhbEF1dGhvcml6ZVN0ZXAgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgYXVyZWxpYV9mcmFtZXdvcmtfMS5pbmplY3QoQXVyZWxpYUFkYWxNYW5hZ2VyKSwgXG4gICAgICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgW0F1cmVsaWFBZGFsTWFuYWdlcl0pXG4gICAgXSwgQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwKTtcbiAgICBleHBvcnRzLkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCA9IEF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcDtcbiAgICBsZXQgQXVyZWxpYUFkYWxGZXRjaENvbmZpZyA9IGNsYXNzIHtcbiAgICAgICAgY29uc3RydWN0b3IoaHR0cENsaWVudCwgYXVyZWxpYUFkYWwpIHtcbiAgICAgICAgICAgIHRoaXMuaHR0cENsaWVudCA9IGh0dHBDbGllbnQ7XG4gICAgICAgICAgICB0aGlzLmF1cmVsaWFBZGFsID0gYXVyZWxpYUFkYWw7XG4gICAgICAgIH1cbiAgICAgICAgY29uZmlndXJlKCkge1xuICAgICAgICAgICAgbGV0IGF1cmVsaWFBZGFsID0gdGhpcy5hdXJlbGlhQWRhbDtcbiAgICAgICAgICAgIHRoaXMuaHR0cENsaWVudC5jb25maWd1cmUoKGh0dHBDb25maWcpID0+IHtcbiAgICAgICAgICAgICAgICBodHRwQ29uZmlnXG4gICAgICAgICAgICAgICAgICAgIC53aXRoRGVmYXVsdHMoe1xuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAud2l0aEludGVyY2VwdG9yKHtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlcXVlc3QudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzb3VyY2UgPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRva2VuU3RvcmVkID0gYXVyZWxpYUFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpc0VuZHBvaW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRva2VuU3RvcmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmluZm8oJ1Rva2VuIGlzIGF2YWxpYWJsZSBmb3IgdGhpcyB1cmwgJyArIHJlcXVlc3QudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmFwcGVuZCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHRva2VuU3RvcmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXVyZWxpYUFkYWwuY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBlbmRwb2ludFVybCBpbiBhdXJlbGlhQWRhbC5jb25maWcoKS5lbmRwb2ludHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC51cmwuaW5kZXhPZihlbmRwb2ludFVybCkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0VuZHBvaW50ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGF1cmVsaWFBZGFsLmxvZ2luSW5Qcm9ncmVzcygpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdsb2dpbiBhbHJlYWR5IHN0YXJ0ZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2xvZ2luIGFscmVhZHkgc3RhcnRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGF1cmVsaWFBZGFsLmNvbmZpZyAmJiBpc0VuZHBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdG9rZW4gPSB5aWVsZCBhdXJlbGlhQWRhbC5hY3F1aXJlVG9rZW4ocmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXVyZWxpYUFkYWwudmVyYm9zZSgnVG9rZW4gaXMgYXZhbGlhYmxlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuc2V0KCdBdXRob3JpemF0aW9uJywgJ0JlYXJlciAnICsgdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlRXJyb3IocmVqZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdHZXR0aW5nIGVycm9yIGluIHRoZSByZXNwb25zZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlamVjdGlvbiAmJiByZWplY3Rpb24uc3RhdHVzID09PSA0MDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlamVjdGlvbi5jb25maWcudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5jbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGlvbjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIEF1cmVsaWFBZGFsRmV0Y2hDb25maWcgPSBfX2RlY29yYXRlKFtcbiAgICAgICAgYXVyZWxpYV9mcmFtZXdvcmtfMS5pbmplY3QoYXVyZWxpYV9mZXRjaF9jbGllbnRfMS5IdHRwQ2xpZW50LCBBdXJlbGlhQWRhbE1hbmFnZXIpLCBcbiAgICAgICAgX19tZXRhZGF0YSgnZGVzaWduOnBhcmFtdHlwZXMnLCBbYXVyZWxpYV9mZXRjaF9jbGllbnRfMS5IdHRwQ2xpZW50LCBBdXJlbGlhQWRhbE1hbmFnZXJdKVxuICAgIF0sIEF1cmVsaWFBZGFsRmV0Y2hDb25maWcpO1xuICAgIGV4cG9ydHMuQXVyZWxpYUFkYWxGZXRjaENvbmZpZyA9IEF1cmVsaWFBZGFsRmV0Y2hDb25maWc7XG4gICAgZnVuY3Rpb24gY29uZmlndXJlKGZyYW1ld29ya0NvbmZpZywgY29uZmlnKSB7XG4gICAgICAgIGxldCBhdXJlbGlhQWRhbCA9IGZyYW1ld29ya0NvbmZpZy5jb250YWluZXIuZ2V0KEF1cmVsaWFBZGFsTWFuYWdlcik7XG4gICAgICAgIGF1cmVsaWFBZGFsLmNvbmZpZ3VyZShjb25maWcpO1xuICAgIH1cbiAgICBleHBvcnRzLmNvbmZpZ3VyZSA9IGNvbmZpZ3VyZTtcbn0pO1xuIiwiaW1wb3J0ICogYXMgQWRhbCBmcm9tICdhZGFsJztcbmltcG9ydCB7aW5qZWN0LEZyYW1ld29ya0NvbmZpZ3VyYXRpb259IGZyb20gJ2F1cmVsaWEtZnJhbWV3b3JrJztcbmltcG9ydCB7TmF2aWdhdGlvbkluc3RydWN0aW9uLFJlZGlyZWN0fSBmcm9tICdhdXJlbGlhLXJvdXRlcic7XG5pbXBvcnQge0h0dHBDbGllbnQsSHR0cENsaWVudENvbmZpZ3VyYXRpb259IGZyb20gJ2F1cmVsaWEtZmV0Y2gtY2xpZW50JztcblxuZXhwb3J0IGludGVyZmFjZSBBdXJlbGlhQWRhbENvbmZpZyB7XHJcbiAgICB0ZW5hbnQ/OiBzdHJpbmc7XHJcbiAgICBjbGllbnRJZD86IHN0cmluZztcclxuICAgIGVuZHBvaW50cz86IHsgW2lkOiBzdHJpbmddOiBzdHJpbmc7IH07XHJcbn1cbkBpbmplY3QoQWRhbClcclxuZXhwb3J0IGNsYXNzIEF1cmVsaWFBZGFsTWFuYWdlciB7XHJcblxyXG4gIHByaXZhdGUgYWRhbDogQWRhbDtcclxuICBwcml2YXRlIG9hdXRoRGF0YSA9IHtcclxuICAgIGlzQXV0aGVudGljYXRlZDogZmFsc2UsXHJcbiAgICB1c2VyTmFtZTogJycsXHJcbiAgICBsb2dpbkVycm9yOiAnJyxcclxuICAgIHByb2ZpbGU6IG51bGxcclxuICB9XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgYWRhbENvbnN0cnVjdG9yOiBBZGFsKSB7XHJcbiAgICBcclxuICB9XHJcbiAgXHJcbiAgY29uZmlndXJlKGNvbmZpZzogQXVyZWxpYUFkYWxDb25maWcpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGxldCBjb25maWdPcHRpb25zOiBBZGFsQ29uZmlnID0ge307XHJcbiAgICAgIFxyXG4gICAgICBjb25maWdPcHRpb25zLnRlbmFudCA9IGNvbmZpZy50ZW5hbnQ7XHJcbiAgICAgIGNvbmZpZ09wdGlvbnMuY2xpZW50SWQgPSBjb25maWcuY2xpZW50SWQ7XHJcbiAgICAgIGNvbmZpZ09wdGlvbnMuZW5kcG9pbnRzID0gY29uZmlnLmVuZHBvaW50cztcclxuXHJcbiAgICAgIC8vIHJlZGlyZWN0IGFuZCBsb2dvdXRfcmVkaXJlY3QgYXJlIHNldCB0byBjdXJyZW50IGxvY2F0aW9uIGJ5IGRlZmF1bHRcclxuICAgICAgbGV0IGV4aXN0aW5nSGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xyXG4gICAgICBsZXQgcGF0aERlZmF1bHQgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcclxuICAgICAgaWYgKGV4aXN0aW5nSGFzaCkge1xyXG4gICAgICAgIHBhdGhEZWZhdWx0ID0gcGF0aERlZmF1bHQucmVwbGFjZShleGlzdGluZ0hhc2gsICcnKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgY29uZmlnT3B0aW9ucy5yZWRpcmVjdFVyaSA9IGNvbmZpZ09wdGlvbnMucmVkaXJlY3RVcmkgfHwgcGF0aERlZmF1bHQ7XHJcbiAgICAgIGNvbmZpZ09wdGlvbnMucG9zdExvZ291dFJlZGlyZWN0VXJpID0gY29uZmlnT3B0aW9ucy5wb3N0TG9nb3V0UmVkaXJlY3RVcmkgfHwgcGF0aERlZmF1bHQ7XHJcblxyXG4gICAgICB0aGlzLmFkYWwgPSB0aGlzLmFkYWxDb25zdHJ1Y3Rvci5pbmplY3QoY29uZmlnT3B0aW9ucyk7XHJcbiAgICAgIFxyXG4gICAgICB3aW5kb3cuQXV0aGVudGljYXRpb25Db250ZXh0ID0gKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFkYWw7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIHRoaXMudXBkYXRlRGF0YUZyb21DYWNoZSh0aGlzLmFkYWwuY29uZmlnLmxvZ2luUmVzb3VyY2UpO1xyXG4gICAgfVxyXG4gICAgY2F0Y2ggKGUpIHtcclxuICAgICAgY29uc29sZS5sb2coZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB1cGRhdGVEYXRhRnJvbUNhY2hlKHJlc291cmNlOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIHZhciB0b2tlbiA9IHRoaXMuYWRhbC5nZXRDYWNoZWRUb2tlbihyZXNvdXJjZSk7XHJcbiAgICB0aGlzLm9hdXRoRGF0YS5pc0F1dGhlbnRpY2F0ZWQgPSB0b2tlbiAhPT0gbnVsbCAmJiB0b2tlbi5sZW5ndGggPiAwO1xyXG4gICAgdmFyIHVzZXIgPSB0aGlzLmFkYWwuZ2V0Q2FjaGVkVXNlcigpIHx8IHsgdXNlck5hbWU6ICcnLCBwcm9maWxlOiBudWxsIH07XHJcbiAgICB0aGlzLm9hdXRoRGF0YS51c2VyTmFtZSA9IHVzZXIudXNlck5hbWU7XHJcbiAgICB0aGlzLm9hdXRoRGF0YS5wcm9maWxlID0gdXNlci5wcm9maWxlO1xyXG4gICAgdGhpcy5vYXV0aERhdGEubG9naW5FcnJvciA9IHRoaXMuYWRhbC5nZXRMb2dpbkVycm9yKCk7XHJcbiAgfVxyXG5cclxuICBoYXNoSGFuZGxlcihoYXNoOiBzdHJpbmcsIHJlZGlyZWN0SGFuZGxlcjogRnVuY3Rpb24sIGlzTm90Q2FsbGJhY2tIYW5kbGVyOiBGdW5jdGlvbiwgbmV4dEhhbmRsZXI6IEZ1bmN0aW9uKTogdm9pZCB7XHJcbiAgICBpZiAodGhpcy5hZGFsLmlzQ2FsbGJhY2soaGFzaCkpIHtcclxuICAgICAgbGV0IHJlcXVlc3RJbmZvID0gdGhpcy5hZGFsLmdldFJlcXVlc3RJbmZvKGhhc2gpO1xyXG4gICAgICBcclxuICAgICAgdGhpcy5hZGFsLnNhdmVUb2tlbkZyb21IYXNoKHJlcXVlc3RJbmZvKTtcclxuXHJcbiAgICAgIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSAhPT0gdGhpcy5hZGFsLlJFUVVFU1RfVFlQRS5MT0dJTikge1xyXG4gICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayA9IHdpbmRvdy5wYXJlbnQuQXV0aGVudGljYXRpb25Db250ZXh0KCkuY2FsbGJhY2s7XHJcbiAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlID09PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLlJFTkVXX1RPS0VOKSB7XHJcbiAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sgPSB3aW5kb3cucGFyZW50LmNhbGxCYWNrTWFwcGVkVG9SZW5ld1N0YXRlc1tyZXF1ZXN0SW5mby5zdGF0ZVJlc3BvbnNlXTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIC8vIFJldHVybiB0byBjYWxsYmFjayBpZiBpdCBpcyBzZW50IGZyb20gaWZyYW1lXHJcbiAgICAgIGlmIChyZXF1ZXN0SW5mby5zdGF0ZU1hdGNoKSB7XHJcbiAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmFkYWwuY2FsbGJhY2sgPT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgICAgIC8vIENhbGwgd2l0aGluIHRoZSBzYW1lIGNvbnRleHQgd2l0aG91dCBmdWxsIHBhZ2UgcmVkaXJlY3Qga2VlcHMgdGhlIGNhbGxiYWNrXHJcbiAgICAgICAgICBpZiAocmVxdWVzdEluZm8ucmVxdWVzdFR5cGUgPT09IHRoaXMuYWRhbC5SRVFVRVNUX1RZUEUuUkVORVdfVE9LRU4pIHtcclxuICAgICAgICAgICAgLy8gSWR0b2tlbiBvciBBY2Nlc3Rva2VuIGNhbiBiZSByZW5ld2VkXHJcbiAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydhY2Nlc3NfdG9rZW4nXSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayh0aGlzLmFkYWwuX2dldEl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLkVSUk9SX0RFU0NSSVBUSU9OKSwgcmVxdWVzdEluZm8ucGFyYW1ldGVyc1snYWNjZXNzX3Rva2VuJ10pO1xyXG4gICAgICAgICAgICAgIHJldHVybiBuZXh0SGFuZGxlcigpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2lkX3Rva2VuJ10pIHtcclxuICAgICAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sodGhpcy5hZGFsLl9nZXRJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5FUlJPUl9ERVNDUklQVElPTiksIHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2lkX3Rva2VuJ10pO1xyXG4gICAgICAgICAgICAgIHJldHVybiBuZXh0SGFuZGxlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIC8vIG5vcm1hbCBmdWxsIGxvZ2luIHJlZGlyZWN0IGhhcHBlbmVkIG9uIHRoZSBwYWdlXHJcbiAgICAgICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ2FjaGUodGhpcy5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcclxuICAgICAgICAgIGlmICh0aGlzLm9hdXRoRGF0YS51c2VyTmFtZSkge1xyXG4gICAgICAgICAgICAvL0lEdG9rZW4gaXMgYWRkZWQgYXMgdG9rZW4gZm9yIHRoZSBhcHBcclxuICAgICAgICAgICAgbGV0IHNlbGYgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgc2VsZi51cGRhdGVEYXRhRnJvbUNhY2hlKHNlbGYuYWRhbC5jb25maWcubG9naW5SZXNvdXJjZSk7XHJcbiAgICAgICAgICAgIC8vIHJlZGlyZWN0IHRvIGxvZ2luIHJlcXVlc3RlZCBwYWdlXHJcbiAgICAgICAgICAgIHZhciBsb2dpblN0YXJ0UGFnZSA9IHNlbGYuYWRhbC5fZ2V0SXRlbShzZWxmLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuU1RBUlRfUEFHRSk7XHJcbiAgICAgICAgICAgIGlmIChsb2dpblN0YXJ0UGFnZSkge1xyXG4gICAgICAgICAgICAgIHJldHVybiByZWRpcmVjdEhhbmRsZXIobG9naW5TdGFydFBhZ2UpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFRPRE86IGJyb2FkY2FzdCBsb2dpbiBzdWNjZXNzP1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVE9ETzogYnJvYWRjYXN0IGxvZ2luIGZhaWx1cmU/IChyZWFzb246IHRoaXMuYWRhbC5fZ2V0SXRlbSh0aGlzLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuRVJST1JfREVTQ1JJUFRJT04pKVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIGlzTm90Q2FsbGJhY2tIYW5kbGVyKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBsb2dpbkhhbmRsZXIocGF0aDogc3RyaW5nLCByZWRpcmVjdEhhbmRsZXI6IEZ1bmN0aW9uLCBoYW5kbGVyOiBGdW5jdGlvbikge1xyXG4gICAgdGhpcy5hZGFsLmluZm8oJ0xvZ2luIGV2ZW50IGZvcjonICsgcGF0aCk7XHJcblxyXG4gICAgaWYgKHRoaXMuYWRhbC5jb25maWcgJiYgdGhpcy5hZGFsLmNvbmZpZy5sb2NhbExvZ2luVXJsKSB7XHJcbiAgICAgIHJldHVybiByZWRpcmVjdEhhbmRsZXIodGhpcy5hZGFsLmNvbmZpZy5sb2NhbExvZ2luVXJsKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIGRpcmVjdGx5IHN0YXJ0IGxvZ2luIGZsb3dcclxuICAgICAgdGhpcy5hZGFsLl9zYXZlSXRlbSh0aGlzLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuU1RBUlRfUEFHRSwgcGF0aCk7XHJcbiAgICAgIHRoaXMuYWRhbC5pbmZvKCdTdGFydCBsb2dpbiBhdDonICsgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG4gICAgICAvLyBUT0RPOiBicm9hZGNhc3QgbG9naW4gcmVkaXJlY3Q/XHJcbiAgICAgIHRoaXMuYWRhbC5sb2dpbigpO1xyXG4gICAgICByZXR1cm4gaGFuZGxlcigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgY29uZmlnKCk6IEFkYWxDb25maWcge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRhbC5jb25maWc7XHJcbiAgfVxyXG5cclxuICBsb2dpbigpIHtcclxuICAgIHRoaXMuYWRhbC5sb2dpbigpO1xyXG4gIH1cclxuXHJcbiAgbG9naW5JblByb2dyZXNzKCk6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRhbC5sb2dpbkluUHJvZ3Jlc3MoKTtcclxuICB9XHJcblxyXG4gIGxvZ091dCgpIHtcclxuICAgIHRoaXMuYWRhbC5sb2dPdXQoKTtcclxuICB9XHJcblxyXG4gIGdldENhY2hlZFRva2VuKHJlc291cmNlOiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRhbC5nZXRDYWNoZWRUb2tlbihyZXNvdXJjZSk7XHJcbiAgfVxyXG5cclxuICBnZXRVc2VySW5mbygpOiBhbnkge1xyXG4gICAgcmV0dXJuIHRoaXMub2F1dGhEYXRhO1xyXG4gIH1cclxuXHJcbiAgYWNxdWlyZVRva2VuKHJlc291cmNlOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgLy8gYXV0b21hdGVkIHRva2VuIHJlcXVlc3QgY2FsbFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlPHN0cmluZz4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmFkYWwuYWNxdWlyZVRva2VuKHJlc291cmNlLCAoZXJyb3I6IHN0cmluZywgdG9rZW5PdXQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVzb2x2ZSh0b2tlbk91dCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0VXNlcigpOiBQcm9taXNlPFVzZXI+IHtcclxuICAgIHJldHVybiBhd2FpdCBuZXcgUHJvbWlzZTxVc2VyPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgIHRoaXMuYWRhbC5nZXRVc2VyKChlcnJvcjogc3RyaW5nLCB1c2VyOiBVc2VyKSA9PiB7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICByZWplY3QoZXJyb3IpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXNvbHZlKHVzZXIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGdldFJlc291cmNlRm9yRW5kcG9pbnQoZW5kcG9pbnQ6IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgICByZXR1cm4gdGhpcy5hZGFsLmdldFJlc291cmNlRm9yRW5kcG9pbnQoZW5kcG9pbnQpO1xyXG4gIH1cclxuXHJcbiAgY2xlYXJDYWNoZSgpIHtcclxuICAgIHRoaXMuYWRhbC5jbGVhckNhY2hlKCk7XHJcbiAgfVxyXG5cclxuICBjbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2U6IHN0cmluZykge1xyXG4gICAgdGhpcy5hZGFsLmNsZWFyQ2FjaGVGb3JSZXNvdXJjZShyZXNvdXJjZSk7XHJcbiAgfVxyXG5cclxuICBpbmZvKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgdGhpcy5hZGFsLmluZm8obWVzc2FnZSk7XHJcbiAgfVxyXG5cclxuICB2ZXJib3NlKG1lc3NhZ2U6IHN0cmluZykge1xyXG4gICAgdGhpcy5hZGFsLnZlcmJvc2UobWVzc2FnZSk7XHJcbiAgfVxyXG5cclxuXHJcbiAgaXNBdXRoZW50aWNhdGVkKCkge1xyXG4gICAgcmV0dXJuIHRoaXMub2F1dGhEYXRhLmlzQXV0aGVudGljYXRlZDtcclxuICB9XHJcbn1cbkBpbmplY3QoQXVyZWxpYUFkYWxNYW5hZ2VyKVxyXG5leHBvcnQgY2xhc3MgQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwIHtcclxuICBcclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGF1cmVsaWFBZGFsOiBBdXJlbGlhQWRhbE1hbmFnZXIpIHtcclxuICAgIFxyXG4gIH1cclxuXHJcbiAgcnVuKHJvdXRpbmdDb250ZXh0OiBOYXZpZ2F0aW9uSW5zdHJ1Y3Rpb24sIG5leHQ6IGFueSk6IHZvaWQge1xyXG4gICAgbGV0IGhhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5hdXJlbGlhQWRhbC5oYXNoSGFuZGxlcihoYXNoLCAodXJsOiBzdHJpbmcpID0+IHtcclxuICAgICAgLy8gV2FzIGNhbGxiYWNrXHJcbiAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgUmVkaXJlY3QodXJsKSk7XHJcbiAgICB9LCAoKSA9PiB7XHJcbiAgICAgIC8vIFdhcyBub3QgY2FsbGJhY2tcclxuICAgICAgbGV0IGxvZ2luUm91dGUgPSAnJzsgLy8gVE9ETzogZ2V0IGxvZ2luIHVybCBmcm9tIGF1cmVsaWFBZGFsXHJcblxyXG4gICAgICBpZiAocm91dGluZ0NvbnRleHQuZ2V0QWxsSW5zdHJ1Y3Rpb25zKCkuc29tZShpID0+ICEhaS5jb25maWcuc2V0dGluZ3MucmVxdWlyZUFkYWxMb2dpbikpIHtcclxuICAgICAgICBpZiAoIXRoaXMuYXVyZWxpYUFkYWwuaXNBdXRoZW50aWNhdGVkKCkpIHtcclxuICAgICAgICAgIC8vIE5vdCBsb2dnZWQgaW4sIHJlZGlyZWN0IHRvIGxvZ2luIHJvdXRlXHJcbiAgICAgICAgICByZXR1cm4gdGhpcy5hdXJlbGlhQWRhbC5sb2dpbkhhbmRsZXIocm91dGluZ0NvbnRleHQuZnJhZ21lbnQsICh1cmw6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IFJlZGlyZWN0KHVybCkpO1xyXG4gICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwoJ2xvZ2luIHJlZGlyZWN0Jyk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5hdXJlbGlhQWRhbC5pc0F1dGhlbnRpY2F0ZWQoKSAmJiByb3V0aW5nQ29udGV4dC5nZXRBbGxJbnN0cnVjdGlvbnMoKS5zb21lKGkgPT4gaS5mcmFnbWVudCA9PSBsb2dpblJvdXRlKSkge1xyXG4gICAgICAgIC8vIExvZ2dlZCBpbiwgY3VycmVudCByb3V0ZSBpcyB0aGUgbG9naW4gcm91dGVcclxuICAgICAgICBsZXQgbG9naW5SZWRpcmVjdCA9ICcnO1xyXG4gICAgICAgIHJldHVybiBuZXh0LmNhbmNlbChuZXcgUmVkaXJlY3QobG9naW5SZWRpcmVjdCkpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICByZXR1cm4gbmV4dCgpO1xyXG4gICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIG5leHQoKTtcclxuICAgICAgfSk7XHJcbiAgfVxyXG59XG5AaW5qZWN0KEh0dHBDbGllbnQsIEF1cmVsaWFBZGFsTWFuYWdlcilcclxuZXhwb3J0IGNsYXNzIEF1cmVsaWFBZGFsRmV0Y2hDb25maWcge1xyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cENsaWVudDogSHR0cENsaWVudCwgcHJpdmF0ZSBhdXJlbGlhQWRhbDogQXVyZWxpYUFkYWxNYW5hZ2VyKSB7XHJcblxyXG4gIH1cclxuXHJcbiAgY29uZmlndXJlKCkge1xyXG4gICAgbGV0IGF1cmVsaWFBZGFsID0gdGhpcy5hdXJlbGlhQWRhbDtcclxuXHJcbiAgICB0aGlzLmh0dHBDbGllbnQuY29uZmlndXJlKChodHRwQ29uZmlnOiBIdHRwQ2xpZW50Q29uZmlndXJhdGlvbikgPT4ge1xyXG4gICAgICBodHRwQ29uZmlnXHJcbiAgICAgICAgLndpdGhEZWZhdWx0cyh7XHJcbiAgICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIC53aXRoSW50ZXJjZXB0b3Ioe1xyXG4gICAgICAgICAgYXN5bmMgcmVxdWVzdChyZXF1ZXN0KTogUHJvbWlzZTxSZXF1ZXN0PiB7XHJcbiAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGF1cmVsaWFBZGFsLmdldFJlc291cmNlRm9yRW5kcG9pbnQocmVxdWVzdC51cmwpO1xyXG4gICAgICAgICAgICBpZiAocmVzb3VyY2UgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgdG9rZW5TdG9yZWQgPSBhdXJlbGlhQWRhbC5nZXRDYWNoZWRUb2tlbihyZXNvdXJjZSk7XHJcbiAgICAgICAgICAgIGxldCBpc0VuZHBvaW50ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBpZiAodG9rZW5TdG9yZWQpIHtcclxuICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdUb2tlbiBpcyBhdmFsaWFibGUgZm9yIHRoaXMgdXJsICcgKyByZXF1ZXN0LnVybCk7XHJcbiAgICAgICAgICAgICAgLy8gY2hlY2sgZW5kcG9pbnQgbWFwcGluZyBpZiBwcm92aWRlZFxyXG4gICAgICAgICAgICAgIHJlcXVlc3QuaGVhZGVycy5hcHBlbmQoJ0F1dGhvcml6YXRpb24nLCAnQmVhcmVyICcgKyB0b2tlblN0b3JlZCk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgaWYgKGF1cmVsaWFBZGFsLmNvbmZpZykge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgZW5kcG9pbnRVcmwgaW4gYXVyZWxpYUFkYWwuY29uZmlnKCkuZW5kcG9pbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0LnVybC5pbmRleE9mKGVuZHBvaW50VXJsKSA+IC0xKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNFbmRwb2ludCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgLy8gQ2FuY2VsIHJlcXVlc3QgaWYgbG9naW4gaXMgc3RhcnRpbmdcclxuICAgICAgICAgICAgICBpZiAoYXVyZWxpYUFkYWwubG9naW5JblByb2dyZXNzKCkpIHtcclxuICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmluZm8oJ2xvZ2luIGFscmVhZHkgc3RhcnRlZC4nKTtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbG9naW4gYWxyZWFkeSBzdGFydGVkJyk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChhdXJlbGlhQWRhbC5jb25maWcgJiYgaXNFbmRwb2ludCkge1xyXG4gICAgICAgICAgICAgICAgLy8gZXh0ZXJuYWwgZW5kcG9pbnRzXHJcbiAgICAgICAgICAgICAgICAvLyBkZWxheWVkIHJlcXVlc3QgdG8gcmV0dXJuIGFmdGVyIGlmcmFtZSBjb21wbGV0ZXNcclxuICAgICAgICAgICAgICAgIGxldCB0b2tlbiA9IGF3YWl0IGF1cmVsaWFBZGFsLmFjcXVpcmVUb2tlbihyZXNvdXJjZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYXVyZWxpYUFkYWwudmVyYm9zZSgnVG9rZW4gaXMgYXZhbGlhYmxlJyk7XHJcbiAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuc2V0KCdBdXRob3JpemF0aW9uJywgJ0JlYXJlciAnICsgdG9rZW4pO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHJlcXVlc3Q7XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgcmVzcG9uc2VFcnJvcihyZWplY3Rpb24pOiBSZXNwb25zZSB7XHJcbiAgICAgICAgICAgIGF1cmVsaWFBZGFsLmluZm8oJ0dldHRpbmcgZXJyb3IgaW4gdGhlIHJlc3BvbnNlJyk7XHJcblxyXG4gICAgICAgICAgICBpZiAocmVqZWN0aW9uICYmIHJlamVjdGlvbi5zdGF0dXMgPT09IDQwMSkge1xyXG4gICAgICAgICAgICAgIHZhciByZXNvdXJjZSA9IGF1cmVsaWFBZGFsLmdldFJlc291cmNlRm9yRW5kcG9pbnQocmVqZWN0aW9uLmNvbmZpZy51cmwpO1xyXG4gICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmNsZWFyQ2FjaGVGb3JSZXNvdXJjZShyZXNvdXJjZSk7XHJcbiAgICAgICAgICAgICAgLy8gVE9ETzogYnJvYWRjYXN0IG5vdEF1dGhvcml6ZWQ/XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZWplY3Rpb247XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb25maWd1cmUoZnJhbWV3b3JrQ29uZmlnOiBGcmFtZXdvcmtDb25maWd1cmF0aW9uLCBjb25maWc6IEF1cmVsaWFBZGFsQ29uZmlnKSB7XHJcbiAgbGV0IGF1cmVsaWFBZGFsOiBBdXJlbGlhQWRhbE1hbmFnZXIgPSBmcmFtZXdvcmtDb25maWcuY29udGFpbmVyLmdldChBdXJlbGlhQWRhbE1hbmFnZXIpO1xyXG5cclxuICBhdXJlbGlhQWRhbC5jb25maWd1cmUoY29uZmlnKTtcclxufSJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
