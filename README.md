ngService
=========

ngService is a service, connection, and offline storage manager for your angular apps. It handles service queuing of blocking, cancellable, caching service responses persistently with stores, and using the same $resource api you are used to. It also manages connection state of the application for determining if the app has a connection or not, and manages service caching and offline storage that can be custom for each service or defaulted to an overall list of stores.

## Why do we need ngService? ##
Web apps today are often not dealing with the lack of connection to the user providing a poor user experience when offline due to the difficulty of developing an offline solution for the web app. ngService simplifies and automates that process allowing powerful configuration and an easy and intuitive solution to these complex problems.

	angular.module('app', ['ngService']);

**[TODO]** ngService uses the $options

- blocking
- cancellable
- cacheBuster
- throttle // the number of ms that have to exist between these calls. handy for use with type ahead functionality and throttling calls to the server.

**[TODO]** make store option (like $resource) that will make a service that only uses the stores and not the $resource from angular.
**[TODO]** $live for realitime communication. pubnub.

**[TODO]** what can be broken out into workers?

**[TODO]** use https://github.com/Reactive-Extensions/RxJS to make so anyone can subscribe to the data stream, they can then with the event call preventDefault, cancel, or the like to kill it.
  
 