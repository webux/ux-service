(function() {
    'use strict';

    function ObjectKeys() {

        function each(obj, callback) {
            var i = 0, len;
            if (obj.hasOwnProperty('length')) {
                len = obj.length;
                while (i < len) {
                    callback(obj[i], i, obj);
                    i += 1;
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        callback(obj[i], i, obj);
                    }
                }
            }
        }

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
            var result = angular.toJson(orderObjectProperties(obj));
            result = result.split('\\').join('');
            result = result.split('"{').join('{');
            result = result.split('}"').join('}');
            return result;
        }

        function keyToObject(key) {
            return angular.fromJson(key);
        }

        function walkPath(target, path) {
            var parts = path.split('.'), i = 0, len = parts.length;
            while(i < len && target.hasOwnProperty(parts[i])) {
                target = target[parts[i]];
                i += 1;
            }
            return target;
        }

        function hasPath(target, path) {
            var parts = path.split('.'), i = 0, len = parts.length;
            while(i < len && target.hasOwnProperty(parts[i])) {
                target = target[parts[i]];
                i += 1;
            }
            return i === len;
        }

        function removePath(target, path) {
            var parts = path.split('.'), i = 0, len = parts.length;
            while(i < len && target.hasOwnProperty(parts[i])) {
                if (i === len - 1) {
                    delete target[parts[i]];
                } else {
                    target = target[parts[i]];
                }
                i += 1;
            }
        }

        function setPathValue(target, path, value) {
            var parts = path.split('.'), endProp = parts.pop(),
                obj = walkPath(target, parts.join('.'));
            obj[endProp] = value;
        }

        function copyPath(target, path, result) {
            var parts = path instanceof Array ? path : path.split('.'), key;
            result = result || {};
            if (parts.length) {
                key = parts.shift();
                target = target[key];
                if (!result.hasOwnProperty(key)) {
                    result[key] = createNew(target);
                }
                return copyPath(target, parts, result[key]);
            }
            return parts;
        }

        function createNew(target) {
            var type = typeof target;
            if (type === "array") {
                return [];
            } else if (type === "object") {
                return {};
            }
            return target; // must be string or int.
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
                each(filter, function (property) {
                    if (!hasPath(data, property)) {
                        copyPath(params, property, data);
                    }
                });
            } else {
                data = angular.copy(params);
            }
            return data;
        }

        this.each = each;
        this.objectToKey = objectToKey;
        this.keyToObject = keyToObject;
        this.walkPath = walkPath;
        this.hasPath = hasPath;
        this.removePath = removePath;
        this.copyPath = copyPath;
        this.setPathValue = setPathValue;
        this.filter = filter;
    }

    angular.module('ngCache').service('objectKeys', function () {
        return new ObjectKeys();
    });

}());