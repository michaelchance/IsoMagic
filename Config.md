Config
------

The config object is the soul of your application.
```javascript
{
	"extensions" : [], // Required. Array of Extension Config objects that tell IsoMagic how to load your installed extensions.  Without these, IsoMagic doesn't do much!
	"routes" : [], // Required. Array of Route Config objects that tell IsoMagic how to mount extension middleware to particular routes.  Also needed to do something interesting!
	"static" : {"root":".","options":{"index":false}}, // Optional, default shown. The base path that your application will handle requests on.
	"basePath" : "/", // Optional, default shown. The base path that your application will handle requests on.
	"document" : "index.html", // Optional, default shown. The file that gets loaded for processing by the middleware.
	"browserEvents" : ["click","submit","mouseenter","mouseleave","change"] //Optional, default shown.  An array of browser events that IsoMagic will capture and process for you with TLC modules
}
```