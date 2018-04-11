"use strict";

const moment = require('moment');

const GraphTimeUtilsKlass = function(latestBlockTimestamp, timeFrame, blockStartTimestamp){
  const oThis = this;

  // Current timestamp should be in seconds.
  oThis.currentTimestamp = latestBlockTimestamp;
  oThis.timeFrame = timeFrame;
  oThis.startTimestamp = null;
  oThis.lastTimestamp = null;
  oThis.blockStartTimestamp = blockStartTimestamp;

  oThis.methodMap = {
    'week':{
        quantum: 24*60*60,
        getStartTime: function(currentTimestamp){
          var timeStamp = moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
          return (timeStamp - 7*this.quantum);
        },
        getNextTime: function(currentTimestamp){
          return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
        },
        getNextTimeFrame: function(currentTimestamp) {
          return moment(currentTimestamp*1000 + 7*this.quantum*1000).utc().startOf('day').unix();
        }
      },
    'month':{
      quantum: 24*60*60,
      getStartTime: function(currentTimestamp){
        var timeStamp = moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
        return (timeStamp - 30*this.quantum);
      },
      getNextTime: function(currentTimestamp){
        return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('day').unix();
      },
      getNextTimeFrame: function(currentTimestamp) {
        return oThis.methodMap['year'].getNextTime(currentTimestamp);
      }
    },
    'hour':{
      quantum: 5*60,
      getStartTime: function(currentTimestamp){
        return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('hour').unix();
      },
      getNextTime: function(currentTimestamp){
        return currentTimestamp + this.quantum;
      },
      getNextTimeFrame: function(currentTimestamp) {
        return oThis.methodMap['day'].getNextTime(currentTimestamp);
      }
    },
    'day':{
      quantum: 60*60,
      getStartTime: function(currentTimestamp){
        var timeStamp = moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('hour').unix();
        return (timeStamp - 24*this.quantum);
      },
      getNextTime: function(currentTimestamp){
        return moment(currentTimestamp*1000 + this.quantum*1000).utc().startOf('hour').unix();
      },
      getNextTimeFrame: function(currentTimestamp) {
        return oThis.methodMap['month'].getNextTime(currentTimestamp);
      }
    },
    'year':{
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
      },
      getNextTimeFrame: function(currentTimestamp) {
        return currentTimestamp;
      }
    },
    'all':{
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
      },
      getNextTimeFrame: function(currentTimestamp) {
        return currentTimestamp;
      }
    }
  }
};

GraphTimeUtilsKlass.prototype = {

  setGraphStartTime: function(){
    const oThis = this;

    var currentTime = oThis.currentTimestamp;
    if(oThis.blockStartTimestamp) {
      currentTime = oThis.blockStartTimestamp;
    }
    oThis.startTimestamp = oThis.methodMap[oThis.timeFrame].getStartTime(currentTime);
    oThis.lastTimestamp = oThis.startTimestamp;
    return oThis.startTimestamp;
  },

  getRoundOffTimestamp: function(timestamp) {
    const oThis = this;
    return oThis.methodMap[oThis.timeFrame].getStartTime(timestamp);
  },

  getNextTimeFrameTimestamp(timestamp) {
    const oThis = this;
    return oThis.methodMap[oThis.timeFrame].getNextTimeFrame(timestamp);
  },

  getNextTimestamp: function(){
    const oThis = this;

    oThis.lastTimestamp = oThis.methodMap[oThis.timeFrame].getNextTime(oThis.lastTimestamp);
    return oThis.lastTimestamp;
  }

};


module.exports = {
  newInstance: function(latestBlockTimestamp, graphScale, blockStartTimestamp) {
    return new GraphTimeUtilsKlass(latestBlockTimestamp, graphScale, blockStartTimestamp);
  }
};