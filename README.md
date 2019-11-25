**fin-hypergrid** is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure. Please be sure to checkout our [design overview](OVERVIEW.md)

Below is an example custom application built on top of the Hypergrid API tooling.
It also highlights a DOM-based custom external editor triggered via hypergrid events as well as interaction with Hypergrid’s column ordering API.

<img src="images/README/gridshot04.gif">

## Table of Contents
* [Current Release](#current-release)
* [Distribution](#distribution)
* [Demos](#demos)
* [Features](#features)
* [Testing](#testing)
* [Documentation](#developer-documentation)
* [Roadmap](#roadmap)
* [Contributing](#contributors)

### Current Release

**v3.3.2**
25 November 2019

### Distribution

#### npm module _(recommended)_
Published as a CommonJS module to [**npm**](http://npmjs.com/package/fin-hypergrid).
Specify a <a href="https://semver.org/">SEMVER</a> of `"fin-hypergrid": "3.3.2"` (or `"^3.3.2"`) in your package.json file,
issue the `npm install` command, and let your bundler (<a target="webpack" href="https://webpack.js.org/">wepback</a>,
<a target="browserify" href="http://browserify.org/">Browserify</a>) create a single file containing both Hypergrid and your application.

#### Build files
For small and informal examples and proofs-of-concept, load a pre-bundled build file (`fin-hypergrid.js` or `fin-hypergrid.min.js`) from the GitHub CDN. See the [CDN index](https://fin-hypergrid.github.io#index) for links.

Your application can load one of these pre-bundled build files (in a `<script>` tag), which creates the global namespace `window.fin` (as needed) and populates it with `window.fin.Hypergrid`.

As of v3.2.1, the same build files are also available in a `umd` folder on npm for distribution via the [**unpkg**](https://unpkg.com/) CDN which processes SEMVER semantics when provided. For example, `<script src="https://unpkg.com/fin-hypergrid@^3.2/umd/fin-hypergrid.min.js"></script>` loads v3.3.2 which is the greatest (most recent) version number matching the SEMVER pattern `^3.2` (aka 3.*.*).

### Demos

_The [`fin-hypergrid/build`](https://github.com/fin-hypergrid/build) repo generates the build files.
It also hosts the demo source files that test and show off various Hypergrid features.
Some of these use the npm module while others use the bundled build file.
Working versions of all demos are published to the CDN ([list of links](https://fin-hypergrid.github.io#demos))._

#### Testbench

The [default](https://fin-hypergrid.github.io/core) demo is the Hypergrid [dev testbench](https://fin-hypergrid.github.io/core/demo/index.html) ([source](https://github.com/fin-hypergrid/build/tree/master/testbench)).

(This app bundles the npm module plus all of its own modules together into a single file (`testbench.js`).
For illustrative purposes, [this alternate version](https://fin-hypergrid.github.io/core/demo/hypermods.html) loads
the pre-bundled build file `fin-hypergrid.js` plus specially IIFE-wrapped versions of each its own modules discretely.)

#### Simple example

See `example.html` for a very simple example ([repo](https://github.com/fin-hypergrid/build/blob/master/demo/example.html), [demo](https://fin-hypergrid.github.io/core/demo/example.html)):

![](images/README/simple.png)

#### Who else is using Hypergrid?

##### Perspective

The [Perspective](https://github.com/jpmorganchase/perspective) open source project uses Hypergrid v3 (demo links in the README) and does a lot more than Hypergrid alone, such as table pivots and charting.

![](images/README/perspective.png)

##### AdaptableBlotter.JS

[Openfin](http://openfin.co)’s AdaptableBlotter.JS ([installer](https://install.openfin.co/download/?fileName=adaptable_blotter_openfin&config=http://beta.adaptableblotter.com/app-beta.json)) is a demo app that shows the capabilities of both Openfin and Hypergrid.

![](images/README/partner-adaptableblotter_image-01@2x-667x375@2x.png)

### Features

![](images/README/Hypergrid%20Features.png)

### Testing

Please use github [issues](https://github.com/fin-hypergrid/core/issues/new) to report problems

We invite everyone to test the alpha branch for changes going into the next release

Find more information on our [testing page](TESTING.md)

### Developer Documentation

Primarily our tutorials will be on the [wiki](https://github.com/fin-hypergrid/core/wiki).

We also maintain versioned [online API documentation](https://fin-hypergrid.github.io/core/2.1.15/doc/Hypergrid.html) for all public objects and modules. This documentation is necessarily an on-going work-in-progress.

(Cell editor information can be found [here](https://github.com/fin-hypergrid/core/wiki/Cell-Editors).)

(Cell Rendering information can be found [here](https://github.com/fin-hypergrid/core/wiki/Cell-Renderers).)

Hypergrid global configurations can be found [here](https://fin-hypergrid.github.io/core/2.1.15/doc/module-defaults.html).

### Roadmap

For our current queue of upcoming work you can find it [here](ROADMAP.md)

### Contributors

Developers interested in contributing to this project should review our [contributing guide](CONTRIBUTING.md) before making pull requests.
