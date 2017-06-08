## Transition Notes

Hypergrid has a new home!

Always open source, the Hypergrid repository is now fully community owned and managed at https://github.com/fin-hypergrid.

### Remote Repository

Hypergrid developers: You must update your remotes with `git remote` to point to the new URL (see bottom of [this page](https://help.github.com/articles/about-repository-transfers)).

### CDN

For continuity with existing pages that make requests (via <script> tag) to Hypergrid's legacy "GitHub Pages" CDN (URLs beginning with https://openfin.github.io/fin-hypergrid), we have retained just the build files for v2.0.2 and v1.3.0 in that location. Note that this legacy hosting pertains only to the build files. 

The current release (v2.0.2) can also be found on the new CDN; all new releases will be pushed to the new CDN at https://fin-hypergrid.github.io/core _only._ **We recommend updating your apps to make requests against the new CDN.**

### See also...

Please see the [_Access_](ACCESS.md) page for full details. In particular, note that:
* All build files on the new CDN include version numbers.
* Demos and API documentation are only avaialble from the new CDN.
