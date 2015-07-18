Config
======

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

Configuring Extensions
----------------------

Each extension declared must contain 3 things
* `id`: this tells IsoMagic what the extension calls itself.  It must match what the extension binds to in the window.
* `require`: this is what gets passed to `require` on the server.  For npm modules, it's the name, but for homebrewed extensions it may be `"./path/to/myext.js"`
* `filePath`: this is a file path to be used by the client to load the file.

```javascript
{
	"extensions" : [
		{
			"id":"simpleapp",
			"require":"isomagic-simpleapp",
			"filePath":"node_modules/isomagic-simpleapp/simpleapp.js"
		},
		{
			"id":"template",
			"require":"isomagic-template",
			"filePath":"node_modules/isomagic-template/template.js",
			"templateFiles":["templates.html"]
		}
	], 
	"routes" : [...],
	...
}
```

Note that in the above example, the `template` extension has another field, `templateFiles`.  This is because
during loading, this whole object will be passed to the extension.  This allows extensions to be configurable
based on your needs.  Some extensions are more configurable than others, read their documentation for specifics.

Configuring Routes
------------------

Each Route declared has or may have the following properties:
* `middleware` (required): This wouldn't do much without loading some middleware onto the route, would it?
* `method` (default:"get"): The HTTP method that this route attaches to.  Client side, the only method supported is "get", so other methods will be ignored.
* `route`|`regex` (default:"/"): The route (or regex) passed as the first argument to expressapp.use() (or whatever method).
* `client-middleware` (optional): A set of middleware to be run ONLY on the client.  This is bound to a separate router, and gets run only after the main router has finished, and the page has been handled.  This is used for things like starting slideshows, applying jqueryUI elements, and other aspects that need to be "booted up" after a page is recieved from the server, or after the page has been rendered.

```javascript
{
	"extensions" : [...],
	"routes" : [
		{"middleware" : ["simpleapp#checkpage"]},
		{
			"method":"get",
			"route":"/", 
			"middleware" : [
				{"type":"simpleapp#usetemplate", "templateid":"templateOne"}
			]
		},
		{
			"method":"get",
			"route":"/two", 
			"middleware" : [
				{"type":"simpleapp#usetemplate", "templateid":"templateTwo"}
			]
		},
		{"middleware" : ["simpleapp#showpage"]}
	]
}
```

Check the documentation for the extensions you use to see what middleware is available and how to invoke it.
Middleware is referenced in the form `"extensionid#middlewarename"`, as seen above.  Middleware that is referenced
by just a string is "simple" middleware.  Middleware referenced with an object needs to be built by the extension,
and provides some extra functionality.