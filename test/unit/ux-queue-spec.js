describe("ux-queue", function () {

    var injector = angular.injector(['app']),
        queue;

    beforeEach(function () {
        queue = injector.get('queue')([], 'testQueue');
    });

    it("add should add items to the queue", function() {
        queue.add({});
        expect(queue.length()).toBe(1);
    });

    it("remvoe should remove an item from the queue", function() {
        var item = {};
        queue.add(item);
        queue.remove(item);
        expect(queue.length()).toBe(0);
    });

    it("data should be able to replace the internal array", function() {
        var ary = [1, 2, 3];
        queue.data(ary);
        expect(queue.data()).toBe(ary);
    });

    it("first should return the first item", function() {
        queue.data([1,2,3]);
        expect(queue.first()).toBe(1);
    });

    it("getItemWith should get the first item that matches the property value", function() {
        var found;
        queue.data([
            {id:'1', name:'test'},
            {id:'2', name:'test'},
            {id:'3', name:'test'},
            {id:'2', name:'test2'}
        ]);
        found = queue.getItemWith('id', '2');
        expect(found.name).toBe('test');
    });

    it("getItemWith should walk a deep path to find a property value match", function() {
        var found;
        queue.data([
            {id:'1', profile: { name:'test'} },
            {id:'2', profile: { name:'test'} },
            {id:'3', profile: { name:'test'} },
            {id:'2', profile: { name:'test2'} }
        ]);
        found = queue.getItemWith('profile.name', 'test2');
        expect(found.id).toBe('2');
    });
});