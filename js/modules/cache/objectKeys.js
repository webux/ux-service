(function() {
    'use strict';

    function ObjectKeys() {
        function getKeysInOrder(obj) {
            var ary = [],
                i;
            for(i in obj) {
                if(obj.hasOwnProperty(i)) {
                    ary.push(i);
                }
            }
            return ary.sort();
        }

        function orderObjectProperties(obj) {
            var keysInOrder = getKeysInOrder(obj),
                result = {};
            angular.forEach(keysInOrder, function(key) {
                var value = obj[key];
                if(angular.isObject(value) || angular.isArray(value)) {
                    result[key] = objectToKey(value);
                } else {
                    result[key] = value;
                }
            });
            return result;
        }

        function objectToKey(obj) {
            return angular.toJson(orderObjectProperties(obj));
        }

        function keyToObject(key) {
            return angular.fromJson(key);
        }

        function walkPath(target, path) {
            var parts = path.split('.'),
                i = 0, len = parts.length;
            while(i < len && target.hasOwnProperty(parts[i])) {
                target = target[parts[i]];
                i += 1;
            }
            return target;
        }

        function filter(params, filter) {
            var data = {};
            if (typeof filter === 'function') {
                angular.forEach(params, function (value, key, params) {
                    if (filter(value, key, params)) {
                        data[key] = angular.copy(value);
                    }
                });
            } else if (filter) { // otherwise we assume object.
                angular.forEach(filter, function (property) {
                    data[property] = angular.copy(params[property]);
                });
            }
            return data;
        }

        this.objectToKey = objectToKey;
        this.keyToObject = keyToObject;
        this.walkPath = walkPath;
        this.filter = filter;
    }

    angular.module('ngCache').service('objectKeys', function () {
        return new ObjectKeys();
    });

}());