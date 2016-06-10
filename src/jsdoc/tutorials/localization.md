The file ./src/lib/localization.js provides "localization agents" that know how to:
* Localize a data value into a string representation for:
  * Grid display
  * Cell editor pre-load
* Standardize a localized string back into a typed primitive (or object) for writing back to a data row.
* Check an edited localized string for illegal characters (implementation optional).
 
The API includes factory functions that invoke the `Intl` API for numbers and dates. On instantiation, the singleton Localization object "constructs" basic `number` and `date` localizers using these factory functions. It also defines several other localizers (). You can also add your own custom localizers using the `grid.localization.add` method. For numbers and dates, use the factory functions. For other formats, supply an object that conforms to the localization API interface (has the required `format` and `parse` methods; and the optional `isValid` method).
