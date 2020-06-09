# spark-ar-scripting
An example project/script file that illustrates the old and new scripting API methods for Facebook/Instagram's AR creation tool, Spark AR

## Inspiration
As of earlier this year, Spark has added new asynchronous scripting methods to replace their old, synchronous methods, which will be officially deprecated some time around July 2020. I wanted to create this repo to highlight what these changes mean for creators and compare the different methods to hopefully make them easier to understand.

## Methods
For each method, there will be a short description and then an example. Each method's example will perform the same operations so you can compare their syntax (code grammar) and hopefully figure out which makes the most sense to you.

Before we get into it, let's define a few things.



Synchronous code simply means code that runs in order, with each line "waiting" for the previous line to run before it executes. This is the standard behavior for most code.

```javascript
// get a value and assign it to a variable;
var myVariable = getValueSync();
// WAIT for previous line to finish and then use myVariable
myVariable.property = 2;
```



Asynchronous code is code that runs in order, but each line no longer has to wait for the previous line to return a value. This introduces some performance benefits - if a program you wanted to run has 10 lines and each line takes 1 second to complete, in the synchronous case, that program would take 10 seconds to complete, but in the asynchronous case, that program might only take 1s to complete since each line can basically run at the same time (This is a pretty big oversimplification, but the point is, asynchronous code can be more efficient and can prevent your program from becoming unresponsive while waiting for an action to complete). This performance benefit is basically Spark's rationale for deprecating the old, synchronous way of doing things. I'm not going to comment on if I think making scripting even less approachable for the average creator for marginal-at-best performance improvements is a particularly good decision - this is how things are now and we'll need to adapt. So let's take a look at Promises, which form the backbone of asynchronous programming in Javascript.

**Promises** are a special javascript objects that essentially represent a value that is in process of being defined by asynchronous code. Promises can either *resolve* (succeed in finding the value) or *reject* (fail). A line that creates a Promise allows the program to continue on to the next line while it operates in the background. This can be confusing because our synchronous way of thinking doesn't work anymore:

```javascript
// myVariable is assigned a Promise, not the object I want
var myVariable = getValueAsyncPromise();
// this line will throw an error, because it doesn't wait for myVariable to resolve
myVariable.property = 2;

'ERROR: "property" not found on "myVariable"'
```
So how do we wait for myVariable to resovle? One way is that Promises allow us to chain special functions - `then` and `catch` - to it that execute either on resolve (success) or on reject (failure):

```javascript
// We no longer assign a Promise to myVariable. Instead we wait for the Promise to resolve using 'then'
getValueAsyncPromise().then(function(myVariable) {
    // the Promise resolved successfully, yay!
    myVariable.property = 2;
}).catch(function(error) {
    // the Promise failed to return a value, print the error
    Diagnostics.log(error.stack);
});

// We can also do other stuff out here that doesn't depend on myVariable
Diagnostics.log('hi, hope you're having fun');
```

The `then` function only runs if the operation `getValueAsyncPromise` succeeds, and if not, the `catch` function runs to let us know what went wrong.

Spark also recently gave us a new option, which is to use the **async/await** keywords to turn asynchronous code back into synchronous. Let's adapt our example again to show how this works:

```javascript
// define our asynchronous function
var myAsyncFunction = async function() {
    var myVariable = await getValueAsyncPromise();
    myVariable.property = 2;
}
// call function so it actually runs
myAsyncFunction();
```
For this method to work, we have to define an asynchronous function using the `async` keyword. Now within that async function, we can use the `await` keyword on Promises, which tells the program to wait for that Promise to be resolved before moving on to the next line.



Before we move on, the last quick note I'll add is about arrow functions, which may look a bit weird if you're not familiar. Javascript lets us create functions using either the function keyword, or the special arrow function syntax:

```javascript
// function keyword
function myFunction() {
    // do stuff
}
var myOtherFunction = function() {
    // do stuff
}
function myFunctionWithArguments(arg1, arg2) {
    // do stuff with arg1, arg2
}

// arrow function
var myArrowFunction = () => {
    // do stuff
}
var myArrowFunctionWithOneArgument = arg1 => {
    // do stuff with arg1
}
var myArrowFunctionWithMultipleArguments = (arg1, arg2) => {
    // do stuff with arg1, arg2
}
```
I'm only mentioning this because I tend to use arrow functions often as they're just more convenient to type out. For most applications that you'll be getting into starting out, `function() {}` and `() => {}` are essentially interchangable. Just wanted to point that out in case it confuses anyone.

Ok, now we're ready to dive into our Spark-specific examples.


## 0. Synchronous (Deprecated)
As we went over before, the old synchronous methods are probably the most straighforward to understand. Synchronous methods behave the way most people expect - we can assign variable names to assets directly and each line of the script file runs in order (for the most part).

```javascript
// load modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');

// fetch assets
const faceMesh = Scene.root.find('faceMesh0');
const faceMat = Materials.get('material0');
const tex = Textures.get('texture0');

// do stuff
faceMat.diffuse = tex;
faceMesh.material = faceMat;
```

We fetch our assets and assign them directly to variable names that can then be used immediately after. Seeing as these methods are, in my opinion, the easiest to understand and will no longer be supported, we'll use them as a base to compare the new methods that follow.

