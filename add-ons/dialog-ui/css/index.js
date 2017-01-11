'use strict';

exports['list-dragon-addendum'] = [
'div.dragon-list, li.dragon-pop {',
'	font-family: Roboto, sans-serif;',
'	text-transform: capitalize; }',
'div.dragon-list {',
'	position: absolute;',
'	top: 4%;',
'	left: 4%;',
'	height: 92%;',
'	width: 20%; }',
'div.dragon-list:nth-child(2) { left: 28%; }',
'div.dragon-list:nth-child(3) { left: 52%; }',
'div.dragon-list:nth-child(4) { left: 76%; }',
'div.dragon-list > div, div.dragon-list > ul > li, li.dragon-pop { line-height: 46px; }',
'div.dragon-list > ul { top: 46px; }',
'div.dragon-list > ul > li:not(:last-child)::before, li.dragon-pop::before {',
'	content: \'\\2b24\';',
'	color: #b6b6b6;',
'	font-size: 30px;',
'	margin: 8px 14px 8px 8px; }',
'li.dragon-pop { opacity:.8; }'
].join('\n');
