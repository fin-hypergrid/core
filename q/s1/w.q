/// copyright stevan apter 2004-2015

// websocket communications

W:0Ni

$[.z.K<3.3;
  [.z.pc:{[w]if[w=W;W::0Ni]};
   .z.po:{`W set .z.w;.js.set()!()}];
  [.z.wc:{[w]if[w=W;W::0Ni]};
   .z.wo:{`W set .z.w;.js.set()!()}]];

.z.ws:{t:.z.z;.js.snd .js.exe .js.sym a:.j.k x;.js.log[t]a}

/ entry points

.js.node:{[d]$[0=count n:d`node;d;count[Z]=r:Z[`n_]?n;d;[`P set .tt.at[not Z[`o_]r;P;G]n;.js.set d]]}
.js.sorts:{[d]`S set d[`cols]!d`sorts;i:.tt.tsort[Z]S;Z@:i;Z_@:i;.js.ret d}
.js.groups:{[d]`F`G set'.js.sym d`visible`groups;`P set .tt.paths[P]G;.js.set d}
.js.get:{[d]`R set`start`end!"j"$d`start`end;.js.ret d}

/ logging

.js.log:{0N!(.js.elt x;y);}
.js.snd:{neg[W].j.j x}
.js.elt:{`time$"z"$.z.z-x}

/ utilities

.js.sym:{$[(t:abs type x)in 0 99h;.z.s each x;10=t;`$x;x]}
.js.exe:{.js[x`fn]x}
.js.set:{`Z set .tt.cons[T;P;A;S;G]F;.js.ret x}
.js.sub:{flip each(1#x;.js.row[1_x]. R`start`end)}
.js.row:{$[y>=count x;0#x;((1+z-y)&count r)#r:y _ x]}
.js.obj:{`Z`G`H`F`I`Q`S`R`N!(.js.sub Z;G;H;F;I;Q;`cols`sorts!(key S;get S);R;N)}
.js.ret:{x,.js.obj[]}
.js.upd:{if[not null W;t:.z.z;.js.snd .js.set()!();.js.log[t]`upd]}
.js.ups:{if[not null W;t:.z.z;`Z set 0!(`n_ xkey Z)upsert`n_ xkey .tt.cons[T;P;A;S;G]x inter cols Z;.js.snd .js.ret()!();.js.log[t]`ups]}