Also note that the asset functions have slightly changed as well (`Scene.root.findFirst` vs `Scene.root.find` and `Materials.get` vs `Materials.findFirst`). You can find all of these methods in the Spark documentation, as well as this [changelog entry](https://sparkar.facebook.com/ar-studio/learn/documentation/scripting/asynchronous-api-changes/).

## 1. Asynchronous Nested Promises and/or Promise.all
So this is a small addition to the quick overview of Promises we went over earlier. `Promise.all` is a special function that accepts an array (list) of functions that return a Promise, which allows us to attach one `then` function that only runs once all of those values have resolved. Promise.all is very helpful when we want to fetch multiple assets because it runs all of the Promise functions at once and waits for all of them to resolve individually. But before we start using it, let's look at our example without using Promise.all:

```javascript
// load modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');
const Diagnostics = require('Diagnostics');

// If we want to find multiple values using asynchronous Promise functions without using Promise.all, we'd do this
// fetch assets
Scene.root.findFirst('faceMesh0').then(faceMesh => {
    Materials.findFirst('material0').then(faceMat => {
        Textures.findFirst('texture0').then(tex => {
            // do stuff
            faceMat.diffuse = tex;
            faceMesh.material = faceMat;
        });
    });
}).catch(error => Diagnostics.log(error.stack));
```

Nesting Promises like this can work, but it quickly gets annoying to write out, especially if we're fetching a lot of assets, and we remove any performance improvment we got from using asynchronous functions, since each asset call waits for the previous one to finish. Instead, let's try Promise.all:

```javascript
// load modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');
const Diagnostics = require('Diagnostics');

// fetch assets
// put all Promise calls in the array []
Promise.all([
    Scene.root.findFirst('faceMesh0'),
    Materials.findFirst('material0'),
    Textures.findFirst('texture0')
]).then(assets => {
    // assets is an array containing all of the things we searched for in the order we searched for them
    // we can now assign them to separate variables
    var faceMesh = assets[0];
    var faceMat = assets[1];
    var tex = assets[2];
    // we could also do 'var [ faceMesh, faceMat, tex ] = assets;' instead - see last example
    
    // do stuff
    faceMat.diffuse = tex;
    faceMesh.material = faceMat;
}).catch(error => Diagnostics.log(error.stack));
```

This is much cleaner, although the assigning of the variables as `assets[#]` is a bit clunky (we address this in the last method, if you want to add that in here).

These two examples were originally the only options we really had to use the new asynchronous methods. But let's take a look at the newly introduced async/await methods.

## 2. Asynchronous Async/Await
As we discussed before, async/await can turn asynchronous code into synchronous code. Let's jump right into our example:

```javascript
// load modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');

// define our asynchronous function
var main = async () => {
    // fetch assets, waiting for each to resolve before finding the next
    var faceMesh = await Scene.root.findFirst('faceMesh0');
    var faceMat = await Materials.findFirst('material0');
    var tex = await Textures.findFirst('texture0');
    
    // do stuff
    faceMat.diffuse = tex;
    faceMesh.material = faceMat;
}
// call it
main();

// Anything else out here will most likely run before the asset calls are finished
// Probably best to just put all of your code inside the main function
```

We basically just wrap our Synchronous example code into the asynchrouns function `main` and add our await keywords to our asset calls. This is about as close as we can get to mirroring the deprecated synchronous methods.

The only downside of this method (which is also true of the synchronous method) is if we're fetching a lot of assets (50+), our code may run slower since we are waiting for each Promise to resolve before starting the next one. This will be addressed in the next method, but if you were just looking for a way to synchronize your code, this is probably what you want.

## 3. Asynchronous Async/Await + Promise.all Hybrid
To retain the benefits of asynchronous code, while still making things a little easier to understand, we can use a hybrid approach:

```javascript
// load modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');

// define our asynchronous function
var main = async () => {
    // fetch assets using Promise.all, destructure array into individual assets
    var [ faceMesh, faceMat, tex ] = await Promise.all([
        Scene.root.findFirst('faceMesh0'),
        Materials.findFirst('material0'),
        Textures.findFirst('texture0')
    ]);
    
    // do stuff
    faceMat.diffuse = tex;
    faceMesh.material = faceMat;
}
// call it
main();
```

In this example, we simply await a single Promise.all call instead of individual asset calls. We also take advantage of [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to create our variables directly from the returned array, rather than individually assigning `var faceMesh = assets[0]` like we did previously. With this hybrid method, we still get the performance boost of asychronous programming, while keeping syntax pretty consistent with our synchronous code.

## Conclusion
Hopefully this has been helpful in giving you more context on what scripting now looks like in Spark AR and what options you have to make writing code as seamless and easy-to-understand as possible. Here's a very technical table summarizing all the options we discussed:

| Method          | Supported | Performance | Ease-of-use |
|-----------------|-----------|-------------|-------------|
| Synchronous     | No        | -1          | +1          |
| Nested Promises | Yes       | -1          | -1          |
| Promise.all     | Yes       | +1          | -1          |
| Async/Await     | Yes       | -1          | +1          |
| **Hybrid**      | Yes       | +1          | 0           |

The Hybrid approach is my pick, but feel free to choose which option works best for you. Feel free to download the example project and test out the different options.

### Shameless Self-Promotion
If you found this helpful and want to learn more about Spark AR, I put together this [Udemy tutorial series](https://www.udemy.com/course/the-complete-spark-ar-course/?referralCode=2D981BA24888FD641825).
