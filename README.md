## ngService ##
ngService is a service queue and offline manager for your angular apps.

	var i = 0;

**[TODO]** ngService uses the $options

- blocking
- cancellable
- cacheBuster
- throttle // the number of ms that have to exist between these calls. handy for use with type ahead functionality and throttling calls to the server.

**[TODO]** what can be broken out into workers?

**[TODO]** use https://github.com/Reactive-Extensions/RxJS to make so anyone can subscribe to the data stream, they can then with the event call preventDefault, cancel, or the like to kill it.
  
 