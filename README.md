# async-lock

Mutex on asynchronous code

[![Build Status](https://travis-ci.org/rain1017/async-lock.svg?branch=master)](https://travis-ci.org/rain1017/async-lock)
[![Dependencies Status](https://david-dm.org/rain1017/async-lock.svg)](https://david-dm.org/rain1017/async-lock)

## Get Started

```
var AsyncLock = require('async-lock');
var lock = new AsyncLock();

/**
 * @param {String|Array} key 	resource key or keys to lock
 * @param {function} fn 	async function with node.js style
 * @param {function} cb 	(optional) callback function
 * @param {Object} opts 	(optional) options
 */
lock.acquire(key, fn, cb, opts);
```

## Acquire multiple keys

```
lock.acquire([key1, key2], fn, cb);
```

## Specify timeout

```
var lock = new AsyncLock({timeout : 5000});
lock.acquire(key, fn, function(err){
	// timed out error will be returned here if fn has not return within given time
});

//Specify timeout for one function
lock.acquire(key, fn, cb, {timeout : 5000});
```

## Get running state

```
// Where there is any running or pending async function
lock.isBusy();
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
