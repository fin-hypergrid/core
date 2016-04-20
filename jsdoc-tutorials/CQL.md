The **CQL** grammar came from the legacy system in use at Barclays where they enter syntax into _column filter cells._ As in Hypergrid, each column's filter cell is between the column header and the data rows.

The original (grammar)[https://en.wikipedia.org/wiki/Wirth_syntax_notation] was simply:

> _expression_ ::= [ _op-symbol_ ] _operand_

> _op-synmbol_ ::= `=` | `<>` | `<` | `>` | `<=` | `>=`

> _operand_ ::= _column-name_ | _random-text_

We expanded this grammar as follows:

> _expression_ ::= _simple-expression_ { _logic-op_ _simple-expression_ }

> _simple-expression_ ::= [ _operator_ ] _operand_

> _operator_ ::= _op-symbol_ | _op-phrase_

> _op-symbol_ ::= `=` | `<>` | `<` | `>` | `<=` | `>=`

> _op-phrase_ ::= [ `NOT` _white-space_ ] _op-word_ _white-space_

> _op-word_ ::= `BEGINS` | `ENDS` | `CONTAINS` | `LIKE` | `IN`

> _operand_ ::= _column-name_ | _column alias_ | _random-text_

> _logic-op_ ::=  _white-space_ ( `AND` | `OR` | `NOR` ) _white-space_

Notes:
1. The default _op-symbol_ is "equals" when no operator is given.
2. Order of operations in undefined.
3. In particular, there is no precedence for logical operators and to resolve any ambiguity as to which binds more tightly, all such operators in an expression _must be the same._ CQL does not currently support subexpressions.
4. Words are shown in the grammar above in upper case. However, they may be any mixture of upper and lower case.
5. _white-space_ is optional if following or preceding a non-alpha character, specifically, an _op-symbol_).

The original grammar was deterministic (unambiguous), consisting entirely of a single operand (after the optional operator, that is). The one exception is when that operand is an exact (case-insensitive) match for the name (or alias) of a column, it would indirect to that named column's value. Thus, there is no way to use a column name as a literal.

The extended grammar is definitely non-deterministic because, in addition to the above, the words `and`, `or`, and `nor` also cannot be part of a literal. In a future release, we plan to allow optional paired quotation marks or parentheses to solve this problem:

> _quoted-operand_ ::= ( `'` | `"` | `(` ) _operand_ ( `'` | `"` | `)` )

