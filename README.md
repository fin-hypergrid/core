[![Build Status](https://travis-ci.org/openfin/fin-hypergrid.svg?branch=develop)](https://travis-ci.org/openfin/fin-hypergrid)

**fin-hypergrid** is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure. Please be sure to checkout our [design overview](https://github.com/openfin/fin-hypergrid/blob/master/OVERVIEW.md) 

Below is an example custom application built ontop of the Hypergrid API tooling. It also highlights a DOM based custom external editor triggered via hypergrid events as well as interaction with Hypergrid's column ordering API

<img src="https://github.com/openfin/fin-hypergrid/blob/master/images/README/gridshot04.gif">

## Table of Contents
* [Current Release](https://github.com/openfin/fin-hypergrid#current-release-121---27-october-2016)
* [Demos](https://github.com/openfin/fin-hypergrid/blob/master/README.md#demos)
* [Features](https://github.com/openfin/fin-hypergrid/blob/master/README.md#features)
* [Testing](https://github.com/openfin/fin-hypergrid/blob/master/README.md#testing)
* [Documentation](https://github.com/openfin/fin-hypergrid/blob/master/README.md#developer-documentation)
* [Roadmap](https://github.com/openfin/fin-hypergrid/blob/master/README.md#roadmap)
* [Contributing](https://github.com/openfin/fin-hypergrid/blob/master/README.md#contributors)

### Current Release (2.0.0 - 16 May 2017)

2.0 reflects a substantial simplification of the core functionality of the grid to just customized rendering. The rendering engine does allow support for showing sorting, filtering, grouping, etc. but specific logic on how a user may want to do that is not apart for this project. Demos will be made available on the [wiki](https://github.com/openfin/fin-hypergrid/wiki) for this.

2.0 also replaces the 2015-2016 [prototype version](https://github.com/openfin/fin-hypergrid/tree/polymer-prototype), which was built around Polymer. It is now completely "de-polymerized" and is being made available as:
* An [npm module](https://www.npmjs.com/package/fin-hypergrid) for use with browserify.
* A single JavaScript file [fin-hypergrid.js](https://openfin.github.io/fin-hypergrid/build/fin-hypergrid.js) you can reference in a `<script>` tag.

_For a complete list of changes, see the [release notes](https://github.com/openfin/fin-hypergrid/releases)._

### Demos

##### Sample demo

Here is an [application](http://openfin.github.io/fin-hypergrid/) that demos various features.
   
##### Hyperblotter

Hyperblotter is a demo app that shows the capabilities of both OpenFin and Hypergrid.

Check out the Table view on Hyperblotter on a Windows machine via [this installer](https://dl.openfin.co/services/download?fileName=Hyperblotter&config=http://cdn.openfin.co/demos/hyperblotter/app.json).

![](https://github.com/openfin/fin-hypergrid/blob/master/images/README/Hyperblotter%20Tabled%20Reduced%20Rows.png)

### Features

![](https://github.com/openfin/fin-hypergrid/blob/master/images/README/Hypergrid%20Features.png)

### Testing

Please use github [issues](https://github.com/openfin/fin-hypergrid/issues) or email support@openfin.co to report problems

We invite everyone to test the alpha branch for changes going into the next release

Find more infomation on our [testing page](https://github.com/openfin/fin-hypergrid/blob/master/TESTING.md)

### Developer Documentation

Primarily our tutorials will be on the [wiki](https://github.com/openfin/fin-hypergrid/wiki). 

We are also maintaining [online API documentation](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html) for all public objects and modules. This documentation is necessarily a on-going work-in-progress.

(Cell editor information can be found [here](https://github.com/openfin/fin-hypergrid/wiki/Cell-Editors).)

(Cell Rendering information can be found [here](https://github.com/openfin/fin-hypergrid/wiki/Cell-Renderers).)

Hypergrid global configurations can be found [here](http://openfin.github.io/fin-hypergrid/doc/module-defaults.html). 

### Roadmap

For our current queue of up coming work you can find it [here](https://github.com/openfin/fin-hypergrid/blob/master/ROADMAP.md) 

### Contributors

Developers interested in contributing to this project should review our [contributing guide](CONTRIBUTING.md) before making pull requests.
