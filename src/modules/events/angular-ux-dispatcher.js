(function () {
    'use strict';

    angular.module('uxService').factory('dispatcher', ['$rootScope', function ($rootScope) {
        return function dispatcher(instance) {
            var scope = (instance.scope || $rootScope),
                method = instance.scope ? '$emit' : '$broadcast';
            return ux.dispatcher(instance, scope, {on: '$on', off: '$off', dispatch: method});
        };
    }]);

    angular.module('uxService').factory('logDispatcher', ['$rootScope', function ($rootScope) {
        ux.logDispatcher.enableLogging = function (level) {
            $rootScope.$broadcast(ux.logDispatcher.events.LOGGING, level);
        };
        return ux.logDispatcher;
    }]);
}());