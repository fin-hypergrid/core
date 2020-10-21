**@eclipsetrading/hypergrid** is an ultra-fast HTML5 grid presentation layer, achieving its speed by rendering (in a canvas tag) only the currently visible portion of your (virtual) grid, thus avoiding the latency and life-cycle issues of building, walking, and maintaining a complex DOM structure. Please be sure to checkout our [design overview](OVERVIEW.md)
### Current Release

Forked as `eclipsetrading-hypergrid`. With the aim of converting to TypeScript and updating to use ES6 classes over `extend-me`.

### Distribution

#### npm module _(recommended)_
Published as a CommonJS module to [**npm**](http://npmjs.com/package/@eclipsetrading/hypergrid).
Specify a <a href="https://semver.org/">SEMVER</a> of `"fin-hypergrid": "3.3.2"` (or `"^3.3.2"`) in your package.json file,
issue the `npm install` command, and let your bundler (<a target="webpack" href="https://webpack.js.org/">wepback</a>,
<a target="browserify" href="http://browserify.org/">Browserify</a>) create a single file containing both Hypergrid and your application.

#### Build files
For small and informal examples and proofs-of-concept, load a pre-bundled build file (`fin-hypergrid.js` or `fin-hypergrid.min.js`) from the GitHub CDN. See the [CDN index](https://fin-hypergrid.github.io#index) for links.

Your application can load one of these pre-bundled build files (in a `<script>` tag), which creates the global namespace `window.fin` (as needed) and populates it with `window.fin.Hypergrid`.

As of v3.2.1, the same build files are also available in a `umd` folder on npm for distribution via the [**unpkg**](https://unpkg.com/) CDN which processes SEMVER semantics when provided. For example, `<script src="https://unpkg.com/fin-hypergrid@^3.2/umd/fin-hypergrid.min.js"></script>` loads v3.3.2 which is the greatest (most recent) version number matching the SEMVER pattern `^3.2` (aka 3.*.*).

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

### Contributors

Developers interested in contributing to this project should review our [contributing guide](CONTRIBUTING.md) before making pull requests.
