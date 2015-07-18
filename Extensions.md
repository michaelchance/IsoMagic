Extensions
----------

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
