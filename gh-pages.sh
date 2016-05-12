#!/usr/bin/env bash

org="openfin"
module="fin-hypergrid"

# set variable repo to current directory name (without path)
repo=${PWD##*/}

# remove temp directory in case it already exists, remake it, switch to it
rm -rf ../temp >/dev/null
mkdir ../temp
pushd ../temp >/dev/null

# clone it so it will be a branch of the repo
git clone -q --single-branch --recurse-submodules http://github.com/$org/$repo.git
cd $repo >/dev/null

npm install >/dev/null

# make sure the docs are built
gulp build >/dev/null
gulp doc >/dev/null

# stash relevant folders
mv demo doc ..

# create and switch to a new gh-pages branch
git checkout -q --orphan gh-pages

# remove all content from this new branch
git rm -rf -q .

git clean -fd

# copy the doc directory from the stash
mv ../doc ../demo/* . >/dev/null

# make the forward to the old demo
mkdir components
mkdir components/fin-hypergrid
echo '<html>' > components/fin-hypergrid/demo.html
echo '<head><meta http-equiv="Refresh" content="0; url=https://openfin.github.io/fin-hypergrid-polymer-demo/components/fin-hypergrid/demo.html/" /></head>' >> components/fin-hypergrid/demo.html
echo '<body>The Hypergrid Polymer prototype demo has been moved to <a href="http://openfin.github.io/fin-hypergrid-polymer-demo/components/fin-hypergrid/demo.html">here</a>.</body>' >> components/fin-hypergrid/demo.html
echo '</html>' >> components/fin-hypergrid/demo.html

# send it all up
git add . >/dev/null
git commit -q -m '(See gh-pages.sh on master branch.)'
git push -ufq origin gh-pages

# back to workspace
popd >/dev/null

# remove temp directory
rm -rf ../temp >/dev/null

echo 'Opening page at http://$org.github.io/$repo/ ...'
open http://$org.github.io/$repo/
echo 'CAVEAT: New pages may not be immediately available so wait a few minutes and refresh.'
