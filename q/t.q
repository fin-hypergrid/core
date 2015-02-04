\e 1
\p 12345
\P 14

// treetable

\d .tt

/ construct treetable
cons:{[t;g;p;a;s;h]cons_[csub[t]g,h;g;p;a;s]h}

cons_:{[t;g;p;a;s;h]
 d:dat[t;g;p;rollups[t]a]h;
 d:1!(0!d)tsort[d]s;
 z:get d;z_:ctl[d;g]p;
 (z;z_)}

/ column subset
csub:{[t;f]?[t;();0b;f!f]}

/ block of rows
rows:{[r;v]take[v]. r`start`end}
take:{[v;s;e]$[s>=count v;0#v;((1+e-s)&count z)#z:s _ v]}

/ data table
dat:{[t;g;p;a;h]
 z:1!`n_ xasc root[t;g;a]block[t;g;a]/visible p;
 key[z]!flip h!get[z]h}

/ control table
ctl:{[t;g;p]
 c:([]n_:key[t]`n_;l_:level t;e_:isleaf[t]g;o_:isopen[t]p);
 update p_:.tt.parent n_,h_:e_{$[x;`;last y]}'n_ from c}

/ predicates
isopen:{[t;p](0!p)[`v](get each key[p]`n)?key[t]`n_}
isleaf:{[t;g]level[t]>count g}

/ level of each record
level:{[t]count each key[t]`n_}

/ visible paths
visible:{[p]
 q:parent n:exec n from p;
 k:(reverse q scan)each til count q;
 n where all each(exec v from p)k}

/ path-list -> parent-vector
parent:{[n]n?-1_'n}

/ instruction -> constraint
constraint:{[p]flip(=;key p;flip enlist get p)}

/ construct root block
root:{[t;g;a](`n_,g)xcols node_[g;`]flip enlist each?[t;();();@[a;g;:;{`},'g]]}

/ construct a block = node or leaf
block:{[t;g;a;r;p]
 f:$[g~key p;leaf;node g(`,g)?last key p];
 r,(`n_,g)xcols f[t;g;a]p}

/ construct node block
node:{[b;t;g;a;p]
 c:constraint p;
 a[h]:first,'h:(i:g?b)#g;
 a[h]:nul,'h:(1+i)_g;
 node_[g;b]get?[t;c;enlist[b]!enlist b;a]}

/ compute n_ for node block
node_:{[g;b;t]
 n:$[null[b]|not count g;enlist 0#`;(1+g?b)#/:flip flip[t]g];
 ![t;();0b;enlist[`n_]!2 enlist/n]}

/ construct leaf block
leaf:{[t;g;a;p]
 c:constraint p;
 a:last each a;
 a[g]:g;
 leaf_[g]0!?[t;c;0b;a]}

/ compute n_ for leaf block
leaf_:{[g;t]
 i:`$string til count t;
 n:$[count g;flip[flip[t]g],'i;flip enlist i];
 ![t;();0b;enlist[`n_]!2 enlist/n]}

/ keep valid paths
paths:{[p;g]
 n:key each exec n from p;
 i:where til[count g]{(count[y]#x)~y}/:g?/:n;
 1!(0!p)i}

/ open/close to group (h=` -> open to leaves)
opento:{[t;g;h]
 k:(1+til count k)#\:k:(g?h)#g;
 n:enlist(0#`)!0#`;
 f:{y,z!/:distinct flip flip[x]z};
 m:distinct n,raze f[t;n]each k;
 ([n:m]v:count[m]#1b)}

/ open/close at a node
at:{[b;p;g;n]p,([n:enlist(count[n]#g)!n,()]v:enlist b)}

/ treetable sort
tsort:{[t;o]
 n:exec n_ from t;
 i:children[parent n]except enlist();
 j:msort[0!t;key o;(`a`d!(iasc;idesc))get o]each i;
 n?pmesh over n j}

/ parent-vector -> child-list
children:{[p]@[(2+max p)#enlist();first[p],1+1_p;,;til count p]}

/ multi-sort
msort:{[t;c;o;i]i{x y z x}/[til count i;o;flip[t i]c]}

/ mesh nest of paths
pmesh:{i:1+x?-1_first y;(i#x),y,i _ x}

/ first if 1=count else null (for syms, non-summable nums)
nul:{first$[1=count distinct x,();x;0#x]}

/ discard invalid paths
valid:{[p;g]
 n:key each exec n from p;
 i:where til[count g]{(count[y]#x)~y}/:g?/:n;
 1!(0!p)i}

/ cast <- type
qtype:{exec c!t from meta x}

/ default rollups
rollups:{[t;a]@[a;k;:;((.tt.nul;sum)qtype[t][k]in"HIJEFhijef"),'k:cols[t]except key a]}

\d .

// websocket communications

$[.z.K<3.3;
  [.z.pc:{[w]if[w=WS;WS::0]};
   .z.po:{[w]WS::.z.w;.js.set()!()}];
  [.z.wc:{[w]if[w=WS;WS::0]};
   .z.wo:{WS::.z.w;.js.set()!()}]];

.z.ws:{.js.snd .js.exe .js.sym .j.k x}

/ entry points

.js.node:{[d]$[0=count n:d`node;d;count[Z_]=r:Z_[`n_]?n;d;[`P set .tt.at[not Z_[`o_]r;P;G]n;.js.set d]]}
.js.sorts:{[d]`S set d[`cols]!d`sorts;i:.tt.tsort[Z,'Z_]S;Z@:i;Z_@:i;.js.ret d}
.js.groups:{[d]`G set d`cols;`P set .tt.valid[P]G;.js.set d}
.js.cols:{[d]`H set d`cols;.js.set d}
.js.get:{[d]`R set`start`end!"j"$d`start`end;.js.ret d}

/ utilities

.js.snd:{neg[WS].j.j x}
.js.sym:{$[(t:abs type x)in 0 99h;.z.s each x;10=t;`$x;x]}
.js.exe:{.js[x`fn]x}
.js.upd:{.js.snd .js.set()!()}
.js.set:{`Z`Z_ set'.tt.cons[T;G;P;A;S]H;.js.ret x}
.js.sub:{[z]flip each(1#;1_)@\:.tt.rows[R]z}
.js.obj:{`Z`Z_`G`G_`H`H_`Q`S`R`N!(.js.sub Z;.js.sub Z_;G;where["S"=q]except G;H;cols[T]except H;q:.tt.qtype T;S;R;count Z)}
.js.ret:{x,.js.obj[]}

// globals

/ group by
G:0#`

/ visible order
H::cols[T]except G

/ rollups
A:()!()

/ updates (update, append, delete)
U:(1#sum)!enlist`u`a`d!({x+y-z};+;-)

/ instruction state
P:([n:enlist(0#`)!0#`]v:enlist 1b)

/ rows -> gui
R:`start`end!0 100

/ sorts (a,d)
S:()!()

// example

holdingId:`abcde`bcdef`cdefgh`defgh`efghi`fghij`ghijk
symbol:`msft`amat`csco`intc`yhoo`aapl
trader:`chico`harpo`groucho`zeppo`moe`larry`curly`shemp`abbott`costello
sector:`energy`materials`industrials`financials`healthcare`utilities`infotech
strategy:`statarb`pairs`mergerarb`house`chart`indexarb

n:100000
T:1!([]
 tradeId:til n;
 holdingId:n?holdingId;
 symbol:n?symbol;
 sector:n?sector;
 trader:n?trader;
 strategy:n?strategy;
 time:09:30:00.0+n?23000000;
 price:50+.23*n?400;
 quantity:(100*10+n?20)-2000;
 date:2000.01.01+asc n?365;
 price1:50+.23*n?400;
 amount1:n?1.0;
 price2:50+.23*n?400;
 amount2:(20*til n)_(n*20)?100;
 date2:2000.01.01+asc n?365;
 price3:50+.23*n?400;
 amount3:(20*til n)_(n*20)?100;
 date3:2000.01.01+asc n?365;
 price4:50+.23*n?400;
 amount4:100*10+n?20;
 date4:2000.01.01+asc n?365;
 amount5:100*10+n?20)

G:`sector`trader`strategy
H:`symbol`price`quantity

.js.set()!();

\

/ change grouping

m:update trader:`zelda,price:price+1,quantity:quantity+10 from 1!20#0!select tradeId,trader,price,quantity from T where sector=`financials,trader=`abbott,strategy=`pairs
m:update tradeId:100000+til 10 from m where i<10

\

.js.exe`id`fn`node!(`;`node;1#`financials)
.js.exe`id`fn`node!(`;`node;`financials`abbott)

t:T

update trader:`foo from `T where sector=`financials,trader=`abbott,strategy=`pairs

\


.js.set()!();

.js.exe`id`fn`node!(`;`node;1#`financials)
.js.exe`id`fn`node!(`;`node;`financials`harpo)
.js.exe`id`fn`node!(`;`node;`financials`harpo`statarb)

/ update

j:3#exec i from T where sector=`financials,trader=`harpo,strategy<>`statarb
o:1!select tradeId,price,quantity,price3,symbol from T where i in j
update price:price+1,quantity:quantity+10,price3:price+5,symbol:`AARRGGH from`T where i in j
n:1!select tradeId,price,quantity,price3,symbol from T where i in j

t:T
z:Z;z_:Z_
g:t[key n;G]
p:z_[`p_]\'[z_[`n_]?g]
c:cols[n]inter cols z
a:?[n;();0b;c!c]
b:?[o;();0b;c!c]
u:U[first each .tt.rollups[a;A]c]`u
b:null u
d:c where b
f:{[d;g]1!?[T;G(=;;)'enlist each g;0b;d!d]}
t:raze f[`tradeId,G,c,key S]each g
`z`z_ set'.tt.cons[t;G;P;A;S]d
Z[Z_[`n_]?z_`n_;d]:z[::;d]

/ w/ u.u
c@:where not b
c@:where not b
u@:where not b
a:?[n;();0b;c!c]
b:?[o;();0b;c!c]
f:{[c;u;z;p;a;b]z[p;c]:flip get{[u;z;a;b]u[z;a]b}'[u;z[p]c;a]b;z}
z:f[c;u]/[Z;p;a;b]

/ append

z:Z;z_:Z_
q:select from T where i in j
q:update tradeId:99999+1+til[count j]from q
`T upsert q
g:T[key q;G]
p:z_[`p_]\'[z_[`n_]?g]
c:cols[z]inter cols a:get q
u:U[first each .tt.rollups[a;A]c]`a
b:null u
d:c where b
f:{[d;g]1!?[T;G(=;;)'enlist each g;0b;d!d]}
t:raze f[`tradeId,G,c,key S]each g
h:{[g]select from P where n in raze g{y!count[y]#x}/:\:til[1+count G]#\:G}
`z`z_ set'.tt.cons[t;G;P;A;S]d
Z[Z_[`n_]?z_`n_;d]:z[::;d]

/ w/ u.a
c@:where not b
u@:where not b
a:?[q;();0b;c!c]
f:{[c;u;z;p;a]z[p;c]:flip get{[u;z;a]u[z]a}'[u;z[p]c]a;z}
z:f[c;u]/[Z;p;a]

/ delete

q:select from T where i in j
g:T[key q;G]
delete from `T where i in j
p:z_[`p_]\'[z_[`n_]?g]
c:cols[z]inter cols a:get q
u:U[first each .tt.rollups[a;A]c]`d
b:null u
d:c where b
f:{[d;g]1!?[T;G(=;;)'enlist each g;0b;d!d]}
t:raze f[`tradeId,G,c,key S]each g
`z`z_ set'.tt.cons[t;G;P;A;S]d
Z[Z_[`n_]?z_`n_;d]:z[::;d]

/ w/ u.d
c@:where not b
u@:where not b
a:?[q;();0b;c!c]
f:{[c;u;z;p;a]z[p;c]:flip get{[u;z;a]u[z]a}'[u;z[p]c]a;z}
z:f[c;u]/[Z;p;a]

\

cells:{[n]
 f:{z;where 0=floor x?1%y};
 r:distinct f[count T;.0001]each til n;
 c:c f[count c:1_cols T;.3]each til count r;
 diffs[r]c}

diffs:{[r;c](r xfrc[incr]'c;r xfrc[{y}]'c)}
xfrc:{[f;r;c]key[T][r]!flip c!c f'(0!T)[r]c}
incr:{[c;d]$[c in key`.;count[d]?get c;d+1]}

\t .js.exe`id`fn`node!(`;`node;1#`financials)                       ;Z1:Z,'Z_; P1:P
\t .js.exe`id`fn`node!(`;`node;`financials`harpo)                   ;Z2:Z,'Z_; P2:P
\t .js.exe`id`fn`node!(`;`node;`financials`harpo`statarb)     ;Z3:Z,'Z_; P3:P
\t .js.exe`id`fn`node!(`;`node;1#`financials)                          ;Z4:Z,'Z_; P4:P
\t .js.exe`id`fn`node!(`;`node;1#`financials)                          ;Z5:Z,'Z_; P5:P
\t .js.exe`id`fn`cols`sorts!(`;`sorts;`quantity`price;`a`a) ;Z6:Z,'Z_;
\t .js.exe`id`fn`cols!(`;`groups;`sector`strategy)                    ;Z7:Z,'Z_;
\t .js.exe`id`fn`cols!(`;`cols;reverse H)                               ;Z8:Z,'Z_;
\t .js.exe`id`fn`start`end!(`;`set;5;120)                           ;Z9:Z,'Z_;

