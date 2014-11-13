// this example script spoofs a 100MM row table using a vector of shorts that index into
// a 255 row table, sorting is not supported in this example as it will blow up
// the 32 bit free version of Q

$[.z.K<3.19999;0N! "You need version 3.2 or later for this, please download a more recent version of q";]
\p 5000

features:flip (
    (`sorting;   0b);
    (`foo;       0b)
 );
features:features[0]!features[1];

0N! "generate random row ordering";
numRows:100000000;

holdingId:`abcde`bcdef`cdefgh`defgh`efghi`fghij`ghijk;
symbol:`msft`amat`csco`intc`yhoo`aapl;
trader:`mustafa`reidel`wynn`armatas`markovitz`bierly`tulchinsky;
sector:`energy`materials`industrials`financials`healthcare`utilities`infotech;
strategy:`statarb`pairs`mergerarb`house`chart`indexarb

n:255;
trade:([]
 tradeId:til n;
 holdingId:n ? holdingId;
 symbol:n ? symbol;
 sector:n ? sector;
 trader:n ? trader;
 strategy:n ? strategy;
 time:09:30:00.0+n?23000000;
 price:50 + .23 * n ? 400;
 quantity:(100 * 10 + n ? 20) - 2000;
 date:2000.01.01 + asc n ? 365;
 price1:50 + .23 * n ? 400;
 amount1:n ? 1.0;
 price2:50 + .23 * n ? 400;
 amount2:(20*til n)_((n*20)?100);
 date2:2000.01.01 + asc n ? 365;
 price3:50 + .23 * n ? 400;
 amount3:(20*til n)_((n*20)?100);
 date3:2000.01.01 + asc n ? 365;
 price4:50 + .23 * n ? 400;
 amount4:100 * 10 + n ? 20;
 date4:2000.01.01 + asc n ? 365;
 amount5:100 * 10 + n ? 20);


\t rowsIndexes:numRows?`short$til 255;

window:{[start;num]
    ii: start + til num;
    ([]row:ii),'trade[rowsIndexes[ii]]}

.z.ws:{
  message: .j.c x;
  @[`$message`cmd;message`data];
 }

fetch: {
  json: .j.j (`data`rows`headers`features)!(value each window[`long$(x`start);`long$(x`num)];numRows;(enlist (`row;"j")),(value each select c,t from meta trade);features);
    neg[.z.w] json; //negating a handle makes the sending of data async
 }


