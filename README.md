Lambda-local
============

[![Build Status](https://travis-ci.org/ashiina/lambda-local.svg?branch=develop)](https://travis-ci.org/ashiina/lambda-local)

Lambda-local lets you test Amazon Lambda functions on your local machine with sample event data.
The `context` of the Lambda function is already loaded so you do not have to worry about it.
You can pass any `event` JSON object as you please.


Install
----
```bash
npm install -g lambda-local
```


Usage
-----

```bash
# Usage
lambda-local -l index.js -h handler -e event-samples/s3-put.js
```

About
-----
### Command
*    -l, --lambdapath [lambda file name]                     Specify Lambda function file name.
*    -e, --eventpath [event data file name]                  Specify event data file name.
*    -h, --handler [lambda-function handler name (optional)] Lambda function handler name. Default is "handler".
*    -t, --timeout [timeout seconds (optional)]              Seconds until lambda function timeout. Default is 3 seconds.
*    -c, --callbackforce (optional)                          Force the function to stop after having called context.done/succeed/fail.
*    -p, --profile [aws file path (optional)]                Read the AWS profile to get the credidentials.

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

License
----------
This library is released under the MIT license.


