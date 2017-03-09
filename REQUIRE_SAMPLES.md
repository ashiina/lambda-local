## Samples for API

#### Basic: In another node.js script

```js
const lambdaLocal = require('lambda-local');

var jsonPayload = {
    'key': 1,
    'another_key': "Some text"
}

lambdaLocal.execute({
    event: jsonPayload,
    lambdaPath: path.join(__dirname, 'path_to_index.js'),
    profilePath: '~/.aws/credentials',
    profileName: 'default',
    timeoutMs: 3000,
    callback: function(err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log(data);
        }
    }
});
```

##### Using Promises

```js
const lambdaLocal = require('lambda-local');

var jsonPayload = {
    'key': 1,
    'another_key': "Some text"
}

lambdaLocal.execute({
    event: jsonPayload,
    lambdaPath: path.join(__dirname, 'path_to_index.js'),
    profilePath: '~/.aws/credentials',
    profileName: 'default',
    timeoutMs: 3000
}).then(function(done) {
    console.log(done);
}).catch(function(err) {
    console.log(err);
});
```

### Use lambda-local to Mock

You can use Lambda local to mock your lambda then run it, using [MochaJS][1] and [SinonJS][2]

In this sample, we assume that you got a test function like this:
```js
/*
 * Lambda function used to test mocking.
 */
exports.getData = function getData(){
	return "WrongData";
}
exports.handler = function(event, context) {
    context.done(null, exports.getData()); 
};
```

Then you will be able to use in your test.js mocha file, something like:

```js

    //An empty event
    var jsonPayload = {
    
    }

    var done, err;
    before(function (cb) {
        var lambdalocal = require('lambda-local');
        lambdalocal.setLogger(your_winston_logger);
        var lambdaFunc = require("path_to_test-function.js");
        //For instance, this will replace the getData content
        sinon.mock(lambdaFunc).expects("getData").returns("MockedData"); 
        //see on sinonjs page for more options
        lambdalocal.execute({
            event: jsonPayload,
            lambdaFunc: lambdaFunc, //We are directly passing the lambda function
            lambdaHandler: "handler",
            callbackWaitsForEmptyEventLoop: true,
            timeoutMs: 3000,
            callback: function (_err, _done) { //We are storing the results and finishing the before() call => one lambda local call for multiple tests
                err = _err;
                done = _done;
                cb();
            }
        });
    });
    describe("Your first test", function () {
        it("should return mocked value", function () {
            assert.equal(done, "MockedData");
        });
    });
    ... Other tests
```

[1]: https://mochajs.org/
[2]: http://sinonjs.org/
