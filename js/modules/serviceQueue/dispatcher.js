(function () {
    'use strict';

    angular.module('uxService').factory('dispatcher', ['$rootScope', function ($rootScope) {
        return function dispatcher(instance) {
            var scope = (instance.scope || $rootScope),
                method = instance.scope ? '$emit' : '$broadcast';
            function dispatch() {
                scope[method].apply(scope, arguments);
            }
            instance.dispatch = dispatch;
        };
    }]);
}());