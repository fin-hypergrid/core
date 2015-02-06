\l d.q
\t 1000

\d .t

add:{.z.z+x*1%86400}
S:()
T:0#0Nz
A:{[t;s]@[`.t;`T`S;{(x#y),(enlist z),x _ y}[1+T bin t+1%86400];(t;s)];}
.z.ts:{while[not .z.z<first .t.T,.z.z+40000;.t.E:first .t.S;@[`.t;`T`S;1 _];.t.z::.z.z;.t.Z::.z.Z;value .t.E]}

\d .

upd:{update price:price+-.5+count[T]?1.,quantity:quantity+-5+count[T]?10 from`T;.js.upd[];.t.A[.t.add 5](.z.s;::);}
upd[]

1
