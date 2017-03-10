# What Hypergrid is and isn't 

##  Hypergrid is a View

It's sole functionality is as a high performant rendering API, with a robust event-driven plug-in architecture. 
The core grid definition encompasses:

* Infinite, smooth scrolling (cell based)
* Ability to "Visualize" Nested Data
* Localization
* Cell Editors & Renderers
* Column/Row Dragging and Sizing
* Column/Row Freezing
* Keyboard Navigation
* Inline Editing
* Arbitrary Remote or Local Data-binding
* Themeable
* Customizable ScrollBars
* Evergreen Browser Support
* Clipboard Support
* Selection

## What is expected of the User

Any feature built on top of the above list functionalities is deemed specific to the user's codebase. 
The core tenet is that the user listens to grid events, transforms their data outside of the grid (whether it be local in the same Javascript thread or on a remote server) and then re-binds the new data sets to grid for extremely fast rendering and viewing. Even with regards to aggregations/treeview/grouping/etc, post your data transformation, we have facilities to help you view the inherent hierarchy of such data but not build it.

Hypergrid must assume no knowledge of the data's source or shape other than to know how to present it. 
Truly a View in the Model-View-Controller sense of the word. *Users must provide their own analytics engine*. 

## Why?

Take for example sorting, why is not in Hypergrid by default? 
Thinking of Hypergrid as an API for a view and not an actual spreadsheet gives us that different perspective. 
Certainly there's not too many different ways "standard" sorting could done effectively for a standard grid. 
However if Hypergrid is to be useful for column oriented data, grouped data, heirarchal structures, sorting for an infinite data set and so forth it might be easier to see why it's wiser to let users implement their own rules. 

What we will lose in initial default functionality, 
we aim to regain with much better documentation and tutorials (such that a barebones native JS array sort or simple index can be demonstrated) and in more initial flexibility.
