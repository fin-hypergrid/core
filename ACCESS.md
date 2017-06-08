## Hypergird Version Access

This page deals mostly with installing or directly accessing the Hypergrid build files and node packages.

### Repository names

The Hypergrid respository is called `core` and lives under the `fin-hypergrid` organization on GitHub: https://github.com/fin-hypergrid/core

The Hypergrid plug-in repositories have descriptive names, which should be no longer than a few hyphenated, all lower case words (the shorter the better). Please start all names with "plugin-" to make searching for them easier in the [fin-hypergrid](https://github.com/fin-hypergrid) organization page on GitHub. _Example:_ [`plugin-grouped-headers`](https://github.com/fin-hypergrid/plugin-grouped-headers).

### Versioning
Going forward, Hypergrid `core` and all plug-ins shall conform to standard [semver](http://semver.org) semantics:
 
> Given a version number MAJOR.MINOR.PATCH, increment the:
> 1. MAJOR version when you make incompatible API changes,
> 2. MINOR version when you add functionality in a backwards-compatible manner, and
> 3. PATCH version when you make backwards-compatible bug fixes.

### Node packages
_(Also called “node modules” or “npm” files.)_ These are for use with [Browserify](http://browserify.org/) or [webpack](https://webpack.github.io/).
 
Hypergrid `core` and the Hypergrid plug-in packages are _always_ available directly from their respective repos by setting the dependency to the appropritate URL in your package.json file.
 
The `core` is always available on the [npm registry](https://npmjs.org) as [fin-hypergrid](https://www.npmjs.com/package/fin-hypergrid).
 
Hypergrid plug-ins may or may not be published to npm. If published, plug-in names should additionally be prefixed with "fin-hypergrid-" so that all Hypergrid plug-ins start with "fin-hypergrid-plugin-" and can be found easily by searching for that string on the npm registry.

### Build files
Build files are for use by `<script>` tags and reside on the "GitHub Pages" website CDN associated with each repo, `https://fin-hypergrid.github.io/reponame`.

All versions of all build files for both Hypergrid core and plug-ins are avaialble in two editions:
* Unminified `.js` files (with source map)
* Minified `.min.js` files (no source map)

#### Latest build of a specific major version
As noted above, all builds within a specific major version are interface-compatible (no breaking changes).

Give the MAJOR version number only after `build` in the path:
```html
<script src=”https://fin-hypergrid.github.io/core/build/2/fin-hypergrid.js”></script>
<script src=”https://fin-hypergrid.github.io/core/build/2/fin-hypergrid.min.js”></script>

<script src=”https://fin-hypergrid.github.io/plugin-yadayada/build/1/yadayada.js”></script>
<script src=”https://fin-hypergrid.github.io/plugin-yadayada/build/1/yadayada.min.js”></script>
```

#### Latest build of a specific minor version
Give both the MAJOR.MINOR version number parts after `build` in the path:
```html
<script src=”https://fin-hypergrid.github.io/core/2.0/fin-hypergrid.js”></script>
```

#### Specific build
Give all three of the MAJOR.MINOR.PATCH version number parts before the .js extension:
```html
<script src=”https://fin-hypergrid.github.io/core/2.0.2/fin-hypergrid.js”></script>
```

### Remote repositories
Repositorties are hosted on GitHub:
* https://github.com/fin-hypergrid/core.git
   * https://github.com/fin-hypergrid/core/ to browse the repo and view the README.md
* https://github.com/fin-hypergrid/plugin-yada.git
   * https://github.com/fin-hypergrid/plugin-yada/ to browse the repo and see the README.md

### Demo
The GitHub CDN responds to the following links with the defaukt file `index.html` within the root folder on the given repo's GitHub Pages site.
* https://fin-hypergrid.github.io/core
* https://fin-hypergrid.github.io/plugin-yadayada

### API Documenation
* https://fin-hypergrid.github.io/core/doc
* https://fin-hypergrid.github.io/sample-plugin/doc

### Wikis
Each repo gets its own set of wikis and we may only use the “core” set.
* https://github.copm/fin-hypergrid/core/wiki    (home page)
* https://github.copm/fin-hypergrid/core/wiki/subject-matter    (sample subject matter page)
