#!/bin/bash -e
#
# @license
# Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
# This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
# The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
# The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
# Code distributed by Google as part of the polymer project is also
# subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
#

# This script pushes a demo-friendly version of your element and its
# dependencies to gh-pages.

# usage gp Polymer core-item [branch]
# Run in a clean directory passing in a GitHub org and repo name
org="openfin"
repo="fin-hypergrid"
branch="master" # default to master when branch isn't specified

#delete existing dir
rm -rf $repo

# make folder (same as input, no checking!)
mkdir $repo
#git clone git@github.com:$org/$repo.git --single-branch
git clone http://github.com/$org/$repo.git --single-branch
# switch to gh-pages branch
pushd $repo >/dev/null
git checkout --orphan gh-pages

# remove all content
git rm -rf -q .

# use bower to install runtime deployment
bower cache clean $repo # ensure we're getting the latest from the desired branch.
echo "{
  \"name\": \"$repo#gh-pages\",
  \"private\": true
}
" > bower.json
echo "{
  \"directory\": \"components\"
}
" > .bowerrc

git clone http://github.com/$org/$repo.git components/$repo
rm -rf components/$repo/.git

cp -rf ../../core-component-page ./components/core-component-page
cp -rf ../../webcomponentsjs ./components/webcomponentsjs
cp -rf ../../polymer ./components/polymer
cp -rf ../../NodeBind ./components/NodeBind
cp -rf ../../TemplateBinding ./components/TemplateBinding
cp -rf ../../URL ./components/URL
cp -rf ../../observe-js ./components/observe-js
cp -rf ../../polymer-expressions ./components/polymer-expressions
cp -rf ../../polymer-gestures ./components/polymer-gestures
cp -rf ../../fin-rectangle ./components/fin-rectangle
cp -rf ../../fin-canvas ./components/fin-canvas
cp -rf ../../fin-vampire-bar ./components/fin-vampire-bar
cp -rf ../../accountingjs ./components/accountingjs

cp -rf ../../core-focusable ./components/core-focusable
cp -rf ../../core-icon ./components/core-icon
cp -rf ../../core-icons ./components/core-icons
cp -rf ../../core-iconset ./components/core-iconset
cp -rf ../../core-iconset-svg ./components/core-iconset-svg
cp -rf ../../core-meta ./components/core-meta
cp -rf ../../core-pages ./components/core-pages
cp -rf ../../core-selection ./components/core-selection
cp -rf ../../core-selector ./components/core-selector
cp -rf ../../core-splitter ./components/core-splitter
cp -rf ../../core-resizable ./components/core-resizable
cp -rf ../../paper-button ./components/paper-button
cp -rf ../../paper-icon-button ./components/paper-icon-button
cp -rf ../../paper-button ./components/paper-button
cp -rf ../../paper-tabs ./components/paper-tabs
cp -rf ../../paper-ripple ./components/paper-ripple


# redirect by default to the component folder
echo "<META http-equiv="refresh" content=\"0;URL=components/$repo/\">" >index.html

# send it all to github
git add -A .
git commit -am 'seed gh-pages'
git push -u origin gh-pages --force

popd >/dev/null
