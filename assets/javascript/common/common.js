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

moment.updateLocale('en', {
  relativeTime : {
    s  : 'few sec',
    ss : '%d sec',
    m:  "a min",
    mm: "%d mins",
  }
});

function toTimeAgo(timestamp) {
  var timeInMilli = timestamp * 1000
    , currentTimeInMilli = new Date().getTime()
    , timeInMilliDiff = currentTimeInMilli - timeInMilli
    , milliSecIn2Days = 86400000*2
  ;

  if (timeInMilliDiff < milliSecIn2Days){
    return  moment(timeInMilli).fromNow()

  }else{
    return moment(timeInMilli).format('Do MMM YYYY');
  }

}