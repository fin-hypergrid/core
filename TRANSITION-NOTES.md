## Transition Notes

Hypergrid has a new home!

Always open source, the Hypergrid repository is now fully community owned and managed at https://github.com/fin-hypergrid.

While Github automatically will forward all `http:`, `https:` and `git:` requests made to the old repo, it is recommended that you update your clones to the new URL with `git remote` (see bottom of [this page](https://help.github.com/articles/about-repository-transfers)).

Be aware, however, that requests to GitHub's CDN pages at https://openfin.github.io/fin-hypergrid are _not_ forwarded automatically. For continuity with existing pages that make such requests (via <script> tag), we have retained the 2.0.2 build files in the [old repo](https://github.com/openfin/fin-hypergrid)'s CDN location (but not the demos or the docs access via HTTP because those links are forwarded). The 1.3 build files can be accessed by adding `/v1.3.0` after the domain name.

The current release (v2.0.2) can also be found on the new CDN; all new releases will be pushed to the new CDN _only._ **We recommend updating your apps to make requests against the new CDN.** Please see the [_Access_](ACCESS.md) page for details. (Note in particular that all build files on the new CDN include version numbers.) 
