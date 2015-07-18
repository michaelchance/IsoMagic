Extensions
==========

It is recommended to use the [boilerplate](extension-boilerplate.js) code to begin writing a new extension

Extensions are functions that adhere to the following rules:
* They recieve 2 arguments
	* `_app` : the instance of the app being loaded
	* `config` : the Extension Config object (see the Config section for more details)
* They are isomorphic, assigning the above function to `module.exports` for nodejs (the server), or `window[extensionName]` for the client
* They return an object that contains:
	* `tlc` : a TLC module (an object containing TLC commands).  For more information, see https://github.com/michaelchance/tlc
	* `middleware` : a bunch of middleware functions that follow the ExpressJS syntax (`function(req,res,next){}`)
	* `middlewareBuilders` (Advanced Magic) : functions that [_return_ middleware functions](http://cdn.meme.am/instances/500x/61322803.jpg).  
		They take an object as an argument, and construct a middleware function for more dynamic use cases

Middleware
----------

Middleware in IsoMagic function exactly as they do in Express.  There are 2 additions to the `res` object that you should be aware of:
* `res.$`: contains a reference to the document being worked with.  
	* Client side, this is just the global jQuery object.  
	* Server side, it is the file (from `config.document`) loaded with `cheerio`, a server side html parser that uses the jQuery API.
* `res.handled`: You MUST set this to true somewhere in your middleware chain if you want the request to be sent.
	* Server side, if `res.handled` is set to false, the contents of `res.$` will not get sent to the client.
	* Client side, if `res.handled` is set to false, the middleware chain will fail, and the link will be treated as if it points to the outside (page reload)

For more details on middleware, check out the [express documentation](http://expressjs.com)

Middleware Builders
-------------------

These are functions that take the object from `config.routes[i].middleware[j]` as an argument, and return a middleware function.
Why is this useful? Well, let's say you have a plain middleware that gets used for all of your pages that takes data from `res.data`
and adds it to the page in some meaningful way.  Now let's say that data is something like a twitter feed for a given user.
You could write another plain middleware that loads tweets for a certain user and adds them to `res.data`, but what about for an arbitrary user?
That's where middlewareBuilders come in.

```javascript
	//our route middleware in our config:
	{"type":"myextension#loadTweets","user":"@StephenAtHome"}
	
	//middlwareBuilder example function, in myextension
	loadTweets : function(opts){
		return function(req,res,next){
			res.data = loadTweets(opts.user);
			}
		}
```

TLC Formats
-----------

For more documentation on TLC formats, see the [TLC documentation](https://github.com/michaelchance/tlc)

