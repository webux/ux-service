(function () {
    'use strict';

    function toArray(obj) {
        var result = [], i = 0, len = obj.length;
        while (i < len) {
            result.push(obj[i]);
            i += 1;
        }
        return result;
    }

    window.ux = window.ux || {};
    window.ux.arrayUtil = window.ux.arrayUtil || {};
    window.ux.arrayUtil.toArray = toArray;
}());