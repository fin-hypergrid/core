// this example script creates a sortable 1MM row table

\p 5000

\l hypergrid-support.q

//turn on sorting
features[`sorting]:1b;

holdingId:`abcde`bcdef`cdefgh`defgh`efghi`fghij`ghijk;
symbol:`msft`amat`csco`intc`yhoo`aapl;
trader:`chico`harpo`groucho`zeppo`moe`larry`curly`shemp`abbott`costello;
sector:`energy`materials`industrials`financials`healthcare`utilities`infotech;
strategy:`statarb`pairs`mergerarb`house`chart`indexarb

n:1000000;
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
