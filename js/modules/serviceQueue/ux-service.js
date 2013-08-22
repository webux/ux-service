(function () {
    'use strict';

    var isFunction = angular.isFunction;
    var toArray = angular.util.toArray;

    function extractParams(action, args) {
        var a1 = args[0], a2 = args[1], a3 = args[2], a4 = args[3],
            api = {},
            hasBody = action.method == 'POST' || action.method == 'PUT' || action.method == 'PATCH';
        switch (args.length) {
            case 4:
                api.error = a4;
                api.success = a3;
            //fallthrough
            case 3:
            case 2:
                if (isFunction(a2)) {
                    if (isFunction(a1)) {
                        api.success = a1;
                        api.error = a2;
                        break;
                    }

                    api.success = a2;
                    api.error = a3;
                    //fallthrough
                } else {
                    api.params = a1;
                    api.data = a2;
                    api.success = a3;
                    break;
                }
            case 1:
                if (isFunction(a1)) api.success = a1;
                else if (hasBody) api.data = a1;
                else api.params = a1;
                break;
            case 0:
                break;
            default:
                throw "Expected between 0-4 arguments [params, data, success, error], got " +
                    args.length + " arguments.";
        }
        return api;
    }

    function serviceCall(service, handle, response, method, args, onSuccess, onError) {
        var api = {},
            params = extractParams(service.$config.actions[method], args);

        function exec() {
            applyCacheBuster();
            angular.extend(response, handle[method].apply(handle, [api.params.params, api.params.data, api.success, api.error]));
        }

        function applyCacheBuster() {
            var value = getOptionValue(service.$options.cacheBust);// if they want to provide their own cache buster.
            if (value) {
                if (typeof value === 'boolean') {
                    api.params.params.r = performance.now();
                } else if (typeof value === 'object') {
                    angular.extend(api.params.params, value);
                } else {
                    api.params.params.r = value;
                }
            }
        }

        function getOptionValue(option) {
            if (typeof option === 'function') {
                return option(service.$config, params);
            }
            return option;
        }

        function success(result) {
            var args = toArray(arguments);
            args.unshift(api);
            onSuccess.apply(null, args);
            applyResponse(result);
            if (params.success) {
                params.success(api.response, arguments[1]);
            }
        }

        function error(result) {
            var args = toArray(arguments);
            args.unshift(api);
            onError.apply(null, args);
            if (params.error) {
                params.error(args[1]);
            }
        }

        function applyResponse(result) {
            angular.extend(api.response, result);
        }

        api.service = service;
        api.handle = handle;
        api.method = method;
        api.response = response;
        api.success = success;
        api.error = error;
        api.params = params;
        api.$options = service.$options;
        api.exec = exec;

        return api;
    }

    function serviceQueue(connection, queue, $timeout) {
        var api = {name: 'serviceQueue'},
            _config = {

            },
            waitingQueue = queue([], 'waitingQueue'),
            processingQueue = queue([], 'processingQueue');

        function init() {

        }

        function config(value) {
            if (value !== undefined) {
                api.log("update config");
                angular.extend(_config, value);
                connection.config(_config.connection);
            }
            return _config;
        }

        function status() {
            return connection.state();
        }

        function add(service, handle, response, method, args) {
            api.log("\tadd service (%s):%s", service.$config.url, method);
            waitingQueue.add(serviceCall(service, handle, response, method, args, onSuccess, onError));
            if (!processingQueue.length()) {
                processNext();
            }
            return response;
        }

        function filterNext() {

        }

        function processNext() {
            var next,
                svcCall = processingQueue.getItemWith('$options.blocking', true);
            if (svcCall) {
                api.info("\t\t%s is a blocking call. Wait for it to complete before starting next call.", svcCall.service.$config.url);
                return;
            }

            if (waitingQueue.length()) {
                next = waitingQueue.first();
                api.log("\tprocessNext call %s", next.service.name);
                waitingQueue.remove(next);
                processingQueue.add(next);
                if (next.$options.delay) {
                    $timeout(next.exec, next.$options.delay);
                } else {
                    next.exec();
                }
                processNext();
            }
        }

        function onSuccess(service, response, headers) {
            processingQueue.remove(service);
            processNext();
        }

        function onError(service, response) {
            api.warn("service error %s status %s", service.name, response.status);

        }

        api.init = init;
        api.config = config;
        api.add = add;
        api.status = status;
        return api;
    }

    angular.module('uxService', ['ngResource', 'addons']).
        service('$serviceQueue', ['connection', 'queue', 'addons', 'events', 'dispatcher', 'logDispatcher', '$timeout',
            function (connection, queue, addons, events, dispatcher, logDispatcher, $timeout) {
                var instance = serviceQueue(connection, queue, $timeout),
                //TODO: This needs defined externally.
                    addonList = "";//"eventLogger";
                events(instance);
                dispatcher(instance);
                logDispatcher(instance);
                addons(instance, addonList);
                instance.init();
                return instance;
            }]);
}());