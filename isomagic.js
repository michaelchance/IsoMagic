/******************************************************************************
 * @module isomagic
 *
 * IsoMagic is an Isomorphic Javascript Framework based on Express and TLC
 *		 
 * It is designed to be:
 * 		- Easily Extendable
 * 		- Simple Workflows, Extensions are ONLY composed of:
 *			- Middleware
 * 			- TLC formats
 * 		- Maintainable
 * 			- Well structured TLC formats reduce javascript, offloading data translation to the template files
 * 
 * config - see CONFIG.MD
 * 		basePath - string, base path to mount the router on
 * 		document - filepath, the file to load into res.$ server side
 *		static - object, Only matters for server. contains root and options, passed in 
 * 				as express.static(root, options).  Defaults to '' and {}
 * 				if static is passed a deliberate false, the static middleware will not be used
 * 		extensions - Array of extension config objects
 * 		browserEvents - Array of strings, browser events to bind to TLC client side
 * 		routes - Array of Route config objects
 * 			method - http method to bind to, default use
 * 			route | regex - string, route to bind to, default '/'
 * 			middleware - string or object, extension middleware to bind
 * 
 * options
 * 		server - boolean, is this a server? default false;
 * 
 * 	TODO
 * 		triggerClientMiddleware function
 * 		options.pushState - boolean for using window.history api
 *		some form of caching for the document, as well as static files
 *			handle static caching with nginx layer? leave as is for isomagic?
 * 		declaring extension dependencies config.extensions[i].required {Array} throw exception if it's not there
 * 		extension loading- fail after some reasonable timeout (options.extLoadingTimeout?)
 * 		jQuery noConflict support
 * 		handle all the errors!
 * 		Do a bunch of cloning to avoid side effects from dipshits.
 *		res.delay? requeue response later?
 *****************************************************************************/
