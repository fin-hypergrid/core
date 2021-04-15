var fs = require('fs');

fs.copyFile('src/sample/index.html', 'dist/src/sample/index.html', err => {
    if(err) {
        console.error('Unable to copy sample index.html');
        throw err;
    }
    console.log('Copied src/sample/index.html to dist');
});
