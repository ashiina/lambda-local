# Lambda-local

[![Build Status](https://travis-ci.org/ashiina/lambda-local.svg?branch=develop)](https://travis-ci.org/ashiina/lambda-local)

Lambda-local lets you test Amazon Lambda functions on your local machine with sample event data.
The `context` of the Lambda function is already loaded so you do not have to worry about it.
You can pass any `event` JSON object as you please.

## Install

```bash
npm install -g lambda-local
```

## Usage

### As a command line tool

You can use Lambda-local as a command line tool.

```bash
# Usage
lambda-local -l index.js -h handler -e event-samples/s3-put.js
```

### In another node.js script

You can also use Lambda local directly in a script. For instance, it is interesting in a [mocha][1] test suite in combination with [istanbull][2] in order to get test coverage.

```js
const lambdaLocal = require('lambda-local');

var jsonPayload = {
    'key1': 'value1',
    'key2': 'value2',
    'key3': 'value3'
}

lambdaLocal.execute({
    event: jsonPayload,
    lambdaPath: path.join(__dirname, 'path/to/index.js'),
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

## About

### Command
*    -l, --lambda-path <lambda index path>            (required) Specify Lambda function file name.
*    -e, --event-path <event path>                    (required) Specify event data file name.
*    -h, --handler <handler name>                     (optional) Lambda function handler name. Default is "handler".
*    -t, --timeout <timeout>                          (optional) Seconds until lambda function timeout. Default is 3 seconds.
*    -n, --no-force-callback                          (optional) Force the function to stop after having called the handler function even if context.done/succeed/fail was not called.
*    -p, --profile <aws profile name>                 (optional) Read the AWS profile to get the credentials from file name.
*    -p, --profile-path <aws profile name>            (optional) Read the specified AWS credentials file.

### Event data
Event sample data are placed in `event-samples` folder - feel free to use the files in here, or create your own event data.
Event data are just JSON objects exported:

```js
// Sample event data
module.exports = {
	foo: "bar"
};
```

### Context
The `context` object has been directly extracted from the source visible when running an actual Lambda function on AWS.
They may change the internals of this object, and Lambda-local does not guarantee that this will always be up-to-date with the actual context object.

### AWS-SDK
Since the Amazon Lambda can load the AWS-SDK npm without installation, Lambda-local has also packaged AWS-SDK in its dependencies.
If you want to use this, please use the "-p" option with the aws credentials file. More infos here:
http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

## API

### LambdLocal

#### `execute(options)`

Executes a lambda given the `options` object where keys are:
- `event` - requested event as a json object,
- `lambdaPath` - requested path to the lambda function,
- `profilePath` - optional path to your AWS credentials file
- `profileName` - optional aws profile name
- `lambdaHandler` - optional handler name, default to `handler`
- `region` - optional AWS region, default to `us-east-1`
- `callbackWaitsForEmptyEventLoop` - optional, default to `true` which forces the function to stop after having called the handler function even if context.done/succeed/fail was not called.
- `timeoutMs` - optional timeout, default to 3000 ms
- `mute` - optional, allows to mute console.log calls in the lambda function, default false
- `callback` - optional lambda third parameter [callback][3]

## License

This library is released under the MIT license.

[1]: https://mochajs.org/
[2]: http://gotwarlost.github.io/istanbul/
[3]: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html

