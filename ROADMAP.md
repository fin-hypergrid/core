## Current Sprint Agenda 2/6/2017 - 2/27/2017

### Development

#### First Extractions <sup>[1](#myfootnote1)</sup>

- Column Picker / Manage Filters 
- Sorting
 - Will Investigate [504](https://github.com/openfin/fin-hypergrid/issues/504) & [505](https://github.com/openfin/fin-hypergrid/issues/505) as support is dropped
- Filtering
 - Will Close [310](https://github.com/openfin/fin-hypergrid/issues/310) as support is dropped

#### Features

- Serializable State
 - Addressing [309](https://github.com/openfin/fin-hypergrid/issues/309)

#### Bugs

- [492](https://github.com/openfin/fin-hypergrid/issues/492)
- [515](https://github.com/openfin/fin-hypergrid/issues/515)

### Documentation

#### JSDOC

- Continual Cleanup of API notes on [JSDOC](http://openfin.github.io/fin-hypergrid/doc/Hypergrid.html)

#### WIKIS

- Technical Architecture Overview "Birds-eye View"
- Hypergrid Example Full Walkthrough
- Navigation on Wiki Home Page
- Virtual Scrolling
- DrillDown Column Usage
 - Addressing [483](https://github.com/openfin/fin-hypergrid/issues/483)
 - Addressing [488](https://github.com/openfin/fin-hypergrid/issues/488)
 - Addressing [501](https://github.com/openfin/fin-hypergrid/issues/501)
- Virtual DrillDown Column Usage
- Rendering strategies
- Cleanup Columns Wiki
 - Freezing Columns
 - Columns Object
 - Calculated Columns
 - Column Schema
 - Hidden Column Rows

## EPIC Backlog
<sup>[2](#myfootnote2) For brevity, we list the outstanding major tasks left</sup>

- Continual Wikis and JSDoc updates
- Remaining extractions from the [add-ons](https://github.com/openfin/fin-hypergrid/tree/master/add-ons) folder
- Consume Native CSS Styling (Theming re-implemented)
- Montior FPS rate with new rendering strategies
- Eventing cleanup
- Cross Platform Support for the Evergreen Browsers
- Community Growth

<a name="myfootnote1">1</a>: 
*Please note that we are dropping support for our treeview, aggregations, grouping, filtering, sorting and analytics services in general. Our reasoning is defined [here](https://github.com/openfin/fin-hypergrid/blob/master/OVERVIEW.md). These existing services are being exported out of Openfin's github domain, but they will still be available for private forking by those interested.*

<a name="myfootnote2">2</a>:
If you would like to work on on these ideas or suggest your own, feel free to browse through our [github issues](https://github.com/openfin/fin-hypergrid/issues)
and read our [contributing guide](./CONTRIBUTING.md).
