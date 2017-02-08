# Welcome

Thank you in advance for being a part of this project and for helping to make HyperGrid the most performant and customizable grid available! 

## Beginners

We have several beginner [issues](https://github.com/openfin/fin-hypergrid/issues) open for community involvement. Feel free to look all issues, especially those with the label "help wanted". Please ignore those with the label "on-hold" as the scope of these issues may change.

## HyperGrid Core vs UserLand

* Please see our [architectural overview](https://github.com/openfin/fin-hypergrid/blob/master/OVERVIEW.md)

## Getting Started

* Create a [GitHub account](https://github.com/signup/free)
* Fork the repository on GitHub

## Building & Interactive Development

```bash
$ git clone <your fork>
$ node -v # at least:
v4.0.0
$ npm -v # at least:
2.14.2
$ # We recommend using nvm to manage your versions of node and npm.
$ npm install -g gulp
$ npm install
$ gulp
``` 

## Making Changes

* Create a topic branch from where you want to base your work.
 * This is usually the `develop` branch.
 * Name your branch with a qualifier (IMPRV, DOCS, BUG, FEATURE, POC) followed by a forward slash and then some info about your branch.
        i.e. *IMPRV/Removed-unused-code*
  * Please avoid working directly on the `master` or `develop` branches.
* Make commits of logical units and squash your commits as needed to facilitate that
* Please *rebase* your work on top develop as needed so that your commits are seen as a fast-forward (and please fix any merge conflicts)
* Check for unnecessary whitespace with `git diff --check` before committing.
* For commit messages, please use full sentences and a brief explanation of what you accomplished.
 * The following example message is adopted from Puppet's labs sample commit.

```
    Make the example in CONTRIBUTING imperative and concrete

    Without this patch applied the example commit message in the CONTRIBUTING
    document is not a concrete example.  This is a problem because the
    contributor is left to imagine what the commit message should look like
    based on a description rather than an example.  This patch fixes the
    problem by making the example concrete and imperative.
```

* Make sure you have added the necessary [tests](https://github.com/openfin/fin-hypergrid/tree/master/test) for your changes.
* Run _all_ the tests to assure nothing else was accidentally broken.
* Test your changes in all IE10+, Safari, Chrome, Chrome 40, Firefox
* We are evaluating different testing strategies but for the moment, the major considerations are for
 * renders datacells when it is bound to homogenous data array
 * scrolls/arrow-key navigates cell-by-cell
 * uses less than 7% CPU when idle
 * can use html5 controls to edit the data already loaded
 * can draw customized renderers in cells performantly
 * resizes based on its viewport
 * can align fonts or unicode characters left, center or middle horizontally
 * the grid can pass the raw data it recieved through a customized data transformation pipeline
 * Columns can be resized

## Documentation

Code should be as self-explanatory as possible by using well-considered variable names; additional variables for intermediate values instead of unexplained subexpressions; clear, logical flow; parallel structure; etc. 
Use comments only to explain any remaining subtleties. 

On the other hand, we do believe in good usage of jsdocs _especially_ if your updating a public api call.
Here is an example of a [tutorial](http://openfin.github.io/fin-hypergrid/doc/tutorial-cell-editors.html)

## Submitting Changes

* Push your changes to a topic branch in your fork of the repository.
* Submit a pull request to the repository in the openfin organization.
* Do not submit until ready to publish — and then hold off a bit longer until you feel certain you are not submitting prematurely. If you find you absolutely must update a pull request, you must leave an explanatory comment. Updating will delay merging your PR if we have to review it again. Please try to avoid doing this (by not submitting too early; see above).
* The core team looks at Pull Requests on a regular basis within a three-week sprint cycle.
* If your PR is accepted, congratulations!! 
    * We will label it as `Reviewed` add your submission notes to our release notes.
    
## Our Release Workflow

* We follow [Traditional GitFlow](http://danielkummer.github.io/git-flow-cheatsheet/)
* Changes added in develop branch are considered ready to go to alpha at any point
* If your PR is still withstanding please keep the above in mind
* Once we decide to create an alpha candidate the changes are merged to the alpha branch as such

```
git checkout alpha
git diff old-develop develop | git apply
git add .
git commit -m 'roll-up of PRs …'
git tag v0.0.0-alpha -m 'MM/DD/YYYY'
git push —follow-tags upstream alpha
```
* This candidate branch is open for community testing. 
* Once we decide to go to **master** the following occurs

```
git chekout master
git fetch upstream master
git checkout alpha
git fetch upstream alpha
git merge master #-s ours may override Readme changes on master
git upstream alpha
# PR is merged occurs!
git checkout master
git pull upstream master
git tag v0.0.0 -m 'MM/DD/YYYY'
git push —follow-tags upstream master
./gh-pages.sh #update CDN Demos
npm publish
```
* Rinse and Repeat!

## Additional Resources

Feel free to open [issues](https://github.com/openfin/fin-hypergrid/issues) or email support@openfin.co
