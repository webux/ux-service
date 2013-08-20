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
            expect(cache.get('key')).toBeDefined();
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
                    {url:'pagination', params: {"page":0}},
                    {url:'pagination', params: {"page":1}},
                    {url:'pagination', params: {"page":2}}
                ],
                responses = [
                    {
                        "offset": 0,
                        "items": [
                            {"name": "item 1"},
                            {"name": "item 2"},
                            {"name": "item 3"},
                            {"name": "item 4"}
                        ]
                    },
                    {
                        "offset": 4,
                        "items": [
                            {"name": "item 5"},
                            {"name": "item 6"},
                            {"name": "item 7"},
                            {"name": "item 8"}
                        ]
                    },
                    {
                        "offset": 8,
                        "items": [
                            {"name": "item 9"},
                            {"name": "item 10"},
                            {"name": "item 11"},
                            {"name": "item 12"}
                        ]
                    }
                ];

            beforeEach(function () {
                cacheManager.destroy('test');
                cache = cacheManager.create('test', {
                    paramsFilter: ['url'],
                    pagination: {
                        offset: 'offset',
                        list: 'items'}
                })
            });

            function add3() {
                cache.set(keys[0], responses[0]);
                cache.set(keys[1], responses[1]);
                cache.set(keys[2], responses[2]);
                return cache.get(keys[0]);
            }

            it("should store the first paginated result in a new cache entry.", function () {
                cache.set(keys[0], responses[0]);
                var result = cache.get(keys[0]);
                expect(result.items.length).toBe(responses[0].items.length);
                expect(result.items[0].name).toBe(responses[0].items[0].name);
            });

            it("should store the second paginated result in the same cache entry.", function () {
                cache.set(keys[0], responses[0]);
                cache.set(keys[1], responses[1]);
                var result = cache.get(keys[0]).items, len = responses[0].items.length + responses[1].items.length
                expect(result.length).toBe(len);
                expect(result[0].name).toBe(responses[0].items[0].name);
                expect(result[len - 1].name).toBe(responses[1].items[responses[1].items.length - 1].name);
            });

            it("should store the third paginated result in the same cache entry.", function () {
                var result = add3(), len = responses[0].items.length + responses[1].items.length + responses[2].items.length;
                expect(result.items.length).toBe(len);
                expect(result.items[0].name).toBe(responses[0].items[0].name);
                expect(result.items[len - 1].name).toBe(responses[2].items[responses[2].items.length - 1].name);
            });

            it("should store the correct amount of memory for 3 paginated requests", function () {
                var obj = {offset:0, items:[]},
                    sizeUtil = injector.get('sizeUtil'),
                    result = add3();
                obj.items = obj.items.concat(responses[0].items, responses[1].items, responses[2].items);
                expect(sizeUtil.getSize(obj)).toBe('1.02K');
                expect(sizeUtil.getSize(result)).toBe('1.02K');
            });
        });
    });
});
