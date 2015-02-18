/// copyright stevan apter 2004-2015

\e 1
\p 12346
\P 14
\c 25 150
\t 2000

\l t.q
\l w.q

// example

holdingId:`abcde`bcdef`cdefgh`defgh`efghi`fghij`ghijk
symbol:`msft`amat`csco`intc`yhoo`aapl
trader:`chico`harpo`groucho`zeppo`moe`larry`curly`shemp`abbott`costello
sector:`energy`materials`industrials`financials`healthcare`utilities`infotech
strategy:`statarb`pairs`mergerarb`house`chart`indexarb

n:1000000
T:([tradeId:til n]
 holdingId:n?holdingId;
 symbol:n?symbol;
 sector:n?sector;
 trader:n?trader;
 strategy:n?strategy;
 price:{0.01*"i"$100*x}20+n?400.;
 quantity:-50+n?100;
 date:2000.01.01+asc n?365;
 time:09:30:00.0+n?06:30)

G:`sector`trader`strategy
F:`holdingId`symbol`price`quantity`date`time
A[`price]:(avg;`price)
A[`tradeId]:(.tt.nul;`tradeId)

/ define Z
.js.set()!();

/ update
.z.ts:{update price:price+-.5+count[T]?1.,quantity:quantity+-5+count[T]?10 from`T;.js.ups`price`quantity;}