IsoMagic
========

An Isomorphic Javascript Framework based on Express and TLC
-----------------------------------------------------------

### What?
* **Isomorphic**- Runs on the Server and the Browser.  Write it once, works on both.
* **Easily Extendable**
* **Simple Workflows**- Express-style middleware, TLC formats, that's it.
* **Maintainable**- Well structured TLC formats reduce javascript, offloading data translation to the template files
	
### How?

Install with npm
`npm install isomagic`

#### Server

Write your index.js
```javascript
//index.js
var config = require('./path/to/config.json'); //configuration object, same object as the client
var IsoMagic = require('isomagic');
var myApp = new IsoMagic(config, function(_app){
	//This callback recieves a reference to the app that has loaded to avoid scoping issues
	_app.listen(3000);
});
```

#### Client

Create your index.html.  There's a few files you're going to need to add to your head:
* jQuery
* the files enclosed in this project's clientrouter/ folder
* tlc.js, available via `npm install tlc` or at https://github.com/michaelchance/tlc
	* tlc requires [`lodash`](https://lodash.com/),[`jsonPath`](https://github.com/s3u/JSONPath), and [`pegjs`](http://pegjs.org/)
* isomagic.js from this project

By default, IsoMagic includes `express.static` middleware pointed at the CWD, so it will
serve those JS files as long as they're in your project, and you use the appropriate path.

```html
<!doctype html>
<html>
<head>
	<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
	<!-- Order is important for the following files -->
	<script type="text/javascript" src="path/to/clientrouter/path-to-regexp.js"></script>
	<script type="text/javascript" src="path/to/clientrouter/layer.js"></script>
	<script type="text/javascript" src="path/to/clientrouter/route.js"></script>
	<script type="text/javascript" src="path/to/clientrouter/index.js"></script>
	<script type="text/javascript" src="path/to/lodash.min.js"></script>
	<script type="text/javascript" src="path/to/jsonpath.js"></script>
	<script type="text/javascript" src="path/to/peg-0.8.0.js"></script>
	<script type="text/javascript" src="path/to/tlc.js"></script>
	<script type="text/javascript" src="path/to/isomagic.js"></script>
	<script type="text/javascript">
		$(function(){
			//jQuery is currently required, so why not use a convenience method to load the config.json file?
			$.getJSON('path/to/config.json', function(config){ // Same config object you loaded on the server
				var myApp = new IsoMagic(config, function(){
					console.log('app has loaded!');
				});
			});
		}); 
	</script>
</head>
<body>
	<h1>Hello World!</h1>
</body>
</html>
```

Alright, we're serving some html!  Next you need to install some [extensions](Extensions.md), and [configure](Config.md) your app

For a simple example app, check out [`isomagic-simpleapp`](https://github.com/michaelchance/isomagic-simpleapp)
