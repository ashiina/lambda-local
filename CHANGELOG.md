# ChangeLog

## 1.0.0 (2016/6/xx)
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


