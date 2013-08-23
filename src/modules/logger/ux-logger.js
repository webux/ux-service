/* Copyright 2012 by Gordon Food Service, Inc.
 *
 * All rights reserved.
 *
 * This software is the confidential and proprietary information of Gordon
 * Food Service, Inc. ("Confidential Information"). You shall not disclose
 * such Confidential Information and shall use it only in accordance with
 * the terms specified by Gordon Food Service.
 *
 */
/**
 * Allow global logging.
 */
/*global window, SimpleLogger, ui, console, _, navigator, angular */
(function () {
    'use strict';
    window.SimpleLogger = function (targetScope, styles) {
        if (targetScope) {
            this.applyToScope(targetScope, styles);
        }
    };

    function toArray(obj) {
        var result = [], i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                result.push(obj[i]);
            }
        }
        return result;
    }
    SimpleLogger.toArray = toArray;
    SimpleLogger.levels = {
        OFF: 0,
        DEBUG: 1,
        INFO: 2,
        WARN: 3,
        ERROR: 4
    };
    SimpleLogger.labels = {
        '0': 'OFF',
        '1': 'DEBUG',
        '2': 'INFO',
        '3': 'WARN',
        '4': 'ERROR'
    };
    SimpleLogger.queue = [];
    SimpleLogger.add = function (scope, name, args) {
        if (!SimpleLogger._forceFlush) {
            SimpleLogger.queue.unshift({scope: scope, name: name, args: args});
            while (SimpleLogger.queue.length > SimpleLogger.queueLimit) {
                SimpleLogger.queue.pop();
            }
        }
    };
    SimpleLogger.queueLimit = 1000;
    SimpleLogger.flush = function () {
        SimpleLogger._forceFlush = true;
        while (SimpleLogger.queue.length) {
            var log = SimpleLogger.queue.pop();
            if (log.scope && log.scope.hasOwnProperty(log.name)) {
                log.scope[log.name].apply(log.scope, log.args);
            }
        }
        SimpleLogger._forceFlush = false;
    };
    SimpleLogger.isFF = function () {
        return (/Firefox/).test(navigator.userAgent);
    };
    SimpleLogger.isChrome = function () {
        return (/Chrome/).test(navigator.userAgent);
    };
    SimpleLogger.logLevel = SimpleLogger.levels.OFF;
    // set the log level for each component. Key must match the object __name property
    // or it will not log.
    SimpleLogger.debuggers = SimpleLogger.debuggers || {};
    // this comment left here as an example of how to use.
