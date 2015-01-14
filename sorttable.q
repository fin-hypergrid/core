// this example script creates a sortable 1MM row table

$[.z.K<3.19999;0N! "You need version 3.2 or later for this, please download a more recent version of q";]
\p 5000

features:flip (
    (`sorting;   1b);
    (`foo;       0b)
 );

features:features[0]!features[1];

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


window:{[start;num]
    ii: start + til num;
    ([]row:ii),'trade[ii]}

.z.ws:{
  message: .j.c x;
  @[`$message`cmd;message`data];
 }

fetch: {
  json: .j.j (`data`rows`headers`features)!(value each window[`long$(x`start);`long$(x`num)];count trade;(enlist (`row;"j")),(value each select c,t from meta trade);features);
    neg[.z.w] json; //negating a handle makes the sending of data async
 }


sf:parse "delete av from `av xasc update av:abs quantity from `trade"
sort: {
    $[0~count x`sort;
        [trade::`tradeId xasc select from trade];
        [sf[1;2;4;`av]:(`$x`sort);
         $[x`abs;
            $[11h~type (trade`$x`sort);;sf[1;2;4]:(enlist`av)!enlist (abs;`$x`sort)];
            ()];
        sf[1;0]:$[x`asc;xasc;xdesc];
        eval sf]
   ];
   fetch[x];
 }












