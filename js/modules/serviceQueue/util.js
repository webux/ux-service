(function () {
    'use strict';
    angular.util = angular.util || {};
    function toArray(obj) {
        var result = [], i = 0, len = obj.length;
        while (i < len) {
            result.push(obj[i]);
            i += 1;
        }
        return result;
    }

    angular.util.toArray = toArray;
}());