#! /bin/bash
hulk ./src/views/*.mustache   > ./src/js/views.js
minify ./src/js/GrapheneDataGrid.js ./src/js/utils.js ./src/js/collection.js ./src/js/view.js ./src/js/views.js > ./bin/js/GrapheneDataGrid.min.js
cat ./src/js/GrapheneDataGrid.js ./src/js/utils.js ./src/js/collection.js ./src/js/view.js ./src/js/views.js > ./bin/js/GrapheneDataGrid.full.js
cp ./bin/js/GrapheneDataGrid.full.js ./docs/assets/js/