# async-lock

Lock on asynchronous code

[![Build Status](https://travis-ci.org/rain1017/async-lock.svg?branch=master)](https://travis-ci.org/rain1017/async-lock)
[![Dependencies Status](https://david-dm.org/rain1017/async-lock.svg)](https://david-dm.org/rain1017/async-lock)

Lock on asynchronous code for concurrency control

* Q supported
* Multiple keys lock supported
* Domain reentrant supported
* Timeout supported
* Pending task limit supported
* 100% code coverage

## Get Started

```
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

/**
 * @param {String|Array} key 	resource key or keys to lock
 * @param {function} fn 	execute function
 * @param {function} cb 	(optional) callback function, otherwise will return a promise
 * @param {Object} opts 	(optional) options
 */
lock.acquire(key, function(done){
	// async work
	done(err, ret);
}, function(err, ret){
	// lock released
}, opts);

// Promise mode
lock.acquire(key, function(){
	// return value or promise
}, opts).then(function(){
	// lock released
});
```

## Error Handling

```
// Callback mode
lock.acquire(key, function(done){
	done(new Error('error'));
}, function(err, ret){
	console.log(err.message) // output: error
});

// Promise mode
lock.acquire(key, function(){
	throw new Error('error');
}).catch(function(err){
	console.log(err.message) // output: error
});
```

## Acquire multiple keys

```
lock.acquire([key1, key2], fn, cb);
```

## Domain reentrant lock

Lock is reentrant in the same domain

```
var domain = require('domain');
var lock = new AsyncLock({domainReentrant : true});

var d = domain.create();
d.run(function(){
	lock.acquire('key', function(){
		//Enter lock
		return lock.acquire('key', function(){
			//Enter same lock twice
		});
	});
});
```

## Options

```
// Specify timeout
var lock = new AsyncLock({timeout : 5000});
lock.acquire(key, fn, cb, function(err, ret){
	// timed out error will be returned here if fn has not return within given time
});

// Specify timeout for one function
lock.acquire(key, fn, cb, {timeout : 5000});

// Set max pending tasks
var lock = new AsyncLock({maxPending : 1000});
lock.acquire(key, fn, cb, function(err, ret){
	// Handle too much pending error
})

// Whether there is any running or pending async function
lock.isBusy();

// Use your own promise
var lock = new AsyncLock({Promise : require('bluebird')});
```


## License
(The MIT License)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
