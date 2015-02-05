/// copyright stevan apter 2004-2015

\e 1
\p 12345
\P 14

// treetable

\d .tt

/ construct treetable
cons:{[t;g;p;a;s;h]cons_[csub[t]g,h;g;p;a;s]h}

cons_:{[t;g;p;a;s;h]
 d:dat[t;g;p;rollups[t;g]a]h;
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
 f:{x((abs;lower)type[y]in 10 11h)y};
 j:msort[0!t;key o;(`a`d`A`D!(iasc;idesc;f iasc;f idesc))get o]each i;
 n?pmesh over n j}

/ parent-vector -> child-list
children:{[p]@[(2+max p)#enlist();first[p],1+1_p;,;til count p]}

/ multi-sort
msort:{[t;c;o;i]i{x y z x}/[til count i;o;flip[t i]c]}

/ mesh nest of paths
pmesh:{i:1+x?-1_first y;(i#x),y,i _ x}

/ discard invalid paths
valid:{[p;g]
 n:key each exec n from p;
 i:where til[count g]{(count[y]#x)~y}/:g?/:n;
 1!(0!p)i}

/ first if 1=count else null (for syms, non-summable nums)
nul:{first$[1=count distinct x,();x;0#x]}

/ count
cnt:{`$"N=[",string[count x],"]"}

/ type -> rollup
A:" bgxhijefcspmdznuvt"!(cnt;all;cnt;cnt;sum;sum;sum;sum;sum;nul;cnt;max;max;max;max;max;max;max;max)

/ default rollups
rollups:{[t;g;a]@[@[a;k;:;A[lower qtype[t]k],'k:cols[t]except g,key a];g;:;nul,'g]}

/ cast <- type
qtype:{exec c!t from meta x}

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
.js.obj:{`Z`Z_`G`G_`H`H_`Q`S`R`N!(.js.sub Z;.js.sub Z_;G;where["S"=q]except G;H;cols[T]except H;q:.tt.qtype T;`cols`sorts!(key S;get S);R;count Z)}
.js.ret:{x,.js.obj[]}

// globals

/ group by
G:0#`

/ visible order
H::cols[T]except G,keys T

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
