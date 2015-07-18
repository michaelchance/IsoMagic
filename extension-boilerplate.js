/******************************************************************************
 * @module isomagic-boilerplate
 *
 * A boilerplate IsoMagic extension
 * 		
 * @param {string} foo an example argument
 * 
 * tlc:
 * 
 * middleware:
 *		checkpage - checks the current page that the app is on, and if it is identical to the req.originalUrl, halts the middleware chain, otherwise, proceeds.
 *		[builder] usetemplate - {"templateid":"sometemplate"} attaches this templateid to the res
 *		[builder] setdata - {"data":{...}} attaches this data object to the res
 *		showpage - if the res has an attached templateid (data object optional), renders that template using the data into the bodySelector on the page, and sets res.handled to true
 *
 *****************************************************************************/

(function(){
	//Begin by changing the id of your extension here.  It must be unique, and it must be a valid 
	//javascript variable name, since it is stored in window[extensionid] on the client.  This is also
	//the id that will be referenced in your config.js
	var extensionid = "boilerplate";
	
	var extension = function(_app, config){
		var selector = config.bodySelector || 'body'
		var templates = {};
		var r = {
			tlc : {
			/*
				//Sample TLC command, just logs the focus var for the context
				simplecommand : function(context){
					console.log(context.focus());
					}
			*/
				},
			middleware : {
			/*
				//Express style middleware, plain and simple
				next : function(req,res,next){
					next();
					}
			*/
				},
			middlewareBuilders : {
			/*
				//middlewareBuilders are functions that return middleware when passed some options.  Use these
				//to build dynamic middleware, and write less javascript.  This example stores some arbitrary
				//json data from the config file in res.data.  Maybe somewhere down the line that data gets used
				setdata : function(opts){
					return function(req,res,next){
						res.data = opts.data;
						next();
						};
					}
			*/
				}
			}
		return r;
		}
	// Only Node.JS has a process variable that is of [[Class]] process 
	var isNode = false;
	try {isNode = Object.prototype.toString.call(global.process) === '[object process]';} catch(e) {}
	if(isNode){	root = {};}
	else {root = window;}
	
	if(isNode){
		module.exports = extension;
		}
	else {
		window[extensionid] = extension;
		}
	
	})()