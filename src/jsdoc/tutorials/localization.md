The file ./src/lib/localization.js provides "localization agents" that know how to:
* Localize a data value into a string representation for:
  * Grid display
  * Cell editor pre-load
* Standardize a localized string back into a typed primitive (or object) for writing back to a data row.
* Check an edited localized string for illegal characters (implementation optional).
 
