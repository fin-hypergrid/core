org="openfin"
module="fin-hypergrid"

# set variable repo to current directory name (without path)
repo=${PWD##*/}

# remove temp directory in case it already exists, remake it, switch to it
rm -rf ../temp >/dev/null
mkdir ../temp
pushd ../temp >/dev/null

# clone it so it will be a branch of the repo
git clone -q --single-branch http://github.com/$org/$repo.git
cd $repo >/dev/null

# make sure the docs are built
gulp build >/dev/null
gulp doc >/dev/null

# stash relevant folders
mv demo doc ..

# create and switch to a new gh-pages branch
git checkout -q --orphan gh-pages

# remove all content from this new branch
git rm -rf -q .

# copy the doc directory from the stash
cp -R ../../doc . >/dev/null

# copy the contents of the demo directory (which includes index.html) from the stash
cp -R ../../demo/* . >/dev/null

# send it up
git add . >/dev/null
git commit -q -m '(See gh-pages.sh on master branch.)'
git push -ufq origin gh-pages >/dev/null

# back to workspace
popd >/dev/null

# remove temp directory
# rm -rf ../temp >/dev/null

echo 'Opening page at http://$org.github.io/$repo/ ...'
open http://$org.github.io/$repo/
echo 'CAVEAT: New pages will not be immediately available so wait a few minutes and refresh.'
