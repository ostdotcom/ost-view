"use strict";

const moment = require('moment');

const GraphTimeUtilsKlass = function(latestBlockTimestamp, graphScale, blockStartTimestamp){
  const oThis = this;

  // Current timestamp should be in seconds.
  oThis.currentTimestamp = latestBlockTimestamp;
  oThis.graphScale = graphScale;
  oThis.startTimestamp = null;
  oThis.lastTimestamp = null;
  oThis.blockStartTimestamp = blockStartTimestamp;

  oThis.methodMap = {
    'Week':{
        quantum: 24*60*60,
        getStartTime: function(currentTimestamp){
          var timeStamp = moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
          return (timeStamp - 7*this.quantum);
        },
        getNextTime: function(currentTimestamp){
          return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
        }
      },
    'Month':{
      quantum: 24*60*60,
      getStartTime: function(currentTimestamp){
        var timeStamp = moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
        return (timeStamp - 30*this.quantum);
      },
      getNextTime: function(currentTimestamp){
        return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
      }
    },
    'Hour':{
      quantum: 5*60,
      getStartTime: function(currentTimestamp){
        return ((currentTimestamp + this.quantum) - (currentTimestamp % this.quantum)) - 12*this.quantum  ;
      },
      getNextTime: function(currentTimestamp){
        return currentTimestamp + this.quantum;
      }
    },
    'Day':{
      quantum: 60*60,
      getStartTime: function(currentTimestamp){
        var timeStamp = moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('hour').unix();
        return (timeStamp - 24*this.quantum);
      },
      getNextTime: function(currentTimestamp){
        return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('hour').unix();
      }
    },
    'Year':{
      getStartTime: function(currentTimestamp){
        var currdate = new Date(currentTimestamp*1000)
          , lastYearNextMonthStart = moment(new Date(currdate.getFullYear()-1, currdate.getMonth()+1, 1).getTime()).utc().startOf('month').unix();

        return lastYearNextMonthStart;
      },
      getNextTime: function(currentTimestamp){
        var dayMilliSeconds = 24*60*60*1000
          , timeinMilli = currentTimestamp*1000;

        var date = new Date(timeinMilli);
        var days = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
        return moment(timeinMilli + (5+days)*dayMilliSeconds).utc().startOf('month').unix();
      }
    },
    'All':{
      getStartTime: function(currentTimestamp){
         var monthStartTime = moment(currentTimestamp*1000).utc().startOf('month').unix();

        return monthStartTime;
      },
      getNextTime: function(currentTimestamp){
        var dayMilliSeconds = 24*60*60*1000
          , timeinMilli = currentTimestamp*1000;

        var date = new Date(timeinMilli);
        var days = new Date(date.getFullYear(), date.getMonth()+1, 0).getDate();
        return moment(timeinMilli + (5+days)*dayMilliSeconds).utc().startOf('month').unix();
      }
    }
  }
};

GraphTimeUtilsKlass.prototype = {

  setGraphStartTime: function(){
    const oThis = this;

    var currentTime = oThis.currentTimestamp;
    if(oThis.graphScale === 'All'){
      currentTime = oThis.blockStartTimestamp;
    }
    oThis.startTimestamp = oThis.methodMap[oThis.graphScale].getStartTime(currentTime);
    oThis.lastTimestamp = oThis.startTimestamp;
    return oThis.startTimestamp;
  },

  getNextTimestamp: function(){
    const oThis = this;

    oThis.lastTimestamp = oThis.methodMap[oThis.graphScale].getNextTime(oThis.lastTimestamp);
    return oThis.lastTimestamp;
  }


};


module.exports = GraphTimeUtilsKlass;