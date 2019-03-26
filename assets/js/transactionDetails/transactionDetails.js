(function(window, $) {
  var btx = ns('btx');

  var oThis = (btx.transactionDetails = {
    nextPagePayload: null,

    fetchResultsUrl: null,

    jParent: null,
    jShowMore: null,
    jLoaderTemplate: null,
    jRowWrapper: null,
    jRowTemplate: null,
    jLoaderMarkup: null,

    economyMap: null,

    init: function(data) {
      var oThis = this;
      oThis.initData(data);
    },

    hasNextPage: function(nextPagePayload) {
      if (nextPagePayload && Object.keys(nextPagePayload).length > 0) {
        return true;
      }
      return false;
    },

    initData: function(data) {
      var oThis = this;

      if (typeof data == 'string') {
        data = JSON.parse(data);
      }
      for (var key in data) {
        if (data[key] && typeof data[key] == 'string') {
          data[key] = JSON.parse(data[key]);
        }
      }

      oThis.fetchResultsUrl = oThis.getFetchResultsUrl(data.transaction, data.meta);
      oThis.jLoaderMarkup = $('#load-more-loader').html();
      oThis.jRowTemplate = Handlebars.compile_fe($('#transfer-table').text());
      oThis.jParent = $('.transfer-table-wrapper');
      var totalTransfers = data && data.transaction && data.transaction.totalTokenTransfers;
      totalTransfers = totalTransfers && parseInt(totalTransfers);
      if (totalTransfers > 0) {
        oThis.getTransfers();
      }
    },

    getFetchResultsUrl: function(transaction, meta) {
      if (!transaction) return null;
      var baseUrlPrefix = (meta && meta['baseUrlPrefix']) || 'mainnet';
      return (
        '/' +
        baseUrlPrefix +
        '/transaction/tx-' +
        transaction.chainId +
        '-' +
        transaction.transactionHash +
        '/token-transfers'
      );
    },

    bindEvents: function() {
      var oThis = this;
      $('.show-more-link')
        .off('click')
        .on('click', function() {
          $(this)
            .parent()
            .remove();
          oThis.getTransfers();
        });
    },

    getTransfers: function() {
      var oThis = this,
        data = oThis.getNextPayload();

      if (!oThis.fetchResultsUrl) return;

      oThis.jParent.append(oThis.jLoaderMarkup);

      $.ajax({
        type: 'GET',
        url: oThis.fetchResultsUrl,
        data: data,
        dataType: 'json',
        contentType: 'application/json',
        success: function(response) {
          if (response.success) {
            oThis.updateTable(response);
          } else {
            oThis.showDataLoadError(response);
          }
        },
        error: function(error) {
          oThis.showDataLoadError(error);
        }
      });
    },

    updateTable: function(response) {
      var oThis = this,
        data = response && response.data,
        meta = data && data.meta,
        nextPagePayload = meta && meta.nextPagePayload,
        hasNextPage = oThis.hasNextPage(nextPagePayload),
        jMarkup;

      data = oThis.getTokenForTransfers(data);
      data['hasNextPage'] = hasNextPage;
      jMarkup = oThis.jRowTemplate(data);
      oThis.jParent.find('.image-loader-wrapper').remove();
      oThis.jParent.append(jMarkup);

      if (hasNextPage) {
        oThis.setNextPayload(nextPagePayload);
        oThis.bindEvents();
      }
    },

    getTokenForTransfers: function(data) {
      var economyMap = data['economyMap'] || {},
        tokenTransfers = data['tokenTransfers'] || [],
        len = tokenTransfers.length,
        cnt,
        currTransfer,
        tokenForTransfer,
        chainId,
        contractAddress,
        keyIndex;
      if (!len) return data;
      oThis.economyMap = $.extend(true, oThis.economyMap, economyMap);
      for (cnt = 0; cnt < len; cnt++) {
        currTransfer = tokenTransfers[cnt];
        chainId = currTransfer['chainId'];
        contractAddress = currTransfer['contractAddress'];
        keyIndex = chainId + '-' + contractAddress;
        tokenForTransfer = oThis.economyMap[keyIndex];
        currTransfer['token'] = tokenForTransfer;
      }
      return data;
    },

    setNextPayload: function(payload) {
      this.nextPagePayload = payload;
    },

    getNextPayload: function() {
      return this.nextPagePayload || null;
    },

    showDataLoadError: function(error) {
      //TODO
    }
  });
})(window, jQuery);
