
 _.mixin({
  score: function(base, abbr, offset) {

    offset = offset || 0; // TODO: I think this is unused... remove
    
    if(abbr.length === 0) return 0.9;
    if(abbr.length > base.length) return 0.0;
    
    for (var i = abbr.length; i > 0; i--) {
      var sub_abbr = abbr.substring(0,i);
      var index = base.indexOf(sub_abbr);
      
      if(index < 0) continue;
      if(index + abbr.length > base.length + offset) continue;
      
      var next_string = base.substring(index+sub_abbr.length);
      var next_abbr = null;
      
      if(i >= abbr.length) {
        next_abbr = '';
      } else {
        next_abbr = abbr.substring(i);
      }
      // Changed to fit new (jQuery) format (JSK)
      var remaining_score   = _.score(next_string, next_abbr,offset+index);
      
      if (remaining_score > 0) {
        var score = base.length-next_string.length;
        
        if(index !== 0) {     
          var c = base.charCodeAt(index-1);
          if(c==32 || c == 9) {
            for(var j=(index-2); j >= 0; j--) {
              c = base.charCodeAt(j);
              score -= ((c == 32 || c == 9) ? 1 : 0.15);
            }
          } else {
            score -= index;
          }
        }
        
        score += remaining_score * next_string.length;
        score /= base.length;
        return(score);
      }
    }
    // return(0.0);
      return( result );
  },

  csvToArray: function(csvString) {
    var trimQuotes = function (stringArray) {
      for (var i = 0; i < stringArray.length; i++) {
          // stringArray[i] = _.trim(stringArray[i], '"');
          if(stringArray[i][0] == '"' && stringArray[i][stringArray[i].length-1] == '"'){
            stringArray[i] = stringArray[i].substr(1,stringArray[i].length-2)
          }
          stringArray[i] = stringArray[i].split('""').join('"')
      }
      return stringArray;
    }
    var csvRowArray    = csvString.split(/\n/);
    var headerCellArray = trimQuotes(csvRowArray.shift().match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g));
    var objectArray     = [];
    
    while (csvRowArray.length) {
        var rowCellArray = trimQuotes(csvRowArray.shift().match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g));
        var rowObject    = _.zipObject(headerCellArray, rowCellArray);
        objectArray.push(rowObject);
    }
    return(objectArray);
  },
  csvify: function(data, columns, title){

    var csv = '"'+_.map(columns,'label').join('","')+'"\n';
    labels = _.map(columns,'name')
    var empty = _.zipObject(labels, _.map(labels, function() { return '';}))
    csv += _.map(data,function(d){
        return JSON.stringify(_.map(_.values(_.extend(empty,_.pick(d,labels))),function(item){
          if(typeof item == 'string'){
            return item.split('"').join('""');
          }else{return item}
        }))
        //return JSON.stringify(_.values(_.extend(empty,_.pick(d,labels))))
    },this)
    .join('\n') 
    .replace(/(^\[)|(\]$)/mg, '')
    // .split('\"').join("")
  
    var link = document.createElement("a");
    link.setAttribute("href", 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    link.setAttribute("download", (title||"GrapheneDataGrid")+".csv");
    document.body.appendChild(link); // Required for FF
    link.click();
    document.body.removeChild(link);
    return(true);
  }
});


var CSVParser = (function(){
    "use strict";
    function captureFields(fields) {
        /* jshint -W040 */
        if (this.options.ignoreEmpty === false || fields.some(function(field){ return field.length !== 0; })) {
            this.rows.push(fields);
        }
        /* jshint +W040 */
    }

    function Parser(data, options){
        var defaultOptions = { "fieldSeparator": ",", "strict": true, "ignoreEmpty": true};
        if (options === undefined) options = {};
        this.options = {};
        Object.keys(defaultOptions).forEach(function(key) {
            this.options[key] = options[key] === undefined ? defaultOptions[key] : options[key];
        }, this);
        this.rows = [];
        this.data = data;
    }
    Parser.prototype.toString = function toString() { return "[object CSVParser]"; };
    Parser.prototype.numberOfRows = function numberOfRows() { return this.rows.length; };
    Parser.prototype.parse = function parse(){
        // Regular expression for parsing CSV from [Kirtan](http://stackoverflow.com/users/83664/kirtan) on Stack Overflow
        // http://stackoverflow.com/a/1293163/34386
        var regexString = (
            // Delimiters.
            "(\\" + this.options.fieldSeparator + "|\\r?\\n|\\r|^)" +

            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

            // Standard fields.
            "([^\"\\" + this.options.fieldSeparator + "\\r\\n]*))");
            var objPattern = new RegExp(regexString, "gi");
            var doubleQuotePattern = new RegExp( "\"\"", "g" );

        var fields = [];
        var arrMatches = null;
        var strMatchedDelimiter, strMatchedValue;
        /* jshint -W084 */
        while (arrMatches = objPattern.exec( this.data )){
        /* jshint +W084 */
            strMatchedDelimiter = arrMatches[ 1 ];
            if (strMatchedDelimiter.length && (strMatchedDelimiter != this.options.fieldSeparator)){
                captureFields.apply(this, [fields]);
                fields = [];
            }

            if (arrMatches[ 2 ]){
                strMatchedValue = arrMatches[ 2 ].replace(doubleQuotePattern, "\"");
            } else {
                strMatchedValue = arrMatches[ 3 ];
            }
            fields.push( strMatchedValue );
        }
        captureFields.apply(this, [fields]);
        if (this.options.strict === true && !this.rows.every(function(row){ return (row.length === this.length); }, this.rows[0])) {
            throw new Error("Invalid CSV data. Strict mode requires all rows to have the same number of fields. You can override this by passing `strict: false` in the CSVParser options");
        }
    };
    return Parser;
})();