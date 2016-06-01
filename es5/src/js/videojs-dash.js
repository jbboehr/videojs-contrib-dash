'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _window = require('global/window');

var _window2 = _interopRequireDefault(_window);

var _video = require('video.js');

var _video2 = _interopRequireDefault(_video);

var _dashjs = require('dashjs');

var _dashjs2 = _interopRequireDefault(_dashjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isArray = function isArray(a) {
  return Object.prototype.toString.call(a) === '[object Array]';
};

/**
 * videojs-contrib-dash
 *
 * Use Dash.js to playback DASH content inside of Video.js via a SourceHandler
 */

var Html5DashJS = function () {
  function Html5DashJS(source, tech) {
    _classCallCheck(this, Html5DashJS);

    var options = tech.options_;
    var player = (0, _video2.default)(options.playerId);

    this.tech_ = tech;
    this.el_ = tech.el();
    this.elParent_ = this.el_.parentNode;

    // Do nothing if the src is falsey
    if (!source.src) {
      return;
    }

    // While the manifest is loading and Dash.js has not finished initializing
    // we must defer events and functions calls with isReady_ and then `triggerReady`
    // again later once everything is setup
    tech.isReady_ = false;

    if (Html5DashJS.updateSourceData) {
      source = Html5DashJS.updateSourceData(source);
    }

    var manifestSource = source.src;
    this.keySystemOptions_ = Html5DashJS.buildDashJSProtData(source.keySystemOptions);

    // Save the context after the first initialization for subsequent instances
    Html5DashJS.context_ = Html5DashJS.context_ || {};

    // reuse MediaPlayer if it already exists
    if (!this.mediaPlayer_) {
      this.mediaPlayer_ = _dashjs2.default.MediaPlayer(Html5DashJS.context_).create();
    }

    // Log MedaPlayer messages through video.js
    if (Html5DashJS.useVideoJSDebug) {
      _video2.default.log.warn('useVideoJSDebug has been deprecated.' + ' Please switch to using beforeInitialize.');
      Html5DashJS.useVideoJSDebug(this.mediaPlayer_);
    }

    if (Html5DashJS.beforeInitialize) {
      Html5DashJS.beforeInitialize(player, this.mediaPlayer_);
    }

    // Must run controller before these two lines or else there is no
    // element to bind to.
    this.mediaPlayer_.initialize();
    this.mediaPlayer_.attachView(this.el_);

    // Dash.js autoplays by default, video.js will handle autoplay
    this.mediaPlayer_.setAutoPlay(false);

    // Attach the source with any protection data
    this.mediaPlayer_.setProtectionData(this.keySystemOptions_);
    this.mediaPlayer_.attachSource(manifestSource);

    this.tech_.triggerReady();
  }

  /*
   * Iterate over the `keySystemOptions` array and convert each object into
   * the type of object Dash.js expects in the `protData` argument.
   *
   * Also rename 'licenseUrl' property in the options to an 'serverURL' property
   */


  _createClass(Html5DashJS, [{
    key: 'dispose',
    value: function dispose() {
      if (this.mediaPlayer_) {
        this.mediaPlayer_.reset();
      }
    }
  }], [{
    key: 'buildDashJSProtData',
    value: function buildDashJSProtData(keySystemOptions) {
      var output = {};

      if (!keySystemOptions || !isArray(keySystemOptions)) {
        return output;
      }

      for (var i = 0; i < keySystemOptions.length; i++) {
        var keySystem = keySystemOptions[i];
        var options = _video2.default.mergeOptions({}, keySystem.options);

        if (options.licenseUrl) {
          options.serverURL = options.licenseUrl;
          delete options.licenseUrl;
        }

        output[keySystem.name] = options;
      }

      return output;
    }
  }]);

  return Html5DashJS;
}();

_video2.default.DashSourceHandler = function () {
  return {
    canHandleSource: function canHandleSource(source) {
      var dashExtRE = /\.mpd/i;

      if (_video2.default.DashSourceHandler.canPlayType(source.type)) {
        return 'probably';
      } else if (dashExtRE.test(source.src)) {
        return 'maybe';
      } else {
        return '';
      }
    },

    handleSource: function handleSource(source, tech) {
      return new Html5DashJS(source, tech);
    },

    canPlayType: function canPlayType(type) {
      return _video2.default.DashSourceHandler.canPlayType(type);
    }
  };
};

_video2.default.DashSourceHandler.canPlayType = function (type) {
  var dashTypeRE = /^application\/dash\+xml/i;
  if (dashTypeRE.test(type)) {
    return 'probably';
  }

  return '';
};

// Only add the SourceHandler if the browser supports MediaSourceExtensions
if (!!_window2.default.MediaSource) {
  _video2.default.getComponent('Html5').registerSourceHandler(_video2.default.DashSourceHandler(), 0);
}

_video2.default.Html5DashJS = Html5DashJS;
exports.default = Html5DashJS;
