'use strict';

var AsyncLock = require('../index.js');
var assert = require('assert');

describe('AsyncLock Tests', function(){
	it('Single key test', function(done){
		var lock = new AsyncLock();

		var taskCount = 8;
		var keyCount = 2;
		var finishedCount = 0;

	    var isRunning = {};

	    var taskNumbers = [];
	    for(var i=0; i<taskCount; i++){
	        taskNumbers.push(i);
	    }

	    taskNumbers.forEach(function(number){
	    	var key = number % keyCount;
	        lock.acquire(key, function(cb){
	        	assert(!isRunning[key]);
	        	assert(lock.isBusy() && lock.isBusy(key));

	            var timespan = Math.random() * 10;
	            console.log('task%s(key%s) start, %s ms', number, key, timespan);
	            setTimeout(cb.bind(null, null, number), timespan);
	        }, function(err, result){
	        	if(err){
	        		return done(err);
	        	}

	            console.log('task%s(key%s) done', number, key);

	            isRunning[key] = false;
	            finishedCount++;
	            if(finishedCount === taskCount){
	            	assert(!lock.isBusy());
	            	done();
	            }
	        });
	    });
	});

	it('Multiple keys test', function(done){
		var lock = new AsyncLock();
		var busy1 = false, busy2 = false;

		var finishCount = 0;
		var finish = function(){
			finishCount++;
			if(finishCount === 3){
				done();
			}
		};

	    lock.acquire(1, function(cb){
	    	assert(!busy1);
	    	busy1 = true;

	        var timespan = 10;
	        console.log('task1(key1) start, %sms', timespan);
	        setTimeout(cb, timespan);
	    }, function(err){
	    	if(err){
	    		return done(err);
	    	}

	    	busy1 = false;
	        console.log('task1(key1) done');
	        finish();
	    });

	    lock.acquire(2, function(cb){
	    	assert(!busy2);
	    	busy2 = true;

	        var timespan = 20;
	        console.log('task2(key2) start, %sms', timespan);
	        setTimeout(cb, timespan);
	    }, function(err){
	    	if(err){
	    		return done(err);
	    	}

	    	busy2 = false;
	        console.log('task2(key2) done');
	        finish();
	    });

	    lock.acquire([1, 2], function(cb){
	    	assert(!busy1 && !busy2);
	    	busy1 = busy2 = true;

	        var timespan = 10;
	        console.log('task3(key1&2) start, %sms', timespan);
	        setTimeout(cb, timespan);
	    }, function(err){
	    	if(err){
	    		return done(err);
	    	}
	    	busy1 = busy2 = false;

	        console.log('task3(key1&2) done');
	        finish();
	    });
	});

	it('Time out test', function(done){
		var lock = new AsyncLock({timeout : 10});

		lock.acquire('key', function(cb){
			setTimeout(function(){
				cb(); //Should not called twice
				done();
			}, 20);
		}, function(err){
			assert(err);
		});
	});
});
