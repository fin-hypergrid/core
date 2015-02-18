T must be a keytable containing at least two columns in addition to the keys, f and g.

At least one of f and g must be a groupable type (see below).

The behavior of the treetable is controlled by a set of global variables in the root:

/ the underlying data table, e.g.
T:([k:til 10]f:10?1.;g:10?`a`b`c)

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

/ invisible (can be rolled up)
I::cols[T]except G,F

/ rollup functions
A:()!()

/ instruction state
P:([n:enlist(0#`)!0#`]v:enlist 1b)

/ rows -> gui
R:`start`end!0 100

/ sorts (a,d)
S:()!()

Example settings (used in the demo):

/ group on these columns
G:`sector`trader`strategy

/ roll up these columns
F:`holdingId`symbol`price`quantity`date`time

/ override default rollup with avg 
A[`price]:(avg;`price)


