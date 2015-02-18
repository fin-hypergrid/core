/// copyright stevan apter 2004-2015

\e 1
\p 12345
\P 14
\c 25 150
\t 2000

// connect to treetable server

V:0Ni
.z.ts:{if[null V;`V set@[hopen;`::12346;V]]}

// websocket communications

W:0Ni

$[.z.K<3.3;
  [.z.pc:{[w]$[w=W;`W set 0Ni;w=V;`V set 0Ni]};
   .z.po:{`W set .z.w;neg[V](1#`fn)!1#`set}];
  [.z.pc:{[w]if[w=V;`V set 0Ni]};
   .z.wc:{[w]if[w=W;`W set 0Ni]};
   .z.wo:{`W set .z.w;neg[V](1#`fn)!1#`set}]];

.z.ws:{.js.rcv .js.sym .j.k x}

/ utilities

.js.sym:{$[(t:abs type x)in 0 99h;.z.s each x;10=t;`$x;x]}
.js.sub:{flip each(1#x;.js.row[1_x]. R`start`end)}
.js.row:{$[y>=count x;0#x;((1+z-y)&count r)#r:y _ x]}
.js.obj:{`Z`G`H`F`I`Q`S`R`N!(.js.sub Z;G;H;F;I;Q;`cols`sorts!(key S;get S);R;N)}
.js.ret:{x,.js.obj[]}
.js.get:{`R set`start`end!"j"$x`start`end;.js.ret x}
.js.ini:{key[x]set'get x;.js.jsn .js.obj[]}
.js.exe:{r::R;key[x]set'get x;R::r;.js.jsn .js.ret x}
.js.rcv:{$[`get=x`fn;.js.jsn .js.get@;.js.ksn]x}
.js.jsn:{if[not null W;neg[W].j.j x]}
.js.ksn:{if[not null V;neg[V]x]}