describe("cache module", function () {
    var injector = angular.injector(['app']),
        cacheManager = injector.get('cacheManager');

    beforeEach(function () {
        cacheManager = injector.get('cacheManager');
    });

    it("should create a new cache object", function () {
        expect(cacheManager.create('test')).toBeDefined();
    });

    it("should return the same cache object", function () {
        var cacheObject = cacheManager.create('test');
        expect(cacheObject).toBe(cacheManager.get('test'));
    });

    it("should clear the cache object", function () {
        var test = cacheManager.get('test'), cleared = false;
        test.removeAll = function () {
            cleared = true;
        };
        cacheManager.clear('test');
        expect(cleared).toBe(true);
    });

    it("destroy should destroy a cache", function () {
        cacheManager.destroy('test');
        expect(cacheManager.get('test')).toBeUndefined();
    });

    describe("cache", function () {

        var cache;
        beforeEach(function () {
            cache = cacheManager.create('test', {});
        });

        it("cache.set should create an entry", function () {
            var value = {};
            cache.set('key', value);
            expect(cache.get('key')).toBe(value);
        });

        it("cache.set should take a object as a key", function () {
            cache.set({foo: "bobsYourUncle"}, 'value');
            expect(cache.get({foo: "bobsYourUncle"})).toBe('value');
        });

        it("cache.remove(key) should remove an entry", function () {
            cache.set('key', 'value');
            cache.remove('key');
            expect(cache.get('key')).toBeUndefined();
        });

        it("cache.removeAll should remove all entries", function () {
            cache.set('key', 'value');
            cache.removeAll();
            expect(cache.get('key')).toBeUndefined();
        });

        it("cache.get Config should return a config object.", function () {
            expect(cache.getConfig().enabled).toBe(true);
        });

        describe("paramsFilter", function () {

            it("cache.set with an object key should filter params using config.paramsFilter as an object", function () {
                var cache = cacheManager.create('filteredCache', {paramsFilter: ['foo']});
                cache.set({foo: "bar", boo: "none"}, 'value');
                expect(cache.get({foo: "bar"})).toBe('value');
            });

            it("cache.set with an object key should filter params using config.paramsFilter as a complex object", function () {
                var cache = cacheManager.create('filteredCache', {paramsFilter: ['foo.foo']});
                cache.set({foo: { foo: "bar"} , boo: {hoo:"none"}}, 'value');
                expect(cache.get({foo: { foo: "bar"}})).toBe('value');
            });

            it("cache.set with an object key should filter params using config.paramsFilter as a function", function () {
                var cache = cacheManager.create('filterCache', {paramsFilter: function(value, property, obj) {
                    if (property === 'foo') {
                        return true;
                    }
                }});
                cache.set({foo: "bar", boo: "none"}, 'value');
                expect(cache.get({foo: "bar"})).toBe('value');
            });

        });

        describe("bytes", function () {
            var cache;
            beforeEach(function () {
                cacheManager.clear('test');
                cache = cacheManager.create('test', {});
            });

            it("getByteSize should return the right size", function () {
                cache.set('key', 'value');
                expect(cache.getBytesSize()).toBe(10);
            });

            it("should keep an accurate accumulation of bytes added", function () {
                cache.set('key', 'value');
                cache.set('key1', 'value');
                expect(cache.getBytesSize()).toBe(20);
            });

            it("should keep an accurate accumulation of bytes when items are overridden", function () {
                cache.set('key', 'value');
                cache.set('key', 'value');
                expect(cache.getBytesSize()).toBe(10);
            });

            it("should keep an accurate accumulation of bytes when items are removed", function () {
                cache.set('key', 'value');
                cache.set('key1', 'value');
                cache.set('key2', 'value');
                cache.remove('key');
                expect(cache.getBytesSize()).toBe(20);
            });
        });

        describe("count", function () {
            var cache;
            beforeEach(function () {
                cacheManager.clear('test');
                cache = cacheManager.create('test', {});
            });

            it("should keep an accurate count of items added", function () {
                cache.set('key', 'value');
                cache.set('key1', 'value');
                expect(cache.getCount()).toBe(2);
            });

            it("should keep an accurate count items overridden", function () {
                cache.set('key', 'value');
                cache.set('key', 'value');
                expect(cache.getCount()).toBe(1);
            });

            it("should keep an accurate count of items removed", function () {
                cache.set('key', 'value');
                cache.set('key1', 'value');
                cache.set('key2', 'value');
                cache.remove('key');
                expect(cache.getCount()).toBe(2);
            });
        });

        describe("elapsed", function () {
            var cache;
            beforeEach(function () {
                cacheManager.clear('test');
                cache = cacheManager.create('test', {});
            });

            it("should store a timestamp when an item is set", function () {
                var now = Date.now();
                cache.set('key', 'value');
                expect(cache.getTime('key')).toBe(now);
            });

            it("should return an accurate amount of time since the value was set", function () {
                cache.set('key', 'value');
                expect(cache.elapsed('key')).toBe(0);
            });
        });

        describe("expired", function () {
            var cache;
            beforeEach(function () {
                cacheManager.clear('test');
                cache = cacheManager.create('test', {expireSeconds: -1})
            });
            it("should not be able to get an expired item", function () {
                cache.set('key', 'value');
                expect(cache.get('key')).toBeUndefined();
            });
        });

        describe("pagination", function () {
            var keys = [
                    'pagination{"page":0}',
                    'pagination{"page":1}',
                    'pagination{"page":2}'
                ],
                responses = [
                    {
                        "limit": 4,
                        "items": [
                            {"name": "item 1"},
                            {"name": "item 2"},
                            {"name": "item 3"},
                            {"name": "item 4"}
                        ]
                    },
                    {
                        "limit": 4,
                        "items": [
                            {"name": "item 1"},
                            {"name": "item 2"},
                            {"name": "item 3"},
                            {"name": "item 4"}
                        ]
                    },
                    {
                        "limit": 4,
                        "items": [
                            {"name": "item 1"},
                            {"name": "item 2"},
                            {"name": "item 3"},
                            {"name": "item 4"}
                        ]
                    }
                ];

            beforeEach(function () {
                cacheManager.clear('test');
                cache = cacheManager.create('test', {paginate: {page: 'page', limit: 'limit', list: 'items'}})
            });

            it("should store the first paginated result in a new cache entry.", function () {
                cache.set(keys[0], responses[0]);
                expect(cache.get(keys[0])).toBe(responses[0]);
            });
        });
    });
});
