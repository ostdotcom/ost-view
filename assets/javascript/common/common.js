// Namespace
var ns = window.ns || function ns(ns_string) {
    var parts = ns_string.split('.'),
      parent = this,
      pl, i;

    pl = parts.length;
    for (i = 0; i < pl; i++) {
      //create a property if it doesn't exist
      if (typeof parent[parts[i]] == 'undefined') {
        parent[parts[i]] = {};
      }

      parent = parent[parts[i]];
    }

    return parent;
  };

// Handlebar compile for front-end
if(Handlebars){
  Handlebars.compile_fe = function(str){
    return Handlebars.compile(str.replace(/\[\[/g, '{{').replace(/\]\]/g, '}}'));
  }
}

function convertToBigNumber(number) {
  return (number instanceof BigNumber) ? number : new BigNumber(number);
}

function bigNumberFormatter(bigNum){
  var format = {
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0
  };
  var dp = 5;
  BigNumber.config({ FORMAT: format });
  return bigNum.toFormat(dp).toString(10);
}