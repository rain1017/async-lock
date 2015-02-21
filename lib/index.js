'use strict';

var Q = require('q');

var AsyncLock = function(opts){
    opts = opts || {};

    // format: {key : [fn, fn]}
    // queues[key] = null indicates no job running for key
    this.queues = {};

    this.timeout = opts.timeout || AsyncLock.DEFAULT_TIMEOUT;
    this.maxPending = opts.maxPending || AsyncLock.DEFAULT_MAX_PENDING;
};

AsyncLock.DEFAULT_TIMEOUT = 10 * 1000;
AsyncLock.DEFAULT_MAX_PENDING = 1000;

/**
 * Acquire Locks
 *
 * @param {String|Array} key 	resource key or keys to lock
 * @param {function} fn 	async function
 * @param {function} cb 	(optional) callback function, otherwise will return a promise
 * @param {Object} opts 	(optional) options
 */
AsyncLock.prototype.acquire = function(key, fn, cb, opts){
    if(Array.isArray(key)){
        return this._acquireBatch(key, fn, cb, opts);
    }

    if(typeof(fn) !== 'function'){
    	throw new Error('You must pass a function to execute');
    }

    var deferred = null;
    if(typeof(cb) !== 'function'){
    	opts = cb;
    	cb = null;

    	// will return a promise
    	deferred = Q.defer();
    }

    opts = opts || {};

    var finished = false;
    var timer = null;
    var self = this;

    var done = function(err, ret){
    	// Make sure done is only called once
        if(finished){
            return;
        }
        finished = true;

        clearTimeout(timer);

        if(self.queues[key].length === 0){
            delete self.queues[key];
        }

        //callback mode
        if(!deferred){
        	if(typeof(cb) === 'function'){
            	cb.apply(null, arguments);
        	}
        }
        else{
        	//promise mode
        	if(err){
        		deferred.reject(err);
        	}
        	else{
        		deferred.resolve(ret);
        	}
        }

        //run next func
        if(!!self.queues[key]){
        	self.queues[key].splice(0, 1)[0]();
        }
    };

    var exec = function(){
    	var timeout = opts.timeout ? opts.timeout : self.timeout;
        timer = setTimeout(done.bind(null, new Error('async-lock timed out')), timeout);

	    // Callback mode
	    if(fn.length === 1){
	    	fn(done);
	    }
        else{
        	// Promise mode
        	Q.fcall(function(){
        		return fn();
        	}).then(function(ret){
        		done(null, ret);
        	}, function(err){
        		done(err);
        	});
        }
    };

    if(!this.queues[key]){
        this.queues[key] = [];
        exec();
    }
    else{
    	if(this.queues[key].length >= this.maxPending){
    		done(new Error('Too much pending tasks'));
    	}
    	else{
    		this.queues[key].push(exec);
    	}
    }

    if(deferred){
    	return deferred.promise;
    }
};

/*
 * Below is how this function works:
 *
 * Equivalent code:
 * self.acquire(key1, function(cb){
 *     self.acquire(key2, function(cb){
 *         self.acquire(key3, fn, cb);
 *     }, cb);
 * }, cb);
 *
 * Equivalent code:
 * var fn3 = getFn(key3, fn);
 * var fn2 = getFn(key2, fn3);
 * var fn1 = getFn(key1, fn2);
 * fn1(cb);
 */
AsyncLock.prototype._acquireBatch = function(keys, fn, cb, opts){
    var self = this;

    var getFn = function(key, fn){
        return function(cb){
            self.acquire(key, fn, cb, opts);
        };
    };

    var fnx = fn;
    keys.reverse().forEach(function(key){
        fnx = getFn(key, fnx);
    });
    fnx(cb);
};

/*
 *	Whether there is any running or pending asyncFunc
 *
 *	@param {String} key (Optional)
 */
AsyncLock.prototype.isBusy = function(key){
	if(!key){
		return Object.keys(this.queues).length > 0;
	}
	else{
		return !!this.queues[key];
	}
};

module.exports = AsyncLock;