(function(){

	// Only Node.JS has a process variable that is of [[Class]] process 
	var isNode = false;
	try {isNode = Object.prototype.toString.call(global.process) === '[object process]';} catch(e) {}
	if(isNode){	root = {};}
	else {root = window;}
	
	/** 
	 * @constructor IsoMagic
	 * @param {object} config server configuration, see CONFIG.MD
	 * @param {object} options server options
	 * @param {boolean} options.server are we running on the server?
	 * @param {object} callback to be executed when the app has fully loaded
	 *
	 * @member tlc The tlc instance, with all extension modules added
	 * @member expressapp The express instance server side, or an express-style router on client
	 * @member ext A map with names as keys of all the app's installed extensions
	 * @member httpserver Server-only, the instance of the http server
	 * 
	 * @method server returns boolean of whether it is a server or not
	 * @method navigate Client-only, direct the app to a new url (same as clicking a link)
	 * @method listen Server-only, listen on a given port
	 * @method close Server-only, close the server
	 */
	function IsoMagic(config, options, callback){
		//Store this in a declared var to avoid scoping issues in lambdas, and for clarity.  In this file, _self is ALWAYS the app instance.
		var _self = this;
		
		//Options are, well, optional.  So let's check to see if they passed a function second, and assume that if they did they omitted options
		if(typeof options == 'function'){
			callback = options;
			options = {};
			}
		
		//Set some reasonable defaults
		
		callback = callback || function(){};
		options = options || {};
		
		config.static = typeof config.static != 'undefined' ? config.static : {root:'.',options:{"index":false}}
		if(config.static && !config.static.root){ config.static.root = '.'; }
		if(config.static && !config.static.options){ config.static.options = {"index":false}; }
		if(typeof config.static.options.index !== 'undefined' && !config.static.options.index){config.static.options.index = false;}
		
		config.basePath = config.basePath || '/'
		config.document = config.document || 'index.html'
		config.browserEvents = config.browserEvents || [
			"click",
			"submit",
			"mouseenter",
			"mouseleave",
			"change"
			]
		config.extensions = config.extensions || {},
		config.document = config.document || []
		
		//Making this a function so that it can't be (easily/accidentally) changed as a property.
		//Since JS is weakly typed, this is more of a gesture than an actual security measure.
		//We allow this to be set explicitly so that you can create a client in an environment like NWjs
		var trueFunc = function(){return true;}
		var falseFunc = function(){return false;}
		if(typeof options.server != 'undefined' && options.server){
			_self.server = trueFunc;
			}
		else if(typeof options.server != 'undefined' && !options.server){
			_self.server = falseFunc;
			}
		else if(isNode){
			_self.server = trueFunc;
			}
		else {
			_self.server = falseFunc;
			}
		
		//Instantiate our express instance, or client-side the Router ripped out of express
		if(_self.server()){
			var express = require('express');
			var http = require('http');
			
			_self.expressapp = express();
			_self.httpserver = http.createServer(_self.expressapp);
			}
		else {
			_self.expressapp = new window.Router();
			//Since our 'expressapp' is just a router, we need a final handler, for if a request
			//makes it all the way through the middleware chain without being 'handled' (res.handled = true;)
			//This creates a link element to the original url, and clicks it.
			var finalhandler = function(req){
				var $a = $('<a></a>');
				$a.attr('data-link','outside')
					.attr('href',req.url)
					.attr('target',req.target);
				$a[0].click();
				}
			//Here we funnel all starts to the middleware chain through a setup function that creates the res
			//object.  For now, all it does is set up the "redirect" function, to isomorphically mimic express's
			//built in res.redirect.  The browser client really only cares about get requests, so let's hardcode that for now.
			var handlereq = function(req){
				req.method = 'get';
				var res = {
					redirect : function(url){
						var redir_req ={
							'url':url,
							'method' : 'get'
							};
						var redir_res = this;
						_self.expressapp(redir_req,redir_res,
							function(err){
								if(err){console.error(err);}
								finalhandler(req);
								}
							);
						}
					};
				_self.expressapp(req,res,function(err){
					if(err){console.error(err);}
					finalhandler(req);
					});
				} 
			//Intercept all clicks on elements that might trigger a page reload, and funnel their request through the middleware chain.
			$('body').on('click', 'a[href]:not([data-link=outside]), area[href]:not([data-link=outside])', function(e){
				e.preventDefault();
				var a = this;
				var req = {
					url : a.href,
					target : a.target
					}
				
				// console.log(req);
				if(a.host == window.location.host){
					handlereq(req);
					}
				else {
					finalhandler(req)
					}
				});
			//Expose a utility function for navigating to a page outside of a traditional link click.
			//This essentially replaces `window.location = "http://..."`
			_self.navigate = function(url){
				// console.log('navigate');
				handlereq({'url':url});
				}
			//When the back button is hit, send the req back through the middleware chain.
			window.onpopstate = function(event){
				_self.expressapp(req,{},finalhandler);
				}
			}
		
		//Finally parse our config
		_self._config(config, callback);		
		}
	
	IsoMagic.prototype._config = function(config, callback){
		var _self = this;
		_self._configureExtensions(config, function(){
			_self._configureRouter(config);
			callback(_self);
			});
		}
	
	//configureExtensions is called with an async callback so that the client can load the resources asynchronously.
	IsoMagic.prototype._configureExtensions = function(config, callback){
		// console.log('configuring extensions');
		var _self = this;
		//set up to store extensions inside of _self.ext so that other extensions can directly access each other
		//		Design note: it's not ideal to let extensions be so tightly coupled, but this is real life and sometimes you need it so fuck off.
		_self.ext = {};
		//this array will fill up with true values as everything gets set up, and when it's all true, we'll call the callback
		var complete = new Array(config.extensions.length);
		for(var i in complete){
			complete[i]=false;
			}
		for(var i in config.extensions){
			//set up callback for when extension has loaded.
			var loaded = function(id, ext){
				var finished = true;
				for(var j in config.extensions){
					// console.log(config.extensions[j].id+" "+id);
					if(config.extensions[j].id == id){
						// console.log('loading extension '+id);
						//load the extension and save it in _self.ext.  We also pass in some meaningful config info
						_self.ext[id] = ext(_self, config.extensions[j]);
						}
					else if(!_self.ext[config.extensions[j].id]){
						//we found an extension that hasn't been instantiated, so we're not done
						finished = false;
						}
					else {
						continue;
						}
					}
				if(finished){
					callback();
					}
				}
			if(_self.server()){
				//we're not asynchronous here, so just call the callback
				var ext = require(config.extensions[i].require);
				loaded(config.extensions[i].id, ext);
				}
			else{
				//There's some anonymous function wizardry here- basically it's to avoid scope issues since we're in a loop.
				//the value of i changes on each iteration, so by passing it into a function that returns a function we're
				//breaking out of the scope.
				$.getScript(config.extensions[i].filePath, (function(idx){
					return function(){
						// console.log(config.extensions[idx].id);
						loaded(config.extensions[idx].id, window[config.extensions[idx].id]);
						}
					})(i));
				}
			}
		//self explanatory
		if(config.extensions.length == 0){
			callback();
			}
		}
	/*
	 * Up till now in the config process, we've just been setting up.  This is the meat of the application
	 * Here, we set up _self.tlc and mount the extensions as tlcModules, 
	 * create a router, and mount the following middleware:
	 *		1) universal middleware, add the document to res.$
	 *				server side, this is cheerio.load of config.document
	 *				client side, this is just the jQuery global
	 *		2) loop through config.routes,
	 *			a) loop through config.routes[i].middleware
	 *				attach config.routes[i].middleware to config.routes[i].route,
	 *
	 *
	 *
	 */
	IsoMagic.prototype._configureRouter = function(config){
		// console.log('configuring router');
		var _self = this;
		
		//universal middleware, add the document to res.$
		//		server side, this is cheerio.load of config.document
		//		client side, this is just the jQuery global
		//Both sides instantiate _self.tlc
		if(_self.server()){
			var TLC = require('tlc');
			var express = require('express');
			var router = express.Router();
			var fs = require('fs');
			var cheerio = require('cheerio');
			_self.tlc = new TLC();
			
			//attach static router if called for.  config defaults already handled
			if(config.static){
				router.use(express.static(config.static.root, config.static.options));
				}
			router.use(function(req,res,next){
				fs.readFile(config.document,function(err,text){
					if(err){
						console.log(err);
						res.status(500);
						//TODO send ISE instead of letting it time out
						}
					else{
						res.$ = cheerio.load(text);
						next();
						}
					});
				});
			}
		else {
			_self.clientRouter = new window.Router();
			_self.tlc = new window.TLC();
			router = new window.Router();
			router.use(function(req,res,next){
				// console.log(req);
				res.$ = $;
				next();
				});
			}
		for(var i in config.extensions){
			var e = config.extensions[i];
			// console.log(_self);
			_self.tlc.addModule(e.id, _self.ext[e.id].tlc);
			}
		
		//Since we're here, we know that 1) all extensions are loaded and 2) _self.tlc is instantiated,
		//so we can set up our event handlers.  For all events in config.browserEvents, when triggered on
		//an element that has an attribute data-app-<event>, the TLC statements in that attribute will get run
		//using the event itself as the data object.
		if(!_self.server()){
			for(var i in config.browserEvents){
				$('body').on(config.browserEvents[i],'[data-app-'+config.browserEvents[i]+']',(function(eventname){
					return function(e){
						// console.log('event!');
						e.preventDefault();
						_self.tlc.run($(this),e,{'tlcAttr':'data-app-'+eventname})
						}
					})(config.browserEvents[i]))
				}					
			}
		//Attach _self.tlc to the res, for utility, and instantiate the data object
		//THIS IS NOT NECESSARY
		router.use(function(req,res,next){
			res.tlc = _self.tlc;
			res.data = {};
			next();
			});
			
		//Mount all the middleware specified in the config.  
		//	Uses whatever method is specified, or "use" as a default
		//		middleware specified as a string, "extname#mwfunc" will come use _self.ext[extname].middleware[mwfunc]
		//	Uses whatever route|regex is specified, or '/' as a default
		//		middleware specified as an object, with "type" : "extname#mwfunc" will pass that object to _self.ext[extname].middlewareBuilders[mwfunc], which should return a middleware function
		//If this is the client, this repeats for clientMiddleware.  This middleware chain is run AFTER the main middleware chain, and only on success.
		for(var i in config.routes){
			// console.log("middleware requested on: "+config.routes[i].route);
			var r = config.routes[i];
			for(var j in r.middleware){
				var mw = r.middleware[j];
				var mw_function;
				if(typeof mw == 'object'){
					var p = mw.type.split('#');
					// console.log(mw.type);
					// console.log(_self.ext[p[0]]);
					mw_function = _self.ext[p[0]].middlewareBuilders[p[1]](mw);
					}
				else if(typeof mw == 'string'){
					var p = mw.split('#');
					mw_function = _self.ext[p[0]].middleware[p[1]];
					}
				// console.log('adding middleware for route: '+r.route);
				// console.log(r.middleware[j]);
				if(r.regex){
					r.route = new RegExp(r.regex);
					}
				r.method = r.method || 'use';
				r.route = r.route || '/';
				// console.log(r.method);
				if(router[r.method]){
					router[r.method](r.route, mw_function);
					}
				else {
					//unsupported method, will be ignored.  
					//Useful for allowing POST's on the server, but ignoring them on the client
					}
				}
			if(!_self.server()){
				// console.log('mounting client middleware');
				// console.log(r["client-middleware"]);
				for(var j in r["client-middleware"]){
					var mw = r["client-middleware"][j];
					var mw_function;
					if(typeof mw == 'object'){
						var p = mw.type.split('#');
						mw_function = _self.ext[p[0]].middlewareBuilders[p[1]](mw);
						}
					else if(typeof mw == 'string'){
						var p = mw.split('#');
						mw_function = _self.ext[p[0]].middleware[p[1]];
						}
					// console.log('adding middleware for route: '+r.route);
					// console.log(r["client-middleware"][j]);
					if(r.regex){
						r.route = new RegExp(r.regex);
						}
					r.method = r.method || 'use';
					r.route = r.route || '/';
					if(_self.clientRouter[r.method]){
						_self.clientRouter[r.method](r.route, mw_function);
						}
					else {
						//as above
						}
					}
				}
			}
		//Lastly, send the document server side / push the window history client side
		//this is done only if res.handled has been set by one of the middleware in the chain!
		router.use(function(req,res,next){
			// console.log('sender');
			// console.log(req);
			if(res.handled){
				if(_self.server()){
					res.send(res.$.html());
					}
				else {
					window.history.pushState({"url":req.originalUrl},'',req.originalUrl);
					req.url = req.originalUrl;
					//On successful completion of the middleware chain, call the clientRouter.
					_app.triggerClientRouter(req,res);
					
					}
				}
			else {
				next();
				}
			});
		
		// console.log(config.basePath);
		//Mount the router onto our main expressapp, now that we've parsed our config
		this.expressapp.use(config.basePath, router);
		}
	
	/**
	 * tell the server to start listening on a given port
	 * @method listen
	 * @param {int} port the port to listen on
	 */
	IsoMagic.prototype.listen = function(port){
		var _self = this;
		if(_self.server()){
			// console.log('listening on port '+port);
			_self.httpserver.listen(port);
			}
		else {
			//The client doesn't need to listen
			}
		}
	
	IsoMagic.prototype.triggerClientRouter = function(req,res){
		if(!_app.server()){
			_self.clientRouter(req,res,function(err){
				if(err){console.error(err);}
				// console.log('clientRouter finished');
				});
			}
		}
	
	
	//expose the code in the appropriate manner
	if(isNode){
		IsoMagic.prototype.close = function(){this.httpserver.close();}
		module.exports = IsoMagic;
		}
	else {
		window.IsoMagic = IsoMagic;
		}
	})()
