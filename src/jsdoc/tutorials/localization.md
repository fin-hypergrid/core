The file ./src/lib/localization.js provides "localization agents" that know how to:
* Localize a data value into a string representation for:
  * Grid display
  * Cell editor pre-load
* Standardize a localized string back into a typed primitive (or object) for writing back to a data row.
* Check an edited localized string for syntax or just for illegal characters (implementation optional).
 
The API includes factory functions that invoke the `Intl` API for numbers and dates. On instantiation, the singleton Localization object "constructs" basic `number` and `date` localizers using these factory functions. It also defines several other localizers (). You can also add your own custom localizers using the `grid.localization.add` method. For numbers and dates, use the factory functions. For other formats, supply an object that conforms to the localization API interface (has the required `format` and `parse` methods; and the optional `isValid` method).


For illustration purposes, however, here's a simple implementation of this localizer:

```javascript
var hhmm = {
    // returns formatted string from number
    format: function(mins) {
        var hh = Math.floor(mins / 60),
            mm = (mins % 60 + 100 + '').substr(1, 2);
        return hh + ':' + mm;
    },
    
    // tests input for full validity
    invalid: function(hhmm) {
        return /^([01]?\d|2[0-3]):[0-5]\d$/.test(hhmm); // 23:59 max
    },
    
    // returns number from formatted string
    parse: function(hhmm) {
        var parts = hhmm.match(/^(\d+):(\d{2})$/);
        return Number(parts[1]) * 60 + Number(parts[2]);
    }
};
```
