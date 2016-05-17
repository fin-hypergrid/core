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
# dependencies to github pages

# usage gp Polymer core-item [branch]
# Run in a clean directory passing in a GitHub org and repo name

org="openfin"
repo="fin-hypergrid"
docsRepo="fin-hypergrid-polymer-demo"
branch="polymer-prototype" # default to master when branch isn't specified

#delete existing temp and recreate it, them move there
rm -rf ../temp
mkdir ../temp
cd ../temp

# Make target repo
git clone http://github.com/$org/$docsRepo.git --single-branch

# switch to a gh-pages branch
pushd $docsRepo
git checkout --orphan gh-pages

# remove all content
git rm -rf .

git clone -b $branch http://github.com/$org/$repo.git components/$repo

## Update deps
#Build Hypergrid, #vulcanize needed globally
pushd components/$repo/
pwd

npm install
bower cache clean
#echo "{
#  \"name\": \"$docsRepo#gh-pages\",
#  \"private\": true
#}
#" > bower.json
#echo "{
#  \"directory\": \"components\"
#}
#" > .bowerrc
bower install
grunt build

#Removed all hidden files
rm -rf .*  2> /dev/null

popd >/dev/null

## redirect by default to the component folder
echo "<META http-equiv="refresh" content=\"0;URL=components/$repo/\">" >index.html

# send it all to github
git add -A .
git commit -am 'seed old polymer docs'
git push -u origin gh-pages --force

popd >/dev/null
