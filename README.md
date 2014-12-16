fin-hypergrid
================

See the [component page](http://openfin.github.io/fin-hypergrid/components/fin-hypergrid/) for more information.

## Getting Started
[Download](https://dl.openfin.co/services/download?fileName=hypergrid-demo-installer&config=http://openfin.github.io/fin-hypergrid/components/fin-hypergrid/demo.json) the openfin installer to see the demo running on your desktop. 
Here is a [guide for polymer](https://www.polymer-project.org/) to help get you rolling.

grid-excel-integration
======================

This is an example of integration between the hypergrid and Microsoft Excel over the OpenFin InterApplicationBus.

It consists of an OpenFin app, and a C# XLL plugin built using the Excel-DNA infrastructure.  


The Excel-DNA infrastructure provides a C++ XLL plugin which exposes the Excel Object Model to C# dll's and code which can be configured using a manifest file (.dna)

The /excel folder [download from zip](http://openfin.github.io/fin-hypergrid/components/fin-hypergrid/excel.zip) contains the implementation of the OpenFin C# adapter which connects to the OpenFin runtime over WebSockets, and exposes the InterApplicationBus to C# code.

The *desktop-cs-excel* folder contains the Excel-DNA interfaces in the *ExcelRtdAddin/RtdServer.cs* file, and also contains a complete distribution of the DNA source code in the Dna subfolder.

*ExcelRtdAddin/RtdServer.cs* combines the ExcelRtdServer interface with the asynchronous OpenFin DesktopStateListener interfaces to expose a higher level set of classes DesktopRtdServer and SubscriptionRtdServer which can be used to integrate Excel functionality with OpenFin.  The SelectionRtdServer class implements the grid specifc behavior using a simple JSON serialisation of the selection, and provides updates from Excel using delegates on the ExcelDnaUtil.Application object and its associated worksheets.


running
=======

To test that the Excel-DNA infrastructure is working on your system first load the appropriate 32bit or 64bit .xll file from the *desktop-cs-excel/Dna/Distribution/* folder.  You should be prompted with a security warning to enable the addin, after which you can create a new worksheet and enter the following formula in a cell (as described in ExcelDna.dna):

*=AddThem(5,10)*

You should see 15 as the result.

If this is working then you can proceed to installing the OpenFin runtime and setting up the grid application to be hosted locally.  You can also use the default remotely hosted grid if you like, but its better for learning to use the locally hosted version.

Run the grid installer from here [here.](https://dl.openfin.co/services/download?fileName=hypergrid-demo-installer&config=http://openfin.github.io/fin-hypergrid/components/fin-hypergrid/demo.json)

This will add a shortcut to your desktop which will connect to the remote grid using the default url.  

Once verified you can launch either the x86 or x64 OpenFin .xll addin:

*desktop-cs-excel/ExcelRtdAddin/bin/x86/Release/FinDesktopAddin.xll*

*desktop-cs-excel/ExcelRtdAddin/bin/x64/Release/FinDesktopAddin64.xll*


Then open the xlsx file 'hypergrid.xlsx' found in the root of the downloaded excel.zip

This will show two worksheets, the first sheet should now show data from the grid when you click a cell or if you hold shift and click multiple cells.  You can edit a cell which has a value in Excel and that change will be reflected in the equivalent grid cell.


links
=====

http://exceldna.codeplex.com/

https://exceldna.codeplex.com/documentation

http://nodejs.org/download/

