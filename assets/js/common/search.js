(function(window, $) {
  var btx = ns('btx');

  var oThis = (btx.search = {
    config: {},
    minLength: 1,
    searchTimeOut: null,
    inputDelay: 300,
    url: null,

    jEl: null,
    jWrapper: null,

    jLoaderTemplate: null,
    jErrorTemplate: null,

    jTokenHolderTemplate: null,
    jAddressTemplate: null,
    jTransactionTemplate: null,
    jBlockTemplate: null,
    jTokenTemplate: null,

    enterResult: null,

    templateHash: {},

    init: function(config) {
      var oThis = this;
      $.extend(oThis.config, config);
      oThis.url = oThis.config.url || '/mainnet/search';
      oThis.bindButtons();
    },

    bindButtons: function() {
      var oThis = this,
        jEls;

      oThis.initTemplates();

      $('#btxSearch-sm').on('submit', function(e) {
        e.preventDefault();
        return false;
      });

      oThis.jEl.on('keyup', function(e) {
        if (e.which == 13) {
          oThis.tryFirstResult();
        } else {
          oThis.enterResult = null;
          oThis.onSearch();
        }
      });

      $('body').on('click', function() {
        oThis.jWrapper.hide();
      });

      $('.btxSearch-wrapper, .search-result-wrapper').on('click focusin', function(e) {
        oThis.jWrapper.show();
        e.preventDefault();
        e.stopPropagation();
        return false;
      });
    },

    initTemplates: function() {
      var oThis = this;

      oThis.jEl = $('#search');

      oThis.jWrapper = $('#search-result-wrapper');

      oThis.jLoaderTemplate = Handlebars.compile_fe($('#search-loader-template').html());
      oThis.jErrorTemplate = Handlebars.compile_fe($('#search-error-template').html());

      oThis.jAddressTemplate = Handlebars.compile_fe($('#address-template').html());
      oThis.jTransactionTemplate = Handlebars.compile_fe($('#transaction-template').html());
      oThis.jBlockTemplate = Handlebars.compile_fe($('#block-template').html());
      oThis.jTokenTemplate = Handlebars.compile_fe($('#token-template').html());
      oThis.jTokenHolderTemplate = Handlebars.compile_fe($('#tokenHolder-template').html());

      oThis.jNoResultTemplate = Handlebars.compile_fe($('#search-no-result-template').html());

      oThis.templateHash = {
        tokenHolder: oThis.jTokenHolderTemplate,
        address: oThis.jAddressTemplate,
        transaction: oThis.jTransactionTemplate,
        block: oThis.jBlockTemplate,
        token: oThis.jTokenTemplate,
        noResultFound: oThis.jNoResultTemplate
      };
    },

    onSearch: function() {
      var oThis = this;

      clearTimeout(oThis.searchTimeOut);

      oThis.searchTimeOut = setTimeout(function() {
        var jVal = oThis.jEl.val(),
          jTrimVal = jVal && jVal.trim();
        if (!jTrimVal || jTrimVal.length < oThis.minLength) return;
        if (oThis.preVal && oThis.preVal == jTrimVal) return;
        clearTimeout(oThis.searchTimeOut);
        oThis.appendLoader();
        oThis.preVal = jTrimVal;

        $.ajax({
          url: oThis.url,
          data: { q: jTrimVal },
          type: 'GET',
          dataType: 'json',
          contentType: 'application/json',
          success: function(res) {
            if (res && res.success) {
              oThis.onSearchSuccess(res);
            } else {
              oThis.onSearchError(res);
            }
          },
          error: function(error) {
            oThis.onSearchError(error);
          },
          complete: function() {
            clearTimeout(oThis.searchTimeOut);
          }
        });
      }, oThis.inputDelay);
    },

    tryFirstResult: function() {
      var oThis = this;

      if (oThis.enterResult) window.location = oThis.enterResult;
    },

    appendLoader: function() {
      var oThis = this;
      oThis.jWrapper.html(oThis.jLoaderTemplate());
    },

    onSearchSuccess: function(res) {
      var oThis = this,
        data = res && res.data,
        searchResults = data && data['searchResults'],
        len = searchResults && searchResults.length,
        searchResult,
        cnt,
        entityType,
        jTemplate,
        jMarkup;

      oThis.jWrapper.html('');

      if (!len) {
        entityType = 'noResultFound';
        jTemplate = oThis.templateHash[entityType];
        jMarkup = jTemplate(data);
        oThis.jWrapper.append(jMarkup);
        return;
      }

      for (cnt = 0; cnt < len; cnt++) {
        searchResult = searchResults[cnt];
        entityType = searchResult['kind'];
        jTemplate = oThis.templateHash[entityType];
        jMarkup = jTemplate(searchResult['payload']);
        if (cnt === 0 && $(jMarkup).find('a')[0]) {
          oThis.enterResult = $(jMarkup).find('a')[0].href;
        }
        oThis.jWrapper.append(jMarkup);
      }
    },

    onSearchError: function(error) {
      var oThis = this;
      oThis.jWrapper.html(oThis.jErrorTemplate(error));
    }
  });
})(window, jQuery);
