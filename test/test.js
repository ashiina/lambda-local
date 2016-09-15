'use strict';

var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');

var functionName = 'handler';
var timeoutMs = 3000;

var winston = require("winston");
winston.level="error";

    });
    it('should contain initialized getRemainingTimeInMillis', function() {
      assert.equal((lambdalocal.context.getRemainingTimeInMillis() <= timeoutMs), true);
    });
  });
};

lambdalocal.execute({
  event: require(path.join(__dirname, './test-event.js')),
  lambdaPath: path.join(__dirname, './test-func.js'),
  lambdaHandler: functionName,
  profilePath: path.join(__dirname, './debug.aws'),
  callbackWaitsForEmptyEventLoop: true,
  timeoutMs: timeoutMs,
  callback: callbackFunc
});
        });
    });
});