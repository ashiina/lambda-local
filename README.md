# Lambda-local

[![NPM](https://nodei.co/npm/lambda-local.png?compact=true)](https://nodei.co/npm/lambda-local/)

[![Build Status](https://travis-ci.org/ashiina/lambda-local.svg?branch=develop)](https://travis-ci.org/ashiina/lambda-local)
[![Known Vulnerabilities](https://snyk.io/test/github/ashiina/lambda-local/badge.svg)](https://snyk.io/test/github/ashiina/lambda-local)

Lambda-local lets you test **NodeJS Amazon Lambda functions** on your local machine, by providing a simplistic API and command-line tool.

It does not aim to be perfectly feature proof as projects like [serverless-offline](https://github.com/dherault/serverless-offline ) or [docker-lambda](https://github.com/lambci/docker-lambda), but rather to remain **very light** (it still provides a fully built `Context`, handles all of its parameters and functions, and everything is customizable easily).

The main target are unit tests and running lambda functions locally.

## Install

```bash
npm install -g lambda-local
```

## Build

```bash
make build
```
Or
```bash
npm install
npm install --only=dev
npm run build
```

## Usage

- **As an API:** You can also use Lambda local directly in a script. For instance, it is interesting in a [MochaJS][1] test suite in order to get test coverage.
- **As a command line tool:** You can use Lambda-local as a command line tool.

If you're unsure about some definitions, see [Definitions](#about-definitions) for terminology.

## About: API

### LambdaLocal

API accessible with:
```js
const lambdaLocal = require("lambda-local");
```

Or on TypeScript (supported on 1.7.0+):

```js
import lambdaLocal = require("lambda-local");
```

#### `lambdaLocal.execute(options)`

Executes a lambda given the `options` object, which is a dictionary where the keys may be:

| Key name | Description |
| --- | --- |
| `event`|requested event as a json object|
| `lambdaPath`|requested path to the lambda function|
| `lambdaFunc`|pass the lambda function. You cannot use it at the same time as lambdaPath|
| `profilePath`|optional, path to your AWS credentials file|
| `profileName`|optional, aws profile name. Must be used with |
| `lambdaHandler`|optional handler name, default to `handler`|
| `region`|optional, AWS region, default to `us-east-1`|| `callbackWaitsForEmptyEventLoop`|optional, default to `false`. Setting it to True will wait for an empty loop before returning.|
| `timeoutMs`|optional, timeout, default to 3000 ms|
| `environment`|optional, extra environment variables for the lambda|
| `envfile`|optional, load an environment file before booting|
| `envdestroy`|optional, destroy added environment on closing, default to false|
| `verboseLevel`|optional, default 3. Level 2 dismiss handler() text, level 1 dismiss lambda-local text and level 0 dismiss also the result.|
| `callback`|optional, lambda third parameter [callback][1]. When left out a Promise is returned|
| `clientContext`|optional, used to populated clientContext property of lambda second parameter (context)

#### `lambdaLocal.setLogger(logger)`
#### `lambdaLocal.getLogger()`

Those functions allow to access the [winston](https://www.npmjs.com/package/winston) logger used by lambda-local.

## API examples

A lot of examples, especially used among Mocha, may be found in the test files over: [here](https://github.com/ashiina/lambda-local/tree/develop/test)

##### Basic usage: Using Promises

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

#### Basic usage: using callbacks

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
    },
    clientContext: JSON.stringify({clientId: 'xxxx'})
});
```

## About: CLI

### Available Arguments
*    `-l, --lambda-path <lambda index path>`            (required) Specify Lambda function file name.
*    `-e, --event-path <event path>`                    (required) Specify event data file name.
*    `-h, --handler <handler name>`                     (optional) Lambda function handler name. Default is "handler".
*    `-t, --timeout <timeout>`                          (optional) Seconds until lambda function timeout. Default is 3 seconds.
*    `-r, --region <aws region>`                        (optional) Sets the AWS region, defaults to us-east-1.
*    `-P, --profile-path <aws profile name>`            (optional) Read the specified AWS credentials file.
*    `-p, --profile <aws profile name>`                 (optional) Use with **-P**: Read the AWS profile of the file.
*    `-E, --environment <JSON {key:value}>`             (optional) Set extra environment variables for the lambda
*    `--wait-empty-event-loop`                          (optional) Sets callbackWaitsForEmptyEventLoop=True => will wait for an empty loop before returning. This is false by default because our implementation isn\'t perfect and only "emulates" it.
*    `--envdestroy`                                     (optional) Destroy added environment on closing. Defaults to false
*    `-v, --verboselevel <3/2/1/0>`                     (optional) Default 3. Level 2 dismiss handler() text, level 1 dismiss lambda-local text and level 0 dismiss also the result.
*    `--envfile <path/to/env/file>`                     (optional) Set extra environment variables from an env file
*    `--inspect [[host:]port]`                          (optional) Starts lambda-local using the NodeJS inspector (available in nodejs > 8.0.0)
*    `-W, --watch [port]`                               (optional) Starts lambda-local in watch mode listening to the specified port [1-65535].

### CLI examples

```bash
# Simple usage
lambda-local -l index.js -h handler -e examples/s3-put.js

# Input environment variables
lambda-local -l index.js -h handler -e examples/s3-put.js -E '{"key":"value","key2":"value2"}'
```

#### Running lambda functions as a HTTP Server
A simple way you can run lambda functions locally, without the need to create any special template files (like Serverless plugin and SAM requires), just adding the parameter `--watch`. It will raise a http server listening to the specified port (default is 8008), then you can pass the event payload to the handler via request body.

```bash
lambda-local -l examples/handler_helloworld.js -h handler --watch 8008

curl --request POST \
  --url http://localhost:8008/ \
  --header 'content-type: application/json' \
  --data '{
	"event": {
		"key1": "value1",
		"key2": "value2",
		"key3": "value3"
	}
}'
```

## About: Definitions

### Event data
Event sample data are placed in `examples` folder - feel free to use the files in here, or create your own event data.
Event data are just JSON objects exported:

```js
// Sample event data
module.exports = {
	foo: "bar"
};
```

### Context
The `context` object has been sampled from what's visible when running an actual Lambda function on AWS, and the [available documentation](https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html)
They may change the internals of this object, and Lambda-local does not guarantee that this will always be up-to-date with the actual context object.

### AWS-SDK
Since the Amazon Lambda can load the AWS-SDK npm without installation, Lambda-local has also packaged AWS-SDK in its dependencies.
If you want to use this, please use the `-p` or `-P` options (or their API counterpart) with the aws credentials file. More infos here:
http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html#cli-config-files

## Other links

- If you are willing to test an app based on the ASK-SDK, have a look at https://github.com/taimos/ask-sdk-test

## Development

 * Run `make` to install npm modules. (Required to develop & test lambda-local)
 * Run `make test` to execute the mocha test.
* Run `make clean` to reset the repository.

## License

This library is released under the MIT license.

[1]: http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
