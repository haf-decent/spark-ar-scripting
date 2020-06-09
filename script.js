// Load modules
const Scene = require('Scene');
const Materials = require('Materials');
const Textures = require('Textures');
const Patches = require('Patches');
const Diagnostics = require('Diagnostics');

// Initialize timer variable
var start;

// 0. Old synchronous methods
// --------------------------------------------
function deprecatedMethods() {
    // start timer
    Diagnostics.log('Running old methods. Deprecated warnings incoming...');
    start = Date.now();

    // fetch assets
    const faceMesh = Scene.root.find('faceMesh0');
    const faceMat = Materials.get('material0');
    const tex = Textures.get('texture0');

    // Do stuff
    faceMat.diffuse = tex;
    faceMesh.material = faceMat;

    // end timer
    Diagnostics.log(`Completed old methods in ${(Date.now() - start) / 1000}s`);
}


// 1. New asynchronous methods (Promise.all)
// --------------------------------------------
function promiseAllMethods() {
    // start timer
    Diagnostics.log('Running new Promise.all method.');
    start = Date.now();

    // fetch assets
    Promise.all([
        Scene.root.findFirst('faceMesh0'),
        Materials.findFirst('material0'),
        Textures.findFirst('texture0')
    ]).then(assets => {
        const faceMesh = assets[0];
        const faceMat = assets[1];
        const tex = assets[2];

        // Do stuff
        faceMat.diffuse = tex;
        faceMesh.material = faceMat;

        // end timer
        Diagnostics.log(`Completed Promise.all method in ${(Date.now() - start) / 1000}s`);

    }).catch(err => Diagnostics.log(err.stack));
}


// 2. New asynchronous methods (async/await)
// --------------------------------------------
function asyncAwaitMethods() {
    // start timer
    Diagnostics.log('Running new async/await method.');
    start = Date.now();

    (async () => {
        // fetch assets
        // slower because each asset call waits for the previous to finish (if each takes 1s to find, the total operation takes 3s)
        const faceMesh = await Scene.root.findFirst('faceMesh0');
        const faceMat = await Materials.findFirst('material0');
        const tex = await Textures.findFirst('texture0');

        // Do stuff
        faceMat.diffuse = tex;
        faceMesh.material = faceMat;

        // end timer
        Diagnostics.log(`Completed async/await methods in ${(Date.now() - start) / 1000}s`);

    })().catch(err => Diagnostics.log(err.stack));
}

// 3. New asynchronous methods (async/await with Promise.all)
// --------------------------------------------
function asyncAndPromiseAllMethods() {
    // start timer
    Diagnostics.log('Running new async/await method with Promise.all.');
    start = Date.now();

    (async () => {
        // fetch assets
        // quicker because the calls happen simultaneously (if each takes 1s to find, the total operation also takes 1s)
        // Note: the fetched asset array is destructured into individual variables (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment)
        const [ faceMesh, faceMat, tex ] = await Promise.all([
            Scene.root.findFirst('faceMesh0'),
            Materials.findFirst('material0'),
            Textures.findFirst('texture0')
        ]);

        // Do stuff
        faceMat.diffuse = tex;
        faceMesh.material = faceMat;

        // end timer
        Diagnostics.log(`Completed async/await method with Promise.all in ${(Date.now() - start) / 1000}s`);

    })().catch(err => Diagnostics.log(err.stack));
}

// Choose which function to run based on Patch output
// --------------------------------------------
const methods = [ deprecatedMethods, promiseAllMethods, asyncAwaitMethods, asyncAndPromiseAllMethods ];

Patches.outputs.getScalar('scriptIndex')
    .then(index => methods[ index.pinLastValue() % methods.length ]())
    .catch(err => Diagnostics.log(err.stack));