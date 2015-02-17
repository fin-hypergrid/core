/// copyright stevan apter 2004-2015

// treetable

\d .tt

/ construct treetable
cons:{[t;p;a;s;g;f]cons_[csub[csym[t]g]g,f;p;(f inter key a)#a;s]. ungrp[t;g]f}
cons_:{[t;p;a;s;g;f]0!ctl[1!(0!d)tsort[d:dat[t;p;rollups[t;g]a;g]f,`s_]s;p]g}

/ symbolize non-symbolic grouping fields
csym:{[t;g]![t;();0b;h!(`$string@;)each h:.tt.csym_[t]g]}
csym_:{[t;g]exec c from meta?[t;();0b;g!g]where t<>"s"}

/ flatten if keys in G
ungrp:{[t;g;f]if[all keys[t]in g;f:distinct g,f;g:0#`];(g;f)}

/ column subset
csub:{[t;f]![?[t;();0b;f!f];();0b;(1#`s_)!1#1]}

/ control table
ctl:{[z;p;g]
 n_:key[z]`n_;e_:isleaf[n_]g;l_:level n_;o_:isopen[n_]p;p_:parent n_;g_:hierarchy'[e_;n_;get[z]`s_];
 update n_:n_,e_:e_,l_:l_,p_:p_,o_:o_,g_:g_ from z}
 
/ construct g_
hierarchy:{$[x;`;`$string[last y],"[",string[z],"]"]}

/ predicates
isopen:{[n;p](0!p)[`v](get each key[p]`n)?n}
isleaf:{[n;g]level[n]>count g}

/ level of each record
level:{[n]count each n}

/ path-list -> parent-vector
parent:{[n]n?-1_'n}

/ data table (serial/parallel)
dat:{[t;p;a;g;h]key[z]!flip h!get[z:1!`n_ xasc root[t;g;a]block[t;g;a]/visible p]h}

/ visible paths
visible:{[p]n where all each(exec v from p)(reverse q scan)each til count q:parent n:exec n from p}

/ instruction -> constraint
constraint:{[p]flip(=;key p;flip enlist get p)}

/ construct root block
root:{[t;g;a](`n_,g)xcols node_[g;`]flip enlist each?[t;();();@[a;g;:;{`},'g]]}

/ construct a block = node or leaf
block:{[t;g;a;r;p]r,(`n_,g)xcols$[g~key p;leaf;node g(`,g)?last key p][t;g;a]p}

/ construct node block
node:{[b;t;g;a;p]node_[g;b]get?[t;constraint p;enlist[b]!enlist b;a]}
node_:{[g;b;t]![t;();0b;enlist[`n_]!2 enlist/$[null[b]|not count g;enlist 0#`;(1+g?b)#/:flip flip[t]g]]}

/ construct leaf block
leaf:{[t;g;a;p]leaf_[g;`$string til count u]u:0!?[t;constraint p;0b;@[last each a;g;:;g]]}
leaf_:{[g;i;t]![t;();0b;enlist[`n_]!2 enlist/$[count g;flip[flip[t]g],'i;flip enlist i]]}

/ discard invalid paths
paths:{[p;g]1!(0!p)where til[count g]{(count[y]#x)~y}/:g?/:key each exec n from p}

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
 f:{x$[not t:type y;::;t in 10 11h;lower;abs]y};
 j:msort[0!t;key o;(`a`d`A`D!(iasc;idesc;f iasc;f idesc))get o]each i;
 n?pmesh over n j}

/ parent-vector -> child-list
children:{[p]@[(2+max p)#enlist();first[p],1+1_p;,;til count p]}

/ multi-sort
msort:{[t;c;o;i]i{x y z x}/[til count i;o;flip[t i]c]}

/ mesh nest of paths
pmesh:{i:1+x?-1_first y;(i#x),y,i _ x}

/ rollup: first if 1=count else null
nul:{first$[1=count distinct x,();x;0#x]}

/ rollup: first if 1=count else
seq:{$[1=count distinct x;first x;`$string[first x],"+"]}

/ type -> rollup
A:" bgxhijefcspmdznuvt"!(nul;any;nul;nul;sum;sum;sum;sum;sum;nul;seq;max;max;max;max;max;max;max;max)

/ rollups
rollups:{[t;g;a]@[rollups_[t]a;`s_,g;:;enlist[(sum;`s_)],nul,'g]}
rollups_:{[t;a]@[a;k;:;A[lower qtype[t]k],'k:cols[t]except key a]}

/ cast <- type
qtype:{exec c!t from meta x}

\d .

// globals

/ qtypes
Q::.tt.qtype T

/ count of Z
N::count Z

/ visible order
F::cols[T]except G

/ group by
G:()

/ groupable
H::exec c from meta get T where t in"bhijspmdznuvt"

/ invisible
I::cols[T]except G,F

/ rollups
A:()!()

/ instruction state
P:([n:enlist(0#`)!0#`]v:enlist 1b)

/ rows -> gui
R:`start`end!0 100

/ sorts (a,d)
S:()!()

\

/ parallel
dat:{[t;p;a;g;h]key[z]!flip h!get[z:1!`n_ xasc root[t;g;a],raze block[t;g;a;()]peach visible p]h}
