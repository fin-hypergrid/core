/// copyright stevan apter 2004-2015

W:0Ni

.z.po:{[w]`W set w}
.z.pc:{[w]`W set 0Ni}
.z.ps:{neg[W].js.exe .js.sym x}

/ entry points

.js.node:{[d]$[0=count n:d`node;d;count[Z]=r:Z[`n_]?n;d;[`P set .tt.at[not Z[`o_]r;P;G]n;.js.set d]]}
.js.sorts:{[d]`S set d[`cols]!d`sorts;i:.tt.tsort[Z]S;Z@:i;Z_@:i;.js.ret d}
.js.groups:{[d]`F`G set'd`visible`groups;`P set .tt.paths[P]G;.js.set d}
.js.get:{[d]`R set`start`end!"j"$d`start`end;.js.ret d}

/ utilities

.js.sym:{$[(t:abs type x)in 0 99h;.z.s each x;10=t;`$x;x]}
.js.exe:{.js[x`fn]x}
.js.set:{`Z set .tt.cons[T;P;A;S;G]F;.js.ret x}
.js.sub:{flip each(1#x;.js.row[1_x]. R`start`end)}
.js.row:{$[y>=count x;0#x;((1+z-y)&count r)#r:y _ x]}
.js.obj:{`Z`G`H`F`I`Q`S`R`N!(.js.sub Z;G;H;F;I;Q;`cols`sorts!(key S;get S);R;N)}
.js.ret:{x,.js.obj[]}
.js.upd:{if[not null W;neg[W].js.set()!()]}
.js.ups:{if[not null W;`Z set 0!(`n_ xkey Z)upsert`n_ xkey .tt.cons[T;P;A;S;G]x inter cols Z;neg[W].js.ret()!()]}
