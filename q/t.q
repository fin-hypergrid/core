/// copyright stevan apter 2004-2015

// treetable

\d .tt

/ construct treetable
cons:{[t;p;a;s;g;h]cons_[csub[t]g,h;p;a;s]. ungrp[t;g]h}

cons_:{[t;p;a;s;g;h]
 d:dat[t;p;rollups[t;g]a;g]h,`s_;
 d:1!(0!d)tsort[d]s;
 z:get d;z_:ctl[z;d;p]g;
 (delete s_ from z;z_)}

/ flatten if keys in G
ungrp:{[t;g;h]if[all keys[t]in g;h:distinct g,h;g:0#`];(g;h)}

/ column subset
csub:{[t;f]![?[t;();0b;f!f];();0b;(1#`s_)!1#1]}

/ block of rows
rows:{[r;v]take[v]. r`start`end}
take:{[v;s;e]$[s>=count v;0#v;((1+e-s)&count z)#z:s _ v]}

/ data table (serial/parallel)
dat:{[t;p;a;g;h]key[z]!flip h!get[z:1!`n_ xasc$[system"s";pdat;sdat][t;g;a]visible p]h}
sdat:{[t;g;a;p]root[t;g;a]block[t;g;a]/p}
pdat:{[t;g;a;p]root[t;g;a],raze block[t;g;a;()]peach p}

/ control table
ctl:{[z;t;p;g]
 c:([]s_:z`s_;n_:key[t]`n_;l_:level t;e_:isleaf[t]g;o_:isopen[t]p);
 update p_:.tt.parent n_,h_:.tt.hierarchy'[e_;n_;s_]from c}

/ construct h_
hierarchy:{$[x;`;`$string[last y],"[",string[z],"]"]}

/ predicates
isopen:{[t;p](0!p)[`v](get each key[p]`n)?key[t]`n_}
isleaf:{[t;g]level[t]>count g}

/ level of each record
level:{[t]count each key[t]`n_}

/ visible paths
visible:{[p]n where all each(exec v from p)(reverse q scan)each til count q:parent n:exec n from p}

/ path-list -> parent-vector
parent:{[n]n?-1_'n}

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
 f:{x((abs;lower)type[y]in 10 11h)y};
 j:msort[0!t;key o;(`a`d`A`D!(iasc;idesc;f iasc;f idesc))get o]each i;
 n?pmesh over n j}

/ parent-vector -> child-list
children:{[p]@[(2+max p)#enlist();first[p],1+1_p;,;til count p]}

/ multi-sort
msort:{[t;c;o;i]i{x y z x}/[til count i;o;flip[t i]c]}

/ mesh nest of paths
pmesh:{i:1+x?-1_first y;(i#x),y,i _ x}

/ first if 1=count else null
nul:{first$[1=count distinct x,();x;0#x]}

/ first if 1=count else (first
fpo:{$[1=count distinct x;first x;`$string[first x],"+"]}

/ type -> rollup
A:" bgxhijefcspmdznuvt"!(null;any;null;null;sum;sum;sum;sum;sum;nul;fpo;max;max;max;max;max;max;max;max)

/ default rollups
rollups:{[t;g;a]@[@[a;k;:;A[lower qtype[t]k],'k:cols[t]except g,key a];`s_,g;:;enlist[(sum;`s_)],nul,'g]}

/ cast <- type
qtype:{exec c!t from meta x}

\d .

// websocket communications

WS:0Ni

$[.z.K<3.3;
  [.z.pc:{[w]if[w=WS;WS::0Ni]};
   .z.po:{WS::.z.w;.js.set()!()}];
  [.z.wc:{[w]if[w=WS;WS::0Ni]};
   .z.wo:{WS::.z.w;.js.set()!()}]];

.z.ws:{t:.z.z;.js.snd .js.exe .js.sym a:.j.k x;.js.log[t]a}

/ entry points

.js.node:{[d]$[0=count n:d`node;d;count[Z_]=r:Z_[`n_]?n;d;[`P set .tt.at[not Z_[`o_]r;P;G]n;.js.set d]]}
.js.sorts:{[d]`S set d[`cols]!d`sorts;i:.tt.tsort[Z,'Z_]S;Z@:i;Z_@:i;.js.ret d}
.js.groups:{[d]`H`G set d`visible`groups;`P set .tt.paths[P]G;.js.set d}
.js.get:{[d]`R set`start`end!"j"$d`start`end;.js.ret d}

/ utilities

.js.log:{0N!(.js.elt x;y);}
.js.snd:{neg[WS].j.j x}
.js.elt:{`time$"z"$.z.z-x}
.js.sym:{$[(t:abs type x)in 0 99h;.z.s each x;10=t;`$x;x]}
.js.exe:{.js[x`fn]x}
.js.upd:{if[not null WS;t:.z.z;.js.snd .js.set()!();.js.log[t]`upd]}
.js.set:{`Z`Z_ set'.tt.cons[T;P;A;S;G]H;.js.ret x}
.js.sub:{[z]flip each(1#z;.tt.rows[R]1_z)}
.js.obj:{`Z`Z_`G`G_`H`H_`Q`S`R`N!(.js.sub Z;.js.sub Z_;G;where["S"=q]except G;H;cols[T]except G,H;q:.tt.qtype T;`cols`sorts!(key S;get S);R;count Z)}
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