//    SimpleLogger.debuggers = {
//        MultiRoute:                     SimpleLogger.levels.DEBUG,
//        MultiRouteFilters:              SimpleLogger.levels.DEBUG,
//        MultiRouteHistory:              SimpleLogger.levels.DEBUG,
//        MultiRouteParser:               SimpleLogger.levels.DEBUG,
//        MultiRouteQueue:                SimpleLogger.levels.DEBUG,
//        MultiRouteQueueItem:            SimpleLogger.levels.DEBUG,
//        MultiViewUtil:                  SimpleLogger.levels.DEBUG,
//        MultiRouteView:                 SimpleLogger.levels.DEBUG,
//        ServiceQueue:                   SimpleLogger.levels.DEBUG,
//        ConnectionManager:              SimpleLogger.levels.DEBUG,
//        ObjectCacheManager:             SimpleLogger.levels.DEBUG,
//        ObjectCache:                    SimpleLogger.levels.DEBUG
//    };
    SimpleLogger.themes = {
        black: ["color:#000000", "color:#000000", "color:#000000", "color:#000000"],
        grey: ["color:#999999", "color:#666666", "color:#333333;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        red: ["color:#CD9B9B", "color:#CD5C5C", "color:#CC3232;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        green: ["color:#9CBA7F", "color:#78AB46", "color:#45B000;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        teal: ["color:#B4CDCD;", "color:#79CDCD;", "color:#37B6CE;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        blue: ["color:#B9D3EE;", "color:#75A1D0;", "color:#0276FD;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        purple: ["color:#BDA0CB", "color:#9B30FF", "color:#7D26CD;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        orange: ["color:#EDCB62", "color:#FFAA00", "color:#FF8800;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"],
        redOrange: ["color:#FF7640", "color:#FF4900", "color:#BF5930;font-style:italic;font-weight:bold;", "color:#FF0000;font-weight:bold;"]
    };
    SimpleLogger.enableLogging = function (target, styles) {
        return new SimpleLogger(target, styles);
    };
    /**
     * @param {String=} type
     * @param {String=} name
     */
    SimpleLogger.start = function (type, name) {
        var logName,
            level,
            result = [];
        type = type || 'debug';
        level = SimpleLogger.levels[type.toUpperCase()] || SimpleLogger.levels.OFF;
        SimpleLogger.logLevel = SimpleLogger.levels.DEBUG;
        if (name && SimpleLogger.debuggers.hasOwnProperty(name)) {
            SimpleLogger.debuggers[name] = level;
            result.push(name + " = " + SimpleLogger.labels[level]);
        } else {
            for (logName in SimpleLogger.debuggers) {
                if (SimpleLogger.debuggers.hasOwnProperty(logName)) {
                    SimpleLogger.debuggers[logName] = level;
                    result.push(logName + " = " + SimpleLogger.labels[level]);
                }
            }
        }
        return result.join("\n");
    };
    /**
     * @param {String} singleDigitsString string of "00120014" where each interger is 0-4 off - error.
     */
    SimpleLogger.applyDebugValuesAlphabeticallyFromString = function (singleDigitsString) {
        var loggers = [],
            value;
        _.each(SimpleLogger.debuggers, function (value, key) {
            loggers.push({key: key, value: value});
        });
        loggers = _.sortBy(loggers, function (logger) {
            return logger.key.toLowerCase();
        });
        _.each(loggers, function (logger, index) {
            if (singleDigitsString) {
                value = parseInt(singleDigitsString.charAt(index), 10);
                SimpleLogger.debuggers[logger.key] = value;
                if (SimpleLogger.debuggers[logger.key] && SimpleLogger.logLevel) {
                    // if the debug is enabled. log it.
                    console.log('%s log level set to %s', logger.key, SimpleLogger.labels[value]);
                }
            }
        });
    };
    SimpleLogger.getSimpleLoggerName = function (scope) {
        var name, i, len, prefix, result;
        if (!scope.__simpleLoggerName) {
            name = (scope.__name ? scope.__name + "::" : "");
            if (scope._logPrefixes) {
                len = scope._logPrefixes.length;
                for (i = 0; i < len; i += 1) {
                    prefix = scope._logPrefixes[i];
                    result = scope[prefix];
                    name += "(" + (result instanceof Function && result.apply ? result.apply(scope) : result) + ") ";
                }
            }
            scope.__simpleLoggerName = name;
        }
        return scope.__simpleLoggerName;
    };
    SimpleLogger.clear = function () {
        var output = angular.element('.SimpleLoggerOutput');
        if (output.length) {
            output.html('');
        } else if (console && console.log && console.clear) {
            console.clear();
        }
    };
    SimpleLogger._output = null;
    SimpleLogger.setOutput = function (dom) {
        if (dom) {
            SimpleLogger._output = angular.element(dom);
        } else {
            SimpleLogger._output = null;
        }
    };
    SimpleLogger.prototype = {
        applyToScope: function (scope, styles) {
            styles = styles || SimpleLogger.themes.grey; //default color.

            this._applyMethod(scope, 'log', styles[0], SimpleLogger.levels.DEBUG);
            this._applyMethod(scope, 'info', styles[1], SimpleLogger.levels.INFO);
            this._applyMethod(scope, 'warn', styles[2], SimpleLogger.levels.WARN);
            this._applyMethod(scope, 'error', styles[3], SimpleLogger.levels.ERROR);
        },

        _applyMethod: function (scope, name, style, level) {
            var logger = this;
            scope[name] = function () {
                SimpleLogger.add(scope, name, arguments);
                if (SimpleLogger._forceFlush || (SimpleLogger.logLevel && SimpleLogger.debuggers[scope.__name] && SimpleLogger.debuggers[scope.__name] <= level && SimpleLogger.logLevel <= level)) {
                    var args = toArray(arguments),
                        statement = args[0];
                    // ignore the default so it doesn't have a pre-name.
                    if (scope.__name && scope.__name !== 'default') {
                        if (typeof statement !== "string") {
                            statement = "";
                            args.unshift(statement);
                        }
                        statement = statement.split("\t");
                        statement[statement.length - 1] = SimpleLogger.getSimpleLoggerName(scope) + statement[statement.length - 1];
                        statement = statement.join("\t");
                        args[0] = statement;
                    }
                    if (SimpleLogger.isChrome() && typeof statement === "string") {
                        args[0] = "%c" + args[0];
                        args.splice(1, 0, style);
                    }
                    logger.write.apply(logger, args);
                }
            };
        },
        /**
         * Handle logging for this class only if in debug mode.
         */
        write: function () {
            var str = '';
            if (SimpleLogger._output && SimpleLogger._output.length) {
                str = SimpleLogger._output.html();
                str = str.substr(str.length - 1000, str.length);
                SimpleLogger._output.html(toArray(arguments).join(", ") + "\n" + str);
            } else if (console && console.log) {
                if (console.log.apply) {
                    console.log.apply(console, arguments);
                } else {
                    console.log(toArray(arguments).join(", "));
                }
            }
        }
    };
}());