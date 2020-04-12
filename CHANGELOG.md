# ChangeLog

## 1.7.2 (2020-04/13)
* Add --watch parameter
* Bump dependencies

## 1.7.1 (2020-01/28)
* Add support for `_HANDLER`
* Update environment variables computation & consistency with context

## 1.7.0 (2020-01/17)
* Migrate to TypeScript (#191)

## 1.6.3 (2019/07/04)
* Security updates (update dependencies that had vulnerabilities: [mocha](https://github.com/mochajs/mocha/blob/master/CHANGELOG.md#614--2019-04-18)).
* Pick up AWS profile from env `AWS_PROFILE` or `AWS_DEFAULT_PROFILE` (thanks to @illusori)

## 1.6.2 (2019/04/30)
* Documentation changes. No API changes

## 1.6.1 (2019/04/15)
* Update for Winston 3
* Refactor console output manager

## 1.5.3 (2019/04/15)
* Better handling of TimeoutError: now passed to context as other exceptions
* Improved Makefile (thanks to @joechrysler)
* Drop NodeJS < 6, therefore update all dependencies

## 1.5.2 (2018/12/02)
 * New: ability to specify the context manualy (thanks to Nathan Wright)
 * New: Implement proper callbackWaitsForEmptyLoop
 * Fix ARN context environment vars (thanks to @bar-sc)
 * Better outputs management (circular outputs)

## 1.5.1 (2018/06/08)
 * NodeJS >= 10 proper detection
 * Timeout message fix (thanks to @ribizli)

## 1.5.0 (2018/06/06)
 * Make context an object
 * Support multi-threading & nested calls
 * Context is regenerated on each run (e.g. awsRequestId will change)

## 1.4.8 (2018/05/26)
 * Read default AWS config files
 * Improve absolute/relative path finding
 * Handle syntax error in handlers

## 1.4.7 (2018/04/03)
 * Support async functions (thanks to @hoegertn)

## 1.4.6 (2018/03/08)
 * Fix region detection
 * Add --envdestroy option to restore the environment after testing.
 * Support builtin Error object handling
 * More examples & better README

## 1.4.5 (2017/11/15)
 * Better environment variables managing
 * Fix lambda ending rules (context.done/fail/succeed)

## 1.4.4 (2017/10/24)
 * Timeout fix
 * Better context management
 * Add execution time log

## 1.4.3 (2017/09/23)
 * Several token fixes
 * New log system, using a verbose level
 * Bug fixes

## 1.4.2 (2017/03/09)
 * Added promise support
 * Better JSON parse error handling for environment variables

## 1.4.1 (2017/02/09)
 * Fixed critical bug

## 1.4.0 (2017/02/08)
 * Added support for environment variables

## 1.3.0 (2016/11/26)
 * Fixed critical bug (logger)

## 1.2.0 (2016/11/23)
 * Added mock functionality
 * Dropped Node.js v0.1, v0.12 suport

## 1.1.0 (2016/9/15)
 * The default behavior of lambda-local now does not forcefully call the callback function (`-c` option).
 * Added AWS region option `-r`. Defaults to `us-east-1`.
 * Added AWS profile name option `-p`. 

## 1.0.0 (2016/6/10)
 * lambda-local can now be imported as a node module, and be executed from other node.js programs

## 0.0.10 (2016/5/29)
 * Support for Node.js 4.3.2 runtime
 * Added feature to import AWS profile from commandline option
 * Added necessary environment variables 

## 0.0.9 (2016/4/9)
 * Fixed package.json information for npm

## 0.0.8 (2016/4/9)
 * Added support for all properties in the Context object. 
   Supporting everything in here:
   https://docs.aws.amazon.com/en_us/lambda/latest/dg/nodejs-prog-model-context.html

 * Wrote a mocha unit test for the Context object.

## 0.0.7 (2016/2/21)
 * Minor bug fix: Now correctly outputs the error object when Context.done() has an error.

## 0.0.6 (2015/11/13)
 * Added support for `fail` and `succeed` methods

## 0.0.5 (2015/1/21)
 * First release


