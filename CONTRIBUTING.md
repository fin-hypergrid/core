# Welcome

Third-party contributors are essential for keeping Hypergrid great. We simply cannot imagine
all the different ways the grid will be styled, configured and integrated in your application.
Thank you in advance for being apart of this project and for helping to make HyperGrid the most performant and customizable grid
available! 

## Beginners

We have several beginner `help wanted` [tickets](https://github.com/openfin/fin-hypergrid/issues) open for community involvement.

## HyperGrid Core vs Add-ons

The core of Hypergrid is being improved to focus primarily as a fast data-view with customizable rendering. Data transformations (ie. sorting)
are left to the user and are excluded from the core of the grid. If you wish to provide a layer for data transformations
please do so as an [add-on](https://github.com/openfin/fin-hypergrid/tree/master/add-ons). 
Please note that eventually, these add-ons will be split out into their own set of repos


## Getting Started

* Create a [GitHub account](https://github.com/signup/free)
* Fork the repository on GitHub

## Building & Interactive Development
* `git clone <your fork>`
* `node -v` //=> v4.0.0
* `npm -v`  //=> 2.14.2
*  We recommend using nvm to manage your versions of node and npm
* `npm install -g gulp`
* `npm install`
* `gulp`

## Making Changes

* Create a topic branch from where you want to base your work.
    * This is usually the `develop` branch.
    * Name your branch with a qualifier (IMPRV, DOCS, BUG, FEATURE, POC) followed by a forward slash and then some info about your branch.
        i.e. *IMPRV/Removed-unused-code*
    * Please avoid working directly on the `master` or `develop` branches.
* Make commits of logical units and squash your commits, if needs, be to facilitate that
* Please *rebase* your work on top develop so that your commits are seen as a fast-forward (and please fix any merge conflicts)
* Check for unnecessary whitespace with `git diff --check` before committing.
* For commit messages, please use full sentences and a brief explanation of what you accomplished.
    * The following example message is adopted from Puppet's labs sample commit.

````
    Without this patch applied the example commit message in the CONTRIBUTING
    document is not a concrete example.  This is a problem because the
    contributor is left to imagine what the commit message should look like
    based on a description rather than an example.  This patch fixes the
    problem by making the example concrete and imperative.

    The first line is a real life imperative statement with a ticket number
    from our issue tracker.  The body describes the behavior without the patch,
    why this is a problem, and how the patch fixes the problem when applied.
````

* Make sure you have added the necessary [tests](https://github.com/openfin/fin-hypergrid/tree/master/test) for your changes.
* Run _all_ the tests to assure nothing else was accidentally broken.


### Documentation

We are not believers in verbose comments in code, but rather your code should be mostly self-explanatory. On the same token, we do believe in good usage of jsdocs _especially_ if your updating a public api call and in creating tutorials
if its a new feature. Here is an example of a [tutorial]{http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-editors.html)

## Submitting Changes

* Push your changes to a topic branch in your fork of the repository.
* Submit a pull request to the repository in the openfin organization.
* Do not leave Work-In-Progress PR's lingering, close them until they are ready for evaluation.
* The core team looks at Pull Requests on a regular basis in time with a three-week sprint cycle.
* If your PR is acceptd, congratulations!! 
    * We will label it as `Reviewed` and notes to our revision history and include it in the next release

# Additional Resources

Feel free to open [issues](https://github.com/openfin/fin-hypergrid/issues) or email support@openfin.co
