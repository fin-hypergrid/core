[![Build Status](https://travis-ci.org/openfin/fin-hypergrid.svg?branch=develop)](https://travis-ci.org/openfin/fin-hypergrid)

**fin-hypergrid** is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure. Please be sure to checkout our [design overview](OVERVIEW.md)

Below is an example custom application built on top of the Hypergrid API tooling.
It also highlights a DOM-based custom external editor triggered via hypergrid events as well as interaction with Hypergrid's column ordering API

<img src="images/README/gridshot04.gif">

## Table of Contents
* [Current Release](#current-release-2110---4-may-2018)
* [Demos](#demos)
* [Features](#features)
* [Testing](#testing)
* [Documentation](#developer-documentation)
* [Roadmap](#roadmap)
* [Contributing](#contributors)

### Current Release (2.1.10 - 4 May 2018)

**Hypergrid 2.1.10** includes bug fixes.

_For a complete list of changes, see the [release notes](https://github.com/fin-hypergrid/core/releases)._

### Demos

##### Sample demo

Our [dev testbed](https://fin-hypergrid.github.io/core) demos various features.

##### Hyperblotter

Hyperblotter is a demo app that shows the capabilities of both OpenFin and Hypergrid.

Check out the Table view on Hyperblotter on a Windows machine via [this installer](https://dl.openfin.co/services/download?fileName=Hyperblotter&config=http://cdn.openfin.co/demos/hyperblotter/app.json).

![](images/README/Hyperblotter%20Tabled%20Reduced%20Rows.png)

### Features

![](images/README/Hypergrid%20Features.png)

### Testing

Please use github [issues](https://github.com/fin-hypergrid/core/issues) to report problems

We invite everyone to test the alpha branch for changes going into the next release

Find more information on our [testing page](TESTING.md)

### Developer Documentation

Primarily our tutorials will be on the [wiki](https://github.com/fin-hypergrid/core/wiki).

We also maintain versioned [online API documentation](https://fin-hypergrid.github.io/core/2.1.9/doc/Hypergrid.html) for all public objects and modules. This documentation is necessarily an on-going work-in-progress.

(Cell editor information can be found [here](https://github.com/fin-hypergrid/core/wiki/Cell-Editors).)

(Cell Rendering information can be found [here](https://github.com/fin-hypergrid/core/wiki/Cell-Renderers).)

Hypergrid global configurations can be found [here](https://fin-hypergrid.github.io/core/2.1.9/doc/module-defaults.html).

### Roadmap

For our current queue of up coming work you can find it [here](ROADMAP.md)

### Contributors

Developers interested in contributing to this project should review our [contributing guide](CONTRIBUTING.md) before making pull requests.
