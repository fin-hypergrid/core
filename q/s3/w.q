/// copyright stevan apter 2004-2015

W:0Ni

.z.po:{[w]`W set w;neg[W](`.js.ini;.js.obj[]);}
.z.pc:{[w]`W set 0Ni}
.z.ps:{neg[W](`.js.exe;.js.exe x)}

/ entry points

.js.node:{[d]$[0=count n:d`node;d;count[Z]=r:Z[`n_]?n;d;[`P set .tt.at[not Z[`o_]r;P;G]n;.js.set d]]}
.js.sorts:{[d]`S set d[`cols]!d`sorts;i:.tt.tsort[Z]S;Z@:i;Z_@:i;.js.ret d}
.js.groups:{[d]`F`G set'd`visible`groups;`P set .tt.paths[P]G;.js.set d}
.js.get:{[d]`R set`start`end!"j"$d`start`end;.js.ret d}

/ utilities

.js.exe:{.js[x`fn]x}
.js.set:{`Z set .tt.cons[T;P;A;S;G]F;.js.ret x}
.js.obj:{{x!get each x}`Z`G`H`F`I`Q`S`R`N}
.js.ret:{x,.js.obj[]}
.js.upd:{if[not null W;neg[W](`.js.exe;.js.set()!())]}
.js.ups:{if[not null W;`Z set 0!(`n_ xkey Z)upsert`n_ xkey .tt.cons[T;P;A;S;G]x inter cols Z;neg[W](`.js.exe;.js.ret()!())]}
