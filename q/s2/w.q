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

.js.elt:{`time$"z"$.z.z-x}
.js.sym:{$[(t:abs type x)in 0 99h;.z.s each x;10=t;`$x;x]}
.js.exe:{.js[x`fn]x}
.js.set:{`Z set .tt.cons[T;P;A;S;G]F;.js.ret x}
.js.sub:{[f;z]flip each(1#z;.tt.rows[R]1_z:?[z;();0b;{x!x}h where f(h:cols z)like"*_"])}
.js.obj:{`Z`Z_`G`G_`F`F_`Q`S`R`N!(.js.sub[not]Z;.js.sub[::]Z;G;where["S"=q]except G;F;cols[T]except G,F;q:.tt.qtype T;`cols`sorts!(key S;get S);R;count Z)}
.js.ret:{x,.js.obj[]}
.js.upd:{if[not null W;neg[W].js.set()!()]}
.js.ups:{if[not null W;`Z set 0!(`n_ xkey Z)upsert`n_ xkey .tt.cons[T;P;A;S;G]x;neg[W].js.ret()!()]}
