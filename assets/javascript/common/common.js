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

// BigNumber formatter wrapper
function bigNumberToFormat(number_string){

  if (number_string === undefined){
    return '';
  }


  if ((typeof number_string !== 'string') && (typeof number_string !== BigNumber)){
    number_string = number_string.toString();
  }

  var finalBigNumber;
  if (typeof number_string !== BigNumber){
    var format = {
      decimalSeparator: '.',
      groupSeparator: ',',
      groupSize: 3,
      secondaryGroupSize: 0,
      fractionGroupSeparator: ' ',
      fractionGroupSize: 0
    };
    BigNumber.config({ FORMAT: format });
    finalBigNumber = new BigNumber(number_string)
  }else{
    finalBigNumber = number_string;
  }

  var dp = 5;


  return finalBigNumber.toFormat(dp).toString();
}