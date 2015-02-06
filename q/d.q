\e 1
\p 12345
\P 14
\l t.q

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
 price:50+.23*n?400;
 quantity:(100*10+n?20)-2000;
 date:2000.01.01+asc n?365;
 time:09:30:00.0+n?23000000)

G:`sector`trader`strategy
A[`price]:(avg;`price)
A[`tradeId]:(.tt.nul;`tradeId)
