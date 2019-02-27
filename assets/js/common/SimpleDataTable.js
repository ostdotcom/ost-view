(function(window, $) {
  var logMe = false;

  var btx = ns('btx');

  var SimpleDataTable = (btx.SimpleDataTable = function(config) {
    var oThis = this;

    $.extend(oThis, config);

    if (!oThis.jParent) {
      console.log('jParent is mandetory config for SimpleDataTable');
      throw 'jParent is mandetory config for SimpleDataTable';
    }

    oThis.jRowTemplateHtml = oThis.jRowTemplateHtml || oThis.jParent.find('[data-row-template]');
    oThis.rowTemplate = oThis.rowTemplate || Handlebars.compile_fe(oThis.jRowTemplateHtml.html());
    oThis.jRowWrapper = oThis.jRowWrapper || oThis.jParent.find('[data-row-wrapper]');

    oThis.fetchResultsUrl = oThis.fetchResultsUrl || oThis.jParent.data('url') || null;

    oThis.jNextPreviousTemlate = oThis.jNextPreviousTemlate || $('#next-previous-template');
    oThis.nextPreviousTemlate = oThis.nextPreviousTemlate || Handlebars.compile_fe(oThis.jNextPreviousTemlate.html());

    oThis.sPreBnt = oThis.sPreBnt || '.j-previous-btn';
    oThis.sNextBnt = oThis.sNextBnt || '.j-next-btn';

    oThis.jDataLoader = oThis.jDataLoader || oThis.createLoadingWrap(oThis.jRowWrapper);

    oThis.jParent.append(oThis.nextPreviousTemlate());

    oThis.previousPayloadStack = oThis.previousPayloadStack || [];

    oThis.loadTableData();

    oThis.bindEvents();
  });

  SimpleDataTable.prototype = {
    constructor: SimpleDataTable,

    jParent: null,
    jRowTemplateHtml: null,
    rowTemplate: null,

    sPreBnt: null,
    sNextBnt: null,
    jPreBnt: null,
    jNextBnt: null,

    previousPayloadStack: null,
    nextPagePayload: null,
    currentPayload: null,
    isLoadingData: false,

    pageResultStartIndex: 0,
    pageSize: 10,

    resultFetcherCallback: null,

    events: {
      responseProcessed: 'responseProcessed'
    },

    getRowTemplate: function() {
      var oThis = this;
      return oThis.rowTemplate;
    },

    createLoadingWrap: function(jParent) {
      var oThis = this,
        jWrap = $('<div class="w-100 jTableLoader" ></div>');
      var jContent = $(
        '' +
          '<div class="container simple-data-table-loader mb-4">' +
          '<div class="text-center">' +
          '<img src="https://dxwfxs8b4lg24.cloudfront.net/ost-kit/images/processed-loader-1.gif" height="50" width="50"/>' +
          '</div>' +
          '</div>'
      );
      jWrap.append(jContent);
      oThis.jParent.append(jWrap);
      return jWrap;
    },

    loadTableData: function() {
      var oThis = this;
      oThis.fetchResults();
    },

    fetchResults: function() {
      var oThis = this;
      if (oThis.isLoadingData) {
        return;
      }
      oThis.jDataLoader.show();
      oThis.resultFetcher(function(response) {
        oThis.isLoadingData = false;
        oThis.processResponse(response);
        oThis.resultFetcherCallback && oThis.resultFetcherCallback(response);
      });
      oThis.isLoadingData = true;
    },

    fetchResultsUrl: null,
    resultFetcher: function(callback) {
      var oThis = this,
        data = oThis.params || {},
        pagePayload = oThis.getCurrentPayLoad();

      if (pagePayload) {
        data = $.extend(data, pagePayload);
      }

      $.get({
        url: oThis.fetchResultsUrl,
        data: data,
        dataType: 'json',
        contentType: 'application/json',
        success: function(response) {
          if (response.success) {
            callback(response);
          } else {
            oThis.showDataLoadError(response);
          }
        },
        error: function(error) {
          oThis.showDataLoadError(error);
        }
      });
    },

    createResultMarkup: function(result) {
      var oThis = this,
        rowTemplate = oThis.getRowTemplate(),
        rowMarkUp = rowTemplate(result),
        jResult = $(rowMarkUp);
      return jResult;
    },

    processResponse: function(response) {
      var oThis = this;

      if (response.success) {
        var data = response.data,
          newMeta = data.meta || {},
          nextPagePayload = newMeta.nextPagePayload || {},
          hasNextPage = false,
          hasPreviousPage = false,
          jPaginationMarkup,
          jResult;

        data['pageResultStartIndex'] = oThis.pageResultStartIndex;
        jResult = oThis.createResultMarkup(data);
        oThis.jRowWrapper.html(jResult);
        oThis.jDataLoader.hide();

        //Deal with meta

        if (Object.keys(nextPagePayload).length) {
          hasNextPage = true;
          oThis.setNextPayload(nextPagePayload);
        }

        hasPreviousPage = !!oThis.previousPayloadStack.length;

        oThis.updatePaginationMarkup(hasPreviousPage, hasNextPage);
      } else {
        oThis.showDataLoadError(response);
      }
    },

    pushPreviousPayload: function(payload) {
      var oThis = this;
      oThis.previousPayloadStack.push(payload);
    },

    popPreviousPayload: function() {
      var oThis = this,
        len = oThis.previousPayloadStack && oThis.previousPayloadStack.length,
        payload,
        index;
      if (len) {
        index = len - 1;
        payload = oThis.previousPayloadStack[index];
        oThis.previousPayloadStack.splice(index);
        return payload;
      }
    },

    setNextPayload: function(nextPagePayload) {
      var oThis = this;
      oThis.nextPagePayload = nextPagePayload;
    },

    setCurrentPayload: function(payload) {
      var oThis = this;
      oThis.currentPayload = payload;
    },

    getCurrentPayLoad: function() {
      var oThis = this;
      return oThis.currentPayload;
    },

    updatePaginationMarkup: function(hasPre, hasNext) {
      var oThis = this;
      hasPre ? oThis.jPreBtn.removeClass('disabled') : oThis.jPreBtn.addClass('disabled');
      hasNext ? oThis.jNextBnt.removeClass('disabled') : oThis.jNextBnt.addClass('disabled');
    },

    bindEvents: function() {
      var oThis = this;
      oThis.bindPreClick();
      oThis.bindNextClick();
    },

    bindNextClick: function() {
      var oThis = this,
        jEl = oThis.jParent.find(oThis.sNextBnt);
      if (!jEl || !jEl.length) return;
      oThis.jNextBnt = jEl;
      jEl.off('click').on('click', function() {
        if ($(this).hasClass('disabled')) return;
        oThis.disabledBtns();
        oThis.pushPreviousPayload(oThis.getCurrentPayLoad());
        oThis.setCurrentPayload(oThis.nextPagePayload);
        oThis.pageResultStartIndex += oThis.pageSize;
        oThis.loadTableData();
      });
    },

    bindPreClick: function() {
      var oThis = this,
        jEl = oThis.jParent.find(oThis.sPreBnt),
        currentPayload;
      if (!jEl || !jEl.length) return;
      oThis.jPreBtn = jEl;
      jEl.off('click').on('click', function() {
        if ($(this).hasClass('disabled')) return;
        oThis.disabledBtns();
        currentPayload = oThis.popPreviousPayload();
        oThis.setCurrentPayload(currentPayload);
        oThis.pageResultStartIndex -= oThis.pageSize;
        oThis.loadTableData();
      });
    },

    disabledBtns: function() {
      var oThis = this;
      oThis.jPreBtn.addClass('disabled');
      oThis.jNextBnt.addClass('disabled');
    },

    showDataLoadError: function(response) {
      var oThis = this;
      oThis.jDataLoader.remove();
      oThis.jRowWrapper.html('<h6 class="p-4 text-center" style="color: #438bad">Something went wrong!</h6>');
    },

    /** BEGIN :: Generic Methods that trigger events **/
    callTrigger: function(eventKey, data) {
      var oThis = this;

      var args = Array.prototype.slice.call(arguments);
      args.shift();
      $(oThis).trigger(oThis.events[eventKey], args);
    },

    applyTrigger: function(eventKey, argsAsArgumnets) {
      var oThis = this;

      var args = Array.prototype.slice.call(argsAsArgumnets);
      $(oThis).trigger(oThis.events[eventKey], args);
    }
  };
})(window, jQuery);
