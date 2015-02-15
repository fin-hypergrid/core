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

.z.ws:{if[not null V;neg[V].j.k x]}
.z.ps:{if[not null W;neg[W].j.j x]}
