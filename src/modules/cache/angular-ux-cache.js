(function () {
    'use strict';


//TODO: this needs to be on a public namespace to not be completely dependent on angular
    angular.module('uxCache', []).service('cacheManager', function () {
        return new ux.Cache();
    });

    angular.module('uxCache').service('objectKeys', function () {
        return ux.objectKeys;
    });

    angular.module('uxCache').service('sizeUtil', function () {
        return ux.sizeUtil;
    });

    angular.module('uxCache').factory('$store', ['cacheManager', function (cacheManager) {
//TODO: need to decide what store to use when using $store. a store must be provided. Should default be localStorage?
        return function (name, config) {
            return cacheManager.create(name, config);
        }
    }]);

}());
