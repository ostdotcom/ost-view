/**
 * Created by Aniket on 16/02/18.
 */

var cron = require('node-cron');


var task = cron.schedule('* * * * *', function() {
  console.log('running a task every minute');
  'echo \'hello testing\' >> /Users/Aniket/STFoundation/openst-explorer/executables/hello.log"';
  "$node /Users/Aniket/STFoundation/openst-explorer/executables/block_fetcher_cron.js -c 2000  >> /Users/Aniket/STFoundation/openst-explorer/executables/block_fetcher_cron.log"


  //var shell = require('child_helper.js');
  //
  //var commandList = [
  //  "node /Users/Aniket/STFoundation/openst-explorer/executables/block_fetcher_cron.js -c 2000  >> /Users/Aniket/STFoundation/openst-explorer/executables/block_fetcher_cron.log"
  //]
  //
  //shell.series(commandList , function(err){
  //  //    console.log('executed many commands in a row');
  //  console.log('done')
  //});
});

task.start();