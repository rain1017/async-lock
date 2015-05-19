'use strict';

var AsyncLock = function(opts){
    opts = opts || {};

    this.Promise = opts.Promise || require('q');

    // format: {key : [fn, fn]}
    // queues[key] = null indicates no job running for key
    this.queues = {};

    // domain of current running func {key : fn}
    this.domains = {};

    // lock is reentrant for same domain
    this.domainReentrant = opts.domainReentrant || false;

    this.timeout = opts.timeout || AsyncLock.DEFAULT_TIMEOUT;
    this.maxPending = opts.maxPending || AsyncLock.DEFAULT_MAX_PENDING;
};

AsyncLock.DEFAULT_TIMEOUT = 0; //Never
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
    	deferred = this.Promise.defer();
    }

    opts = opts || {};

    var finished = false;
    var timer = null;
    var self = this;

    var done = function(isLock, err, ret){
    	// Make sure done is only called once
        if(finished){
            return;
        }
        finished = true;

        if(isLock){
	       	clearTimeout(timer);
	        if(self.queues[key].length === 0){
	            delete self.queues[key];
	        }
	        delete self.domains[key];
        }

        //callback mode
        if(!deferred){
        	if(typeof(cb) === 'function'){
        		cb(err, ret);
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

        if(isLock){
        	//run next func
	        if(!!self.queues[key]){
	        	self.queues[key].splice(0, 1)[0]();
	        }
        }
    };

    var exec = function(isLock){
    	if(isLock){
    		self.domains[key] = process.domain;

	    	var timeout = opts.timeout ? opts.timeout : self.timeout;
	    	if(timeout){
	    		timer = setTimeout(done.bind(null, isLock, new Error('async-lock timed out')), timeout);
	    	}
    	}

	    // Callback mode
	    if(fn.length === 1){
	    	fn(done.bind(null, isLock));
	    }
        else{
        	// Promise mode
        	self.Promise.try(function(){
        		return fn();
        	})
        	.nodeify(done.bind(null, isLock));
        }
    };
    if(!!process.domain){
    	exec = process.domain.bind(exec);
    }

    if(!self.queues[key]){
        self.queues[key] = [];
        exec(true);
    }
    else if(self.domainReentrant && !!process.domain && process.domain === self.domains[key]){
    	// If code is in the same domain of current running task, run it directly
    	// Since lock is re-enterable
    	exec(false);
    }
    else if(self.queues[key].length >= self.maxPending){
    	done(false, new Error('Too much pending tasks'));
    }
    else{
    	self.queues[key].push(exec.bind(null, true));
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
	if(typeof(cb) !== 'function'){
		opts = cb;
		cb = null;
	}

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

    if(typeof(cb) === 'function'){
    	fnx(cb);
    }
    else{
    	var deferred = Promise.defer();
    	fnx(function(err, ret){
    		if(err){
    			deferred.reject(err);
    		}
    		else{
    			deferred.resolve(ret);
    		}
    	});
    	return deferred.promise;
    }
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

