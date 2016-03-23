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
var Adal = require('adal');
var aurelia_framework_1 = require('aurelia-framework');
var aurelia_router_1 = require('aurelia-router');
var aurelia_fetch_client_1 = require('aurelia-fetch-client');
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
            return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$2$0() {
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    var _this3 = this;

                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            context$3$0.next = 2;
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
                            return context$3$0.abrupt("return", context$3$0.sent);

                        case 3:
                        case "end":
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
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
                        return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$4$0() {
                            var resource, tokenStored, isEndpoint, endpointUrl, token;
                            return regeneratorRuntime.wrap(function callee$4$0$(context$5$0) {
                                while (1) switch (context$5$0.prev = context$5$0.next) {
                                    case 0:
                                        resource = aureliaAdal.getResourceForEndpoint(_request.url);

                                        if (!(resource == null)) {
                                            context$5$0.next = 3;
                                            break;
                                        }

                                        return context$5$0.abrupt("return", _request);

                                    case 3:
                                        tokenStored = aureliaAdal.getCachedToken(resource);
                                        isEndpoint = false;

                                        if (!tokenStored) {
                                            context$5$0.next = 11;
                                            break;
                                        }

                                        aureliaAdal.info('Token is avaliable for this url ' + _request.url);
                                        _request.headers.append('Authorization', 'Bearer ' + tokenStored);
                                        return context$5$0.abrupt("return", _request);

                                    case 11:
                                        if (aureliaAdal.config) {
                                            for (endpointUrl in aureliaAdal.config().endpoints) {
                                                if (_request.url.indexOf(endpointUrl) > -1) {
                                                    isEndpoint = true;
                                                }
                                            }
                                        }

                                        if (!aureliaAdal.loginInProgress()) {
                                            context$5$0.next = 17;
                                            break;
                                        }

                                        aureliaAdal.info('login already started.');
                                        throw new Error('login already started');

                                    case 17:
                                        if (!(aureliaAdal.config && isEndpoint)) {
                                            context$5$0.next = 23;
                                            break;
                                        }

                                        context$5$0.next = 20;
                                        return aureliaAdal.acquireToken(resource);

                                    case 20:
                                        token = context$5$0.sent;

                                        aureliaAdal.verbose('Token is avaliable');
                                        _request.headers.set('Authorization', 'Bearer ' + token);

                                    case 23:
                                        return context$5$0.abrupt("return", _request);

                                    case 24:
                                    case "end":
                                        return context$5$0.stop();
                                }
                            }, callee$4$0, this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1cmVsaWEtYWRhbC5qcyIsImF1cmVsaWEtYWRhbC50cyJdLCJuYW1lcyI6WyJBdXJlbGlhQWRhbE1hbmFnZXIiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY29uc3RydWN0b3IiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY29uZmlndXJlIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLnVwZGF0ZURhdGFGcm9tQ2FjaGUiLCJBdXJlbGlhQWRhbE1hbmFnZXIuaGFzaEhhbmRsZXIiLCJBdXJlbGlhQWRhbE1hbmFnZXIubG9naW5IYW5kbGVyIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmNvbmZpZyIsIkF1cmVsaWFBZGFsTWFuYWdlci5sb2dpbiIsIkF1cmVsaWFBZGFsTWFuYWdlci5sb2dpbkluUHJvZ3Jlc3MiLCJBdXJlbGlhQWRhbE1hbmFnZXIubG9nT3V0IiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldENhY2hlZFRva2VuIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldFVzZXJJbmZvIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmFjcXVpcmVUb2tlbiIsIkF1cmVsaWFBZGFsTWFuYWdlci5nZXRVc2VyIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmdldFJlc291cmNlRm9yRW5kcG9pbnQiLCJBdXJlbGlhQWRhbE1hbmFnZXIuY2xlYXJDYWNoZSIsIkF1cmVsaWFBZGFsTWFuYWdlci5jbGVhckNhY2hlRm9yUmVzb3VyY2UiLCJBdXJlbGlhQWRhbE1hbmFnZXIuaW5mbyIsIkF1cmVsaWFBZGFsTWFuYWdlci52ZXJib3NlIiwiQXVyZWxpYUFkYWxNYW5hZ2VyLmlzQXV0aGVudGljYXRlZCIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcC5jb25zdHJ1Y3RvciIsIkF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcC5ydW4iLCJBdXJlbGlhQWRhbEZldGNoQ29uZmlnIiwiQXVyZWxpYUFkYWxGZXRjaENvbmZpZy5jb25zdHJ1Y3RvciIsIkF1cmVsaWFBZGFsRmV0Y2hDb25maWcuY29uZmlndXJlIiwiQXVyZWxpYUFkYWxGZXRjaENvbmZpZy5jb25maWd1cmUucmVxdWVzdCIsIkF1cmVsaWFBZGFsRmV0Y2hDb25maWcuY29uZmlndXJlLnJlc3BvbnNlRXJyb3IiLCJjb25maWd1cmUiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLElBQUksVUFBVSxHQUFHLEFBQUMsYUFBUSxVQUFLLFVBQVUsSUFBSyxVQUFVLFVBQVUsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRTtBQUNuRixRQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTTtRQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE1BQU0sR0FBRyxJQUFJLEtBQUssSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUk7UUFBRSxDQUFDLENBQUM7QUFDN0gsUUFBSSxPQUFPLE9BQU8sS0FBSyxRQUFRLElBQUksT0FBTyxPQUFPLENBQUMsUUFBUSxLQUFLLFVBQVUsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQyxLQUMxSCxLQUFLLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQSxJQUFLLENBQUMsQ0FBQztBQUNsSixXQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJ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QUF1QkEsZUFBZUEsQ0FBQ0EsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxDQUFDQTtBQUV4RkEsZUFBV0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Q0FDL0JBO0FBSmUsT0FBQSxDQUFBLFNBQVMsR0FBQSxTQUl4QixDQUFBIiwiZmlsZSI6ImF1cmVsaWEtYWRhbC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX21ldGFkYXRhID0gKHRoaXMgJiYgdGhpcy5fX21ldGFkYXRhKSB8fCBmdW5jdGlvbiAoaywgdikge1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5tZXRhZGF0YSA9PT0gXCJmdW5jdGlvblwiKSByZXR1cm4gUmVmbGVjdC5tZXRhZGF0YShrLCB2KTtcbn07XG52YXIgX19hd2FpdGVyID0gKHRoaXMgJiYgdGhpcy5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQcm9taXNlLCBnZW5lcmF0b3IpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBnZW5lcmF0b3IgPSBnZW5lcmF0b3IuY2FsbCh0aGlzQXJnLCBfYXJndW1lbnRzKTtcbiAgICAgICAgZnVuY3Rpb24gY2FzdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQcm9taXNlICYmIHZhbHVlLmNvbnN0cnVjdG9yID09PSBQcm9taXNlID8gdmFsdWUgOiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICAgICAgZnVuY3Rpb24gb25mdWxmaWxsKHZhbHVlKSB7IHRyeSB7IHN0ZXAoXCJuZXh0XCIsIHZhbHVlKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBvbnJlamVjdCh2YWx1ZSkgeyB0cnkgeyBzdGVwKFwidGhyb3dcIiwgdmFsdWUpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAodmVyYiwgdmFsdWUpIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBnZW5lcmF0b3JbdmVyYl0odmFsdWUpO1xuICAgICAgICAgICAgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBjYXN0KHJlc3VsdC52YWx1ZSkudGhlbihvbmZ1bGZpbGwsIG9ucmVqZWN0KTtcbiAgICAgICAgfVxuICAgICAgICBzdGVwKFwibmV4dFwiLCB2b2lkIDApO1xuICAgIH0pO1xufTtcbnZhciBBZGFsID0gcmVxdWlyZSgnYWRhbCcpO1xudmFyIGF1cmVsaWFfZnJhbWV3b3JrXzEgPSByZXF1aXJlKCdhdXJlbGlhLWZyYW1ld29yaycpO1xudmFyIGF1cmVsaWFfcm91dGVyXzEgPSByZXF1aXJlKCdhdXJlbGlhLXJvdXRlcicpO1xudmFyIGF1cmVsaWFfZmV0Y2hfY2xpZW50XzEgPSByZXF1aXJlKCdhdXJlbGlhLWZldGNoLWNsaWVudCcpO1xubGV0IEF1cmVsaWFBZGFsTWFuYWdlciA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcihhZGFsQ29uc3RydWN0b3IpIHtcbiAgICAgICAgdGhpcy5hZGFsQ29uc3RydWN0b3IgPSBhZGFsQ29uc3RydWN0b3I7XG4gICAgICAgIHRoaXMub2F1dGhEYXRhID0ge1xuICAgICAgICAgICAgaXNBdXRoZW50aWNhdGVkOiBmYWxzZSxcbiAgICAgICAgICAgIHVzZXJOYW1lOiAnJyxcbiAgICAgICAgICAgIGxvZ2luRXJyb3I6ICcnLFxuICAgICAgICAgICAgcHJvZmlsZTogbnVsbFxuICAgICAgICB9O1xuICAgIH1cbiAgICBjb25maWd1cmUoY29uZmlnKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBsZXQgY29uZmlnT3B0aW9ucyA9IHt9O1xuICAgICAgICAgICAgY29uZmlnT3B0aW9ucy50ZW5hbnQgPSBjb25maWcudGVuYW50O1xuICAgICAgICAgICAgY29uZmlnT3B0aW9ucy5jbGllbnRJZCA9IGNvbmZpZy5jbGllbnRJZDtcbiAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMuZW5kcG9pbnRzID0gY29uZmlnLmVuZHBvaW50cztcbiAgICAgICAgICAgIGxldCBleGlzdGluZ0hhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcbiAgICAgICAgICAgIGxldCBwYXRoRGVmYXVsdCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgICAgICAgICAgaWYgKGV4aXN0aW5nSGFzaCkge1xuICAgICAgICAgICAgICAgIHBhdGhEZWZhdWx0ID0gcGF0aERlZmF1bHQucmVwbGFjZShleGlzdGluZ0hhc2gsICcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbmZpZ09wdGlvbnMucmVkaXJlY3RVcmkgPSBjb25maWdPcHRpb25zLnJlZGlyZWN0VXJpIHx8IHBhdGhEZWZhdWx0O1xuICAgICAgICAgICAgY29uZmlnT3B0aW9ucy5wb3N0TG9nb3V0UmVkaXJlY3RVcmkgPSBjb25maWdPcHRpb25zLnBvc3RMb2dvdXRSZWRpcmVjdFVyaSB8fCBwYXRoRGVmYXVsdDtcbiAgICAgICAgICAgIHRoaXMuYWRhbCA9IHRoaXMuYWRhbENvbnN0cnVjdG9yLmluamVjdChjb25maWdPcHRpb25zKTtcbiAgICAgICAgICAgIHdpbmRvdy5BdXRoZW50aWNhdGlvbkNvbnRleHQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWRhbDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ2FjaGUodGhpcy5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgdXBkYXRlRGF0YUZyb21DYWNoZShyZXNvdXJjZSkge1xuICAgICAgICB2YXIgdG9rZW4gPSB0aGlzLmFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xuICAgICAgICB0aGlzLm9hdXRoRGF0YS5pc0F1dGhlbnRpY2F0ZWQgPSB0b2tlbiAhPT0gbnVsbCAmJiB0b2tlbi5sZW5ndGggPiAwO1xuICAgICAgICB2YXIgdXNlciA9IHRoaXMuYWRhbC5nZXRDYWNoZWRVc2VyKCkgfHwgeyB1c2VyTmFtZTogJycsIHByb2ZpbGU6IG51bGwgfTtcbiAgICAgICAgdGhpcy5vYXV0aERhdGEudXNlck5hbWUgPSB1c2VyLnVzZXJOYW1lO1xuICAgICAgICB0aGlzLm9hdXRoRGF0YS5wcm9maWxlID0gdXNlci5wcm9maWxlO1xuICAgICAgICB0aGlzLm9hdXRoRGF0YS5sb2dpbkVycm9yID0gdGhpcy5hZGFsLmdldExvZ2luRXJyb3IoKTtcbiAgICB9XG4gICAgaGFzaEhhbmRsZXIoaGFzaCwgcmVkaXJlY3RIYW5kbGVyLCBpc05vdENhbGxiYWNrSGFuZGxlciwgbmV4dEhhbmRsZXIpIHtcbiAgICAgICAgaWYgKHRoaXMuYWRhbC5pc0NhbGxiYWNrKGhhc2gpKSB7XG4gICAgICAgICAgICBsZXQgcmVxdWVzdEluZm8gPSB0aGlzLmFkYWwuZ2V0UmVxdWVzdEluZm8oaGFzaCk7XG4gICAgICAgICAgICB0aGlzLmFkYWwuc2F2ZVRva2VuRnJvbUhhc2gocmVxdWVzdEluZm8pO1xuICAgICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlICE9PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLkxPR0lOKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrID0gd2luZG93LnBhcmVudC5BdXRoZW50aWNhdGlvbkNvbnRleHQoKS5jYWxsYmFjaztcbiAgICAgICAgICAgICAgICBpZiAocmVxdWVzdEluZm8ucmVxdWVzdFR5cGUgPT09IHRoaXMuYWRhbC5SRVFVRVNUX1RZUEUuUkVORVdfVE9LRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrID0gd2luZG93LnBhcmVudC5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbcmVxdWVzdEluZm8uc3RhdGVSZXNwb25zZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnN0YXRlTWF0Y2gpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuYWRhbC5jYWxsYmFjayA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdEluZm8ucmVxdWVzdFR5cGUgPT09IHRoaXMuYWRhbC5SRVFVRVNUX1RZUEUuUkVORVdfVE9LRU4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydhY2Nlc3NfdG9rZW4nXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayh0aGlzLmFkYWwuX2dldEl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLkVSUk9SX0RFU0NSSVBUSU9OKSwgcmVxdWVzdEluZm8ucGFyYW1ldGVyc1snYWNjZXNzX3Rva2VuJ10pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0SGFuZGxlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAocmVxdWVzdEluZm8ucGFyYW1ldGVyc1snaWRfdG9rZW4nXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRhbC5jYWxsYmFjayh0aGlzLmFkYWwuX2dldEl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLkVSUk9SX0RFU0NSSVBUSU9OKSwgcmVxdWVzdEluZm8ucGFyYW1ldGVyc1snaWRfdG9rZW4nXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5leHRIYW5kbGVyKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlRGF0YUZyb21DYWNoZSh0aGlzLmFkYWwuY29uZmlnLmxvZ2luUmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vYXV0aERhdGEudXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlRGF0YUZyb21DYWNoZShzZWxmLmFkYWwuY29uZmlnLmxvZ2luUmVzb3VyY2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGxvZ2luU3RhcnRQYWdlID0gc2VsZi5hZGFsLl9nZXRJdGVtKHNlbGYuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5TVEFSVF9QQUdFKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsb2dpblN0YXJ0UGFnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWRpcmVjdEhhbmRsZXIobG9naW5TdGFydFBhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGlzTm90Q2FsbGJhY2tIYW5kbGVyKCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9naW5IYW5kbGVyKHBhdGgsIHJlZGlyZWN0SGFuZGxlciwgaGFuZGxlcikge1xuICAgICAgICB0aGlzLmFkYWwuaW5mbygnTG9naW4gZXZlbnQgZm9yOicgKyBwYXRoKTtcbiAgICAgICAgaWYgKHRoaXMuYWRhbC5jb25maWcgJiYgdGhpcy5hZGFsLmNvbmZpZy5sb2NhbExvZ2luVXJsKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVkaXJlY3RIYW5kbGVyKHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmFkYWwuX3NhdmVJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5TVEFSVF9QQUdFLCBwYXRoKTtcbiAgICAgICAgICAgIHRoaXMuYWRhbC5pbmZvKCdTdGFydCBsb2dpbiBhdDonICsgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgICAgICAgdGhpcy5hZGFsLmxvZ2luKCk7XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlcigpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbmZpZygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRhbC5jb25maWc7XG4gICAgfVxuICAgIGxvZ2luKCkge1xuICAgICAgICB0aGlzLmFkYWwubG9naW4oKTtcbiAgICB9XG4gICAgbG9naW5JblByb2dyZXNzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGFsLmxvZ2luSW5Qcm9ncmVzcygpO1xuICAgIH1cbiAgICBsb2dPdXQoKSB7XG4gICAgICAgIHRoaXMuYWRhbC5sb2dPdXQoKTtcbiAgICB9XG4gICAgZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWRhbC5nZXRDYWNoZWRUb2tlbihyZXNvdXJjZSk7XG4gICAgfVxuICAgIGdldFVzZXJJbmZvKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5vYXV0aERhdGE7XG4gICAgfVxuICAgIGFjcXVpcmVUb2tlbihyZXNvdXJjZSkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5hZGFsLmFjcXVpcmVUb2tlbihyZXNvdXJjZSwgKGVycm9yLCB0b2tlbk91dCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0b2tlbk91dCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBnZXRVc2VyKCkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIHJldHVybiB5aWVsZCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5hZGFsLmdldFVzZXIoKGVycm9yLCB1c2VyKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUodXNlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZ2V0UmVzb3VyY2VGb3JFbmRwb2ludChlbmRwb2ludCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGFsLmdldFJlc291cmNlRm9yRW5kcG9pbnQoZW5kcG9pbnQpO1xuICAgIH1cbiAgICBjbGVhckNhY2hlKCkge1xuICAgICAgICB0aGlzLmFkYWwuY2xlYXJDYWNoZSgpO1xuICAgIH1cbiAgICBjbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpIHtcbiAgICAgICAgdGhpcy5hZGFsLmNsZWFyQ2FjaGVGb3JSZXNvdXJjZShyZXNvdXJjZSk7XG4gICAgfVxuICAgIGluZm8obWVzc2FnZSkge1xuICAgICAgICB0aGlzLmFkYWwuaW5mbyhtZXNzYWdlKTtcbiAgICB9XG4gICAgdmVyYm9zZShtZXNzYWdlKSB7XG4gICAgICAgIHRoaXMuYWRhbC52ZXJib3NlKG1lc3NhZ2UpO1xuICAgIH1cbiAgICBpc0F1dGhlbnRpY2F0ZWQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9hdXRoRGF0YS5pc0F1dGhlbnRpY2F0ZWQ7XG4gICAgfVxufTtcbkF1cmVsaWFBZGFsTWFuYWdlciA9IF9fZGVjb3JhdGUoW1xuICAgIGF1cmVsaWFfZnJhbWV3b3JrXzEuaW5qZWN0KEFkYWwpLCBcbiAgICBfX21ldGFkYXRhKCdkZXNpZ246cGFyYW10eXBlcycsIFtPYmplY3RdKVxuXSwgQXVyZWxpYUFkYWxNYW5hZ2VyKTtcbmV4cG9ydHMuQXVyZWxpYUFkYWxNYW5hZ2VyID0gQXVyZWxpYUFkYWxNYW5hZ2VyO1xubGV0IEF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCA9IGNsYXNzIHtcbiAgICBjb25zdHJ1Y3RvcihhdXJlbGlhQWRhbCkge1xuICAgICAgICB0aGlzLmF1cmVsaWFBZGFsID0gYXVyZWxpYUFkYWw7XG4gICAgfVxuICAgIHJ1bihyb3V0aW5nQ29udGV4dCwgbmV4dCkge1xuICAgICAgICBsZXQgaGFzaCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuICAgICAgICByZXR1cm4gdGhpcy5hdXJlbGlhQWRhbC5oYXNoSGFuZGxlcihoYXNoLCAodXJsKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IGF1cmVsaWFfcm91dGVyXzEuUmVkaXJlY3QodXJsKSk7XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIGxldCBsb2dpblJvdXRlID0gJyc7XG4gICAgICAgICAgICBpZiAocm91dGluZ0NvbnRleHQuZ2V0QWxsSW5zdHJ1Y3Rpb25zKCkuc29tZShpID0+ICEhaS5jb25maWcuc2V0dGluZ3MucmVxdWlyZUFkYWxMb2dpbikpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuYXVyZWxpYUFkYWwuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXVyZWxpYUFkYWwubG9naW5IYW5kbGVyKHJvdXRpbmdDb250ZXh0LmZyYWdtZW50LCAodXJsKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IGF1cmVsaWFfcm91dGVyXzEuUmVkaXJlY3QodXJsKSk7XG4gICAgICAgICAgICAgICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXh0LmNhbmNlbCgnbG9naW4gcmVkaXJlY3QnKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAodGhpcy5hdXJlbGlhQWRhbC5pc0F1dGhlbnRpY2F0ZWQoKSAmJiByb3V0aW5nQ29udGV4dC5nZXRBbGxJbnN0cnVjdGlvbnMoKS5zb21lKGkgPT4gaS5mcmFnbWVudCA9PSBsb2dpblJvdXRlKSkge1xuICAgICAgICAgICAgICAgIGxldCBsb2dpblJlZGlyZWN0ID0gJyc7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHQuY2FuY2VsKG5ldyBhdXJlbGlhX3JvdXRlcl8xLlJlZGlyZWN0KGxvZ2luUmVkaXJlY3QpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0sICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5BdXJlbGlhQWRhbEF1dGhvcml6ZVN0ZXAgPSBfX2RlY29yYXRlKFtcbiAgICBhdXJlbGlhX2ZyYW1ld29ya18xLmluamVjdChBdXJlbGlhQWRhbE1hbmFnZXIpLCBcbiAgICBfX21ldGFkYXRhKCdkZXNpZ246cGFyYW10eXBlcycsIFtBdXJlbGlhQWRhbE1hbmFnZXJdKVxuXSwgQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwKTtcbmV4cG9ydHMuQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwID0gQXVyZWxpYUFkYWxBdXRob3JpemVTdGVwO1xubGV0IEF1cmVsaWFBZGFsRmV0Y2hDb25maWcgPSBjbGFzcyB7XG4gICAgY29uc3RydWN0b3IoaHR0cENsaWVudCwgYXVyZWxpYUFkYWwpIHtcbiAgICAgICAgdGhpcy5odHRwQ2xpZW50ID0gaHR0cENsaWVudDtcbiAgICAgICAgdGhpcy5hdXJlbGlhQWRhbCA9IGF1cmVsaWFBZGFsO1xuICAgIH1cbiAgICBjb25maWd1cmUoKSB7XG4gICAgICAgIGxldCBhdXJlbGlhQWRhbCA9IHRoaXMuYXVyZWxpYUFkYWw7XG4gICAgICAgIHRoaXMuaHR0cENsaWVudC5jb25maWd1cmUoKGh0dHBDb25maWcpID0+IHtcbiAgICAgICAgICAgIGh0dHBDb25maWdcbiAgICAgICAgICAgICAgICAud2l0aERlZmF1bHRzKHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdBY2NlcHQnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC53aXRoSW50ZXJjZXB0b3Ioe1xuICAgICAgICAgICAgICAgIHJlcXVlc3QocmVxdWVzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgUHJvbWlzZSwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCByZXNvdXJjZSA9IGF1cmVsaWFBZGFsLmdldFJlc291cmNlRm9yRW5kcG9pbnQocmVxdWVzdC51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc291cmNlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b2tlblN0b3JlZCA9IGF1cmVsaWFBZGFsLmdldENhY2hlZFRva2VuKHJlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBpc0VuZHBvaW50ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodG9rZW5TdG9yZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdUb2tlbiBpcyBhdmFsaWFibGUgZm9yIHRoaXMgdXJsICcgKyByZXF1ZXN0LnVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmFwcGVuZCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHRva2VuU3RvcmVkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXJlbGlhQWRhbC5jb25maWcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZW5kcG9pbnRVcmwgaW4gYXVyZWxpYUFkYWwuY29uZmlnKCkuZW5kcG9pbnRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC51cmwuaW5kZXhPZihlbmRwb2ludFVybCkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRW5kcG9pbnQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhdXJlbGlhQWRhbC5sb2dpbkluUHJvZ3Jlc3MoKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdsb2dpbiBhbHJlYWR5IHN0YXJ0ZWQuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbG9naW4gYWxyZWFkeSBzdGFydGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKGF1cmVsaWFBZGFsLmNvbmZpZyAmJiBpc0VuZHBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB0b2tlbiA9IHlpZWxkIGF1cmVsaWFBZGFsLmFjcXVpcmVUb2tlbihyZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLnZlcmJvc2UoJ1Rva2VuIGlzIGF2YWxpYWJsZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuc2V0KCdBdXRob3JpemF0aW9uJywgJ0JlYXJlciAnICsgdG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHJlc3BvbnNlRXJyb3IocmVqZWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmluZm8oJ0dldHRpbmcgZXJyb3IgaW4gdGhlIHJlc3BvbnNlJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWplY3Rpb24gJiYgcmVqZWN0aW9uLnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlamVjdGlvbi5jb25maWcudXJsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLmNsZWFyQ2FjaGVGb3JSZXNvdXJjZShyZXNvdXJjZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbkF1cmVsaWFBZGFsRmV0Y2hDb25maWcgPSBfX2RlY29yYXRlKFtcbiAgICBhdXJlbGlhX2ZyYW1ld29ya18xLmluamVjdChhdXJlbGlhX2ZldGNoX2NsaWVudF8xLkh0dHBDbGllbnQsIEF1cmVsaWFBZGFsTWFuYWdlciksIFxuICAgIF9fbWV0YWRhdGEoJ2Rlc2lnbjpwYXJhbXR5cGVzJywgW2F1cmVsaWFfZmV0Y2hfY2xpZW50XzEuSHR0cENsaWVudCwgQXVyZWxpYUFkYWxNYW5hZ2VyXSlcbl0sIEF1cmVsaWFBZGFsRmV0Y2hDb25maWcpO1xuZXhwb3J0cy5BdXJlbGlhQWRhbEZldGNoQ29uZmlnID0gQXVyZWxpYUFkYWxGZXRjaENvbmZpZztcbmZ1bmN0aW9uIGNvbmZpZ3VyZShmcmFtZXdvcmtDb25maWcsIGNvbmZpZykge1xuICAgIGxldCBhdXJlbGlhQWRhbCA9IGZyYW1ld29ya0NvbmZpZy5jb250YWluZXIuZ2V0KEF1cmVsaWFBZGFsTWFuYWdlcik7XG4gICAgYXVyZWxpYUFkYWwuY29uZmlndXJlKGNvbmZpZyk7XG59XG5leHBvcnRzLmNvbmZpZ3VyZSA9IGNvbmZpZ3VyZTtcbiIsImltcG9ydCAqIGFzIEFkYWwgZnJvbSAnYWRhbCc7XG5pbXBvcnQge2luamVjdCxGcmFtZXdvcmtDb25maWd1cmF0aW9ufSBmcm9tICdhdXJlbGlhLWZyYW1ld29yayc7XG5pbXBvcnQge05hdmlnYXRpb25JbnN0cnVjdGlvbixSZWRpcmVjdH0gZnJvbSAnYXVyZWxpYS1yb3V0ZXInO1xuaW1wb3J0IHtIdHRwQ2xpZW50LEh0dHBDbGllbnRDb25maWd1cmF0aW9ufSBmcm9tICdhdXJlbGlhLWZldGNoLWNsaWVudCc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXVyZWxpYUFkYWxDb25maWcge1xyXG4gICAgdGVuYW50Pzogc3RyaW5nO1xyXG4gICAgY2xpZW50SWQ/OiBzdHJpbmc7XHJcbiAgICBlbmRwb2ludHM/OiB7IFtpZDogc3RyaW5nXTogc3RyaW5nOyB9O1xyXG59XG5AaW5qZWN0KEFkYWwpXHJcbmV4cG9ydCBjbGFzcyBBdXJlbGlhQWRhbE1hbmFnZXIge1xyXG5cclxuICBwcml2YXRlIGFkYWw6IEFkYWw7XHJcbiAgcHJpdmF0ZSBvYXV0aERhdGEgPSB7XHJcbiAgICBpc0F1dGhlbnRpY2F0ZWQ6IGZhbHNlLFxyXG4gICAgdXNlck5hbWU6ICcnLFxyXG4gICAgbG9naW5FcnJvcjogJycsXHJcbiAgICBwcm9maWxlOiBudWxsXHJcbiAgfVxyXG5cclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFkYWxDb25zdHJ1Y3RvcjogQWRhbCkge1xyXG4gICAgXHJcbiAgfVxyXG4gIFxyXG4gIGNvbmZpZ3VyZShjb25maWc6IEF1cmVsaWFBZGFsQ29uZmlnKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICBsZXQgY29uZmlnT3B0aW9uczogQWRhbENvbmZpZyA9IHt9O1xyXG4gICAgICBcclxuICAgICAgY29uZmlnT3B0aW9ucy50ZW5hbnQgPSBjb25maWcudGVuYW50O1xyXG4gICAgICBjb25maWdPcHRpb25zLmNsaWVudElkID0gY29uZmlnLmNsaWVudElkO1xyXG4gICAgICBjb25maWdPcHRpb25zLmVuZHBvaW50cyA9IGNvbmZpZy5lbmRwb2ludHM7XHJcblxyXG4gICAgICAvLyByZWRpcmVjdCBhbmQgbG9nb3V0X3JlZGlyZWN0IGFyZSBzZXQgdG8gY3VycmVudCBsb2NhdGlvbiBieSBkZWZhdWx0XHJcbiAgICAgIGxldCBleGlzdGluZ0hhc2ggPSB3aW5kb3cubG9jYXRpb24uaGFzaDtcclxuICAgICAgbGV0IHBhdGhEZWZhdWx0ID0gd2luZG93LmxvY2F0aW9uLmhyZWY7XHJcbiAgICAgIGlmIChleGlzdGluZ0hhc2gpIHtcclxuICAgICAgICBwYXRoRGVmYXVsdCA9IHBhdGhEZWZhdWx0LnJlcGxhY2UoZXhpc3RpbmdIYXNoLCAnJyk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbmZpZ09wdGlvbnMucmVkaXJlY3RVcmkgPSBjb25maWdPcHRpb25zLnJlZGlyZWN0VXJpIHx8IHBhdGhEZWZhdWx0O1xyXG4gICAgICBjb25maWdPcHRpb25zLnBvc3RMb2dvdXRSZWRpcmVjdFVyaSA9IGNvbmZpZ09wdGlvbnMucG9zdExvZ291dFJlZGlyZWN0VXJpIHx8IHBhdGhEZWZhdWx0O1xyXG5cclxuICAgICAgdGhpcy5hZGFsID0gdGhpcy5hZGFsQ29uc3RydWN0b3IuaW5qZWN0KGNvbmZpZ09wdGlvbnMpO1xyXG4gICAgICBcclxuICAgICAgd2luZG93LkF1dGhlbnRpY2F0aW9uQ29udGV4dCA9ICgpID0+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hZGFsO1xyXG4gICAgICB9XHJcbiAgICAgIFxyXG4gICAgICB0aGlzLnVwZGF0ZURhdGFGcm9tQ2FjaGUodGhpcy5hZGFsLmNvbmZpZy5sb2dpblJlc291cmNlKTtcclxuICAgIH1cclxuICAgIGNhdGNoIChlKSB7XHJcbiAgICAgIGNvbnNvbGUubG9nKGUpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdXBkYXRlRGF0YUZyb21DYWNoZShyZXNvdXJjZTogc3RyaW5nKTogdm9pZCB7XHJcbiAgICB2YXIgdG9rZW4gPSB0aGlzLmFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xyXG4gICAgdGhpcy5vYXV0aERhdGEuaXNBdXRoZW50aWNhdGVkID0gdG9rZW4gIT09IG51bGwgJiYgdG9rZW4ubGVuZ3RoID4gMDtcclxuICAgIHZhciB1c2VyID0gdGhpcy5hZGFsLmdldENhY2hlZFVzZXIoKSB8fCB7IHVzZXJOYW1lOiAnJywgcHJvZmlsZTogbnVsbCB9O1xyXG4gICAgdGhpcy5vYXV0aERhdGEudXNlck5hbWUgPSB1c2VyLnVzZXJOYW1lO1xyXG4gICAgdGhpcy5vYXV0aERhdGEucHJvZmlsZSA9IHVzZXIucHJvZmlsZTtcclxuICAgIHRoaXMub2F1dGhEYXRhLmxvZ2luRXJyb3IgPSB0aGlzLmFkYWwuZ2V0TG9naW5FcnJvcigpO1xyXG4gIH1cclxuXHJcbiAgaGFzaEhhbmRsZXIoaGFzaDogc3RyaW5nLCByZWRpcmVjdEhhbmRsZXI6IEZ1bmN0aW9uLCBpc05vdENhbGxiYWNrSGFuZGxlcjogRnVuY3Rpb24sIG5leHRIYW5kbGVyOiBGdW5jdGlvbik6IHZvaWQge1xyXG4gICAgaWYgKHRoaXMuYWRhbC5pc0NhbGxiYWNrKGhhc2gpKSB7XHJcbiAgICAgIGxldCByZXF1ZXN0SW5mbyA9IHRoaXMuYWRhbC5nZXRSZXF1ZXN0SW5mbyhoYXNoKTtcclxuICAgICAgXHJcbiAgICAgIHRoaXMuYWRhbC5zYXZlVG9rZW5Gcm9tSGFzaChyZXF1ZXN0SW5mbyk7XHJcblxyXG4gICAgICBpZiAocmVxdWVzdEluZm8ucmVxdWVzdFR5cGUgIT09IHRoaXMuYWRhbC5SRVFVRVNUX1RZUEUuTE9HSU4pIHtcclxuICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sgPSB3aW5kb3cucGFyZW50LkF1dGhlbnRpY2F0aW9uQ29udGV4dCgpLmNhbGxiYWNrO1xyXG4gICAgICAgIGlmIChyZXF1ZXN0SW5mby5yZXF1ZXN0VHlwZSA9PT0gdGhpcy5hZGFsLlJFUVVFU1RfVFlQRS5SRU5FV19UT0tFTikge1xyXG4gICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrID0gd2luZG93LnBhcmVudC5jYWxsQmFja01hcHBlZFRvUmVuZXdTdGF0ZXNbcmVxdWVzdEluZm8uc3RhdGVSZXNwb25zZV07XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBSZXR1cm4gdG8gY2FsbGJhY2sgaWYgaXQgaXMgc2VudCBmcm9tIGlmcmFtZVxyXG4gICAgICBpZiAocmVxdWVzdEluZm8uc3RhdGVNYXRjaCkge1xyXG4gICAgICAgIGlmICh0eXBlb2YgdGhpcy5hZGFsLmNhbGxiYWNrID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAgICAgICAvLyBDYWxsIHdpdGhpbiB0aGUgc2FtZSBjb250ZXh0IHdpdGhvdXQgZnVsbCBwYWdlIHJlZGlyZWN0IGtlZXBzIHRoZSBjYWxsYmFja1xyXG4gICAgICAgICAgaWYgKHJlcXVlc3RJbmZvLnJlcXVlc3RUeXBlID09PSB0aGlzLmFkYWwuUkVRVUVTVF9UWVBFLlJFTkVXX1RPS0VOKSB7XHJcbiAgICAgICAgICAgIC8vIElkdG9rZW4gb3IgQWNjZXN0b2tlbiBjYW4gYmUgcmVuZXdlZFxyXG4gICAgICAgICAgICBpZiAocmVxdWVzdEluZm8ucGFyYW1ldGVyc1snYWNjZXNzX3Rva2VuJ10pIHtcclxuICAgICAgICAgICAgICB0aGlzLmFkYWwuY2FsbGJhY2sodGhpcy5hZGFsLl9nZXRJdGVtKHRoaXMuYWRhbC5DT05TVEFOVFMuU1RPUkFHRS5FUlJPUl9ERVNDUklQVElPTiksIHJlcXVlc3RJbmZvLnBhcmFtZXRlcnNbJ2FjY2Vzc190b2tlbiddKTtcclxuICAgICAgICAgICAgICByZXR1cm4gbmV4dEhhbmRsZXIoKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydpZF90b2tlbiddKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5hZGFsLmNhbGxiYWNrKHRoaXMuYWRhbC5fZ2V0SXRlbSh0aGlzLmFkYWwuQ09OU1RBTlRTLlNUT1JBR0UuRVJST1JfREVTQ1JJUFRJT04pLCByZXF1ZXN0SW5mby5wYXJhbWV0ZXJzWydpZF90b2tlbiddKTtcclxuICAgICAgICAgICAgICByZXR1cm4gbmV4dEhhbmRsZXIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBub3JtYWwgZnVsbCBsb2dpbiByZWRpcmVjdCBoYXBwZW5lZCBvbiB0aGUgcGFnZVxyXG4gICAgICAgICAgdGhpcy51cGRhdGVEYXRhRnJvbUNhY2hlKHRoaXMuYWRhbC5jb25maWcubG9naW5SZXNvdXJjZSk7XHJcbiAgICAgICAgICBpZiAodGhpcy5vYXV0aERhdGEudXNlck5hbWUpIHtcclxuICAgICAgICAgICAgLy9JRHRva2VuIGlzIGFkZGVkIGFzIHRva2VuIGZvciB0aGUgYXBwXHJcbiAgICAgICAgICAgIGxldCBzZWxmID0gdGhpcztcclxuXHJcbiAgICAgICAgICAgIHNlbGYudXBkYXRlRGF0YUZyb21DYWNoZShzZWxmLmFkYWwuY29uZmlnLmxvZ2luUmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAvLyByZWRpcmVjdCB0byBsb2dpbiByZXF1ZXN0ZWQgcGFnZVxyXG4gICAgICAgICAgICB2YXIgbG9naW5TdGFydFBhZ2UgPSBzZWxmLmFkYWwuX2dldEl0ZW0oc2VsZi5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLlNUQVJUX1BBR0UpO1xyXG4gICAgICAgICAgICBpZiAobG9naW5TdGFydFBhZ2UpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVkaXJlY3RIYW5kbGVyKGxvZ2luU3RhcnRQYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBUT0RPOiBicm9hZGNhc3QgbG9naW4gc3VjY2Vzcz9cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIFRPRE86IGJyb2FkY2FzdCBsb2dpbiBmYWlsdXJlPyAocmVhc29uOiB0aGlzLmFkYWwuX2dldEl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLkVSUk9SX0RFU0NSSVBUSU9OKSlcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHJldHVybiBpc05vdENhbGxiYWNrSGFuZGxlcigpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgbG9naW5IYW5kbGVyKHBhdGg6IHN0cmluZywgcmVkaXJlY3RIYW5kbGVyOiBGdW5jdGlvbiwgaGFuZGxlcjogRnVuY3Rpb24pIHtcclxuICAgIHRoaXMuYWRhbC5pbmZvKCdMb2dpbiBldmVudCBmb3I6JyArIHBhdGgpO1xyXG5cclxuICAgIGlmICh0aGlzLmFkYWwuY29uZmlnICYmIHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCkge1xyXG4gICAgICByZXR1cm4gcmVkaXJlY3RIYW5kbGVyKHRoaXMuYWRhbC5jb25maWcubG9jYWxMb2dpblVybCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvLyBkaXJlY3RseSBzdGFydCBsb2dpbiBmbG93XHJcbiAgICAgIHRoaXMuYWRhbC5fc2F2ZUl0ZW0odGhpcy5hZGFsLkNPTlNUQU5UUy5TVE9SQUdFLlNUQVJUX1BBR0UsIHBhdGgpO1xyXG4gICAgICB0aGlzLmFkYWwuaW5mbygnU3RhcnQgbG9naW4gYXQ6JyArIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuICAgICAgLy8gVE9ETzogYnJvYWRjYXN0IGxvZ2luIHJlZGlyZWN0P1xyXG4gICAgICB0aGlzLmFkYWwubG9naW4oKTtcclxuICAgICAgcmV0dXJuIGhhbmRsZXIoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbmZpZygpOiBBZGFsQ29uZmlnIHtcclxuICAgIHJldHVybiB0aGlzLmFkYWwuY29uZmlnO1xyXG4gIH1cclxuXHJcbiAgbG9naW4oKSB7XHJcbiAgICB0aGlzLmFkYWwubG9naW4oKTtcclxuICB9XHJcblxyXG4gIGxvZ2luSW5Qcm9ncmVzcygpOiBib29sZWFuIHtcclxuICAgIHJldHVybiB0aGlzLmFkYWwubG9naW5JblByb2dyZXNzKCk7XHJcbiAgfVxyXG5cclxuICBsb2dPdXQoKSB7XHJcbiAgICB0aGlzLmFkYWwubG9nT3V0KCk7XHJcbiAgfVxyXG5cclxuICBnZXRDYWNoZWRUb2tlbihyZXNvdXJjZTogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgIHJldHVybiB0aGlzLmFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xyXG4gIH1cclxuXHJcbiAgZ2V0VXNlckluZm8oKTogYW55IHtcclxuICAgIHJldHVybiB0aGlzLm9hdXRoRGF0YTtcclxuICB9XHJcblxyXG4gIGFjcXVpcmVUb2tlbihyZXNvdXJjZTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgIC8vIGF1dG9tYXRlZCB0b2tlbiByZXF1ZXN0IGNhbGxcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgdGhpcy5hZGFsLmFjcXVpcmVUb2tlbihyZXNvdXJjZSwgKGVycm9yOiBzdHJpbmcsIHRva2VuT3V0OiBzdHJpbmcpID0+IHtcclxuICAgICAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgICAgIHJlamVjdChlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJlc29sdmUodG9rZW5PdXQpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIGFzeW5jIGdldFVzZXIoKTogUHJvbWlzZTxVc2VyPiB7XHJcbiAgICByZXR1cm4gYXdhaXQgbmV3IFByb21pc2U8VXNlcj4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICB0aGlzLmFkYWwuZ2V0VXNlcigoZXJyb3I6IHN0cmluZywgdXNlcjogVXNlcikgPT4ge1xyXG4gICAgICAgIGlmIChlcnJvcikge1xyXG4gICAgICAgICAgcmVqZWN0KGVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmVzb2x2ZSh1c2VyKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBnZXRSZXNvdXJjZUZvckVuZHBvaW50KGVuZHBvaW50OiBzdHJpbmcpOiBzdHJpbmcge1xyXG4gICAgcmV0dXJuIHRoaXMuYWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KGVuZHBvaW50KTtcclxuICB9XHJcblxyXG4gIGNsZWFyQ2FjaGUoKSB7XHJcbiAgICB0aGlzLmFkYWwuY2xlYXJDYWNoZSgpO1xyXG4gIH1cclxuXHJcbiAgY2xlYXJDYWNoZUZvclJlc291cmNlKHJlc291cmNlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWRhbC5jbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpO1xyXG4gIH1cclxuXHJcbiAgaW5mbyhtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWRhbC5pbmZvKG1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgdmVyYm9zZShtZXNzYWdlOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWRhbC52ZXJib3NlKG1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcblxyXG4gIGlzQXV0aGVudGljYXRlZCgpIHtcclxuICAgIHJldHVybiB0aGlzLm9hdXRoRGF0YS5pc0F1dGhlbnRpY2F0ZWQ7XHJcbiAgfVxyXG59XG5AaW5qZWN0KEF1cmVsaWFBZGFsTWFuYWdlcilcclxuZXhwb3J0IGNsYXNzIEF1cmVsaWFBZGFsQXV0aG9yaXplU3RlcCB7XHJcbiAgXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBhdXJlbGlhQWRhbDogQXVyZWxpYUFkYWxNYW5hZ2VyKSB7XHJcbiAgICBcclxuICB9XHJcblxyXG4gIHJ1bihyb3V0aW5nQ29udGV4dDogTmF2aWdhdGlvbkluc3RydWN0aW9uLCBuZXh0OiBhbnkpOiB2b2lkIHtcclxuICAgIGxldCBoYXNoID0gd2luZG93LmxvY2F0aW9uLmhhc2g7XHJcblxyXG4gICAgcmV0dXJuIHRoaXMuYXVyZWxpYUFkYWwuaGFzaEhhbmRsZXIoaGFzaCwgKHVybDogc3RyaW5nKSA9PiB7XHJcbiAgICAgIC8vIFdhcyBjYWxsYmFja1xyXG4gICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IFJlZGlyZWN0KHVybCkpO1xyXG4gICAgfSwgKCkgPT4ge1xyXG4gICAgICAvLyBXYXMgbm90IGNhbGxiYWNrXHJcbiAgICAgIGxldCBsb2dpblJvdXRlID0gJyc7IC8vIFRPRE86IGdldCBsb2dpbiB1cmwgZnJvbSBhdXJlbGlhQWRhbFxyXG5cclxuICAgICAgaWYgKHJvdXRpbmdDb250ZXh0LmdldEFsbEluc3RydWN0aW9ucygpLnNvbWUoaSA9PiAhIWkuY29uZmlnLnNldHRpbmdzLnJlcXVpcmVBZGFsTG9naW4pKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmF1cmVsaWFBZGFsLmlzQXV0aGVudGljYXRlZCgpKSB7XHJcbiAgICAgICAgICAvLyBOb3QgbG9nZ2VkIGluLCByZWRpcmVjdCB0byBsb2dpbiByb3V0ZVxyXG4gICAgICAgICAgcmV0dXJuIHRoaXMuYXVyZWxpYUFkYWwubG9naW5IYW5kbGVyKHJvdXRpbmdDb250ZXh0LmZyYWdtZW50LCAodXJsOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5leHQuY2FuY2VsKG5ldyBSZWRpcmVjdCh1cmwpKTtcclxuICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuIG5leHQuY2FuY2VsKCdsb2dpbiByZWRpcmVjdCcpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgaWYgKHRoaXMuYXVyZWxpYUFkYWwuaXNBdXRoZW50aWNhdGVkKCkgJiYgcm91dGluZ0NvbnRleHQuZ2V0QWxsSW5zdHJ1Y3Rpb25zKCkuc29tZShpID0+IGkuZnJhZ21lbnQgPT0gbG9naW5Sb3V0ZSkpIHtcclxuICAgICAgICAvLyBMb2dnZWQgaW4sIGN1cnJlbnQgcm91dGUgaXMgdGhlIGxvZ2luIHJvdXRlXHJcbiAgICAgICAgbGV0IGxvZ2luUmVkaXJlY3QgPSAnJztcclxuICAgICAgICByZXR1cm4gbmV4dC5jYW5jZWwobmV3IFJlZGlyZWN0KGxvZ2luUmVkaXJlY3QpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgcmV0dXJuIG5leHQoKTtcclxuICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgIHJldHVybiBuZXh0KCk7XHJcbiAgICAgIH0pO1xyXG4gIH1cclxufVxuQGluamVjdChIdHRwQ2xpZW50LCBBdXJlbGlhQWRhbE1hbmFnZXIpXHJcbmV4cG9ydCBjbGFzcyBBdXJlbGlhQWRhbEZldGNoQ29uZmlnIHtcclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGh0dHBDbGllbnQ6IEh0dHBDbGllbnQsIHByaXZhdGUgYXVyZWxpYUFkYWw6IEF1cmVsaWFBZGFsTWFuYWdlcikge1xyXG5cclxuICB9XHJcblxyXG4gIGNvbmZpZ3VyZSgpIHtcclxuICAgIGxldCBhdXJlbGlhQWRhbCA9IHRoaXMuYXVyZWxpYUFkYWw7XHJcblxyXG4gICAgdGhpcy5odHRwQ2xpZW50LmNvbmZpZ3VyZSgoaHR0cENvbmZpZzogSHR0cENsaWVudENvbmZpZ3VyYXRpb24pID0+IHtcclxuICAgICAgaHR0cENvbmZpZ1xyXG4gICAgICAgIC53aXRoRGVmYXVsdHMoe1xyXG4gICAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnQWNjZXB0JzogJ2FwcGxpY2F0aW9uL2pzb24nXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICAud2l0aEludGVyY2VwdG9yKHtcclxuICAgICAgICAgIGFzeW5jIHJlcXVlc3QocmVxdWVzdCk6IFByb21pc2U8UmVxdWVzdD4ge1xyXG4gICAgICAgICAgICBsZXQgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlcXVlc3QudXJsKTtcclxuICAgICAgICAgICAgaWYgKHJlc291cmNlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gcmVxdWVzdDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgbGV0IHRva2VuU3RvcmVkID0gYXVyZWxpYUFkYWwuZ2V0Q2FjaGVkVG9rZW4ocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICBsZXQgaXNFbmRwb2ludCA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRva2VuU3RvcmVkKSB7XHJcbiAgICAgICAgICAgICAgYXVyZWxpYUFkYWwuaW5mbygnVG9rZW4gaXMgYXZhbGlhYmxlIGZvciB0aGlzIHVybCAnICsgcmVxdWVzdC51cmwpO1xyXG4gICAgICAgICAgICAgIC8vIGNoZWNrIGVuZHBvaW50IG1hcHBpbmcgaWYgcHJvdmlkZWRcclxuICAgICAgICAgICAgICByZXF1ZXN0LmhlYWRlcnMuYXBwZW5kKCdBdXRob3JpemF0aW9uJywgJ0JlYXJlciAnICsgdG9rZW5TdG9yZWQpO1xyXG4gICAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGlmIChhdXJlbGlhQWRhbC5jb25maWcpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGVuZHBvaW50VXJsIGluIGF1cmVsaWFBZGFsLmNvbmZpZygpLmVuZHBvaW50cykge1xyXG4gICAgICAgICAgICAgICAgICBpZiAocmVxdWVzdC51cmwuaW5kZXhPZihlbmRwb2ludFVybCkgPiAtMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzRW5kcG9pbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgIC8vIENhbmNlbCByZXF1ZXN0IGlmIGxvZ2luIGlzIHN0YXJ0aW5nXHJcbiAgICAgICAgICAgICAgaWYgKGF1cmVsaWFBZGFsLmxvZ2luSW5Qcm9ncmVzcygpKSB7XHJcbiAgICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdsb2dpbiBhbHJlYWR5IHN0YXJ0ZWQuJyk7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2xvZ2luIGFscmVhZHkgc3RhcnRlZCcpO1xyXG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoYXVyZWxpYUFkYWwuY29uZmlnICYmIGlzRW5kcG9pbnQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGV4dGVybmFsIGVuZHBvaW50c1xyXG4gICAgICAgICAgICAgICAgLy8gZGVsYXllZCByZXF1ZXN0IHRvIHJldHVybiBhZnRlciBpZnJhbWUgY29tcGxldGVzXHJcbiAgICAgICAgICAgICAgICBsZXQgdG9rZW4gPSBhd2FpdCBhdXJlbGlhQWRhbC5hY3F1aXJlVG9rZW4ocmVzb3VyY2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIGF1cmVsaWFBZGFsLnZlcmJvc2UoJ1Rva2VuIGlzIGF2YWxpYWJsZScpO1xyXG4gICAgICAgICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLnNldCgnQXV0aG9yaXphdGlvbicsICdCZWFyZXIgJyArIHRva2VuKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJldHVybiByZXF1ZXN0O1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHJlc3BvbnNlRXJyb3IocmVqZWN0aW9uKTogUmVzcG9uc2Uge1xyXG4gICAgICAgICAgICBhdXJlbGlhQWRhbC5pbmZvKCdHZXR0aW5nIGVycm9yIGluIHRoZSByZXNwb25zZScpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlamVjdGlvbiAmJiByZWplY3Rpb24uc3RhdHVzID09PSA0MDEpIHtcclxuICAgICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSBhdXJlbGlhQWRhbC5nZXRSZXNvdXJjZUZvckVuZHBvaW50KHJlamVjdGlvbi5jb25maWcudXJsKTtcclxuICAgICAgICAgICAgICBhdXJlbGlhQWRhbC5jbGVhckNhY2hlRm9yUmVzb3VyY2UocmVzb3VyY2UpO1xyXG4gICAgICAgICAgICAgIC8vIFRPRE86IGJyb2FkY2FzdCBub3RBdXRob3JpemVkP1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0aW9uO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59XG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlKGZyYW1ld29ya0NvbmZpZzogRnJhbWV3b3JrQ29uZmlndXJhdGlvbiwgY29uZmlnOiBBdXJlbGlhQWRhbENvbmZpZykge1xyXG4gIGxldCBhdXJlbGlhQWRhbDogQXVyZWxpYUFkYWxNYW5hZ2VyID0gZnJhbWV3b3JrQ29uZmlnLmNvbnRhaW5lci5nZXQoQXVyZWxpYUFkYWxNYW5hZ2VyKTtcclxuXHJcbiAgYXVyZWxpYUFkYWwuY29uZmlndXJlKGNvbmZpZyk7XHJcbn0iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
