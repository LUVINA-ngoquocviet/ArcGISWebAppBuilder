define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "./Shuhaikuiki",
  "./TeijiShuka",
], function (
  declare,
  lang,
  array,
  html,
  BaseWidget,
  Shuhaikuiki,
  TeijiShuka,
) {
  return declare([BaseWidget], {
    name: "Kensaku",
    baseClass: "jimu-widget-search-selectbox",

    postCreate: function () {
      html.setAttr(this.domNode, "aria-label", this.nls._widgetLabel);

      if (this.closeable || !this.isOnScreen) {
        html.addClass(this.searchNode_timezone, "default-width-for-openAtStart");
      }
      this.listenWidgetIds.push("framework");

    },

    startup: function () {
      // this.inherited(arguments);
      this._initShuhaikuiki();
      this._initTeijiShuka();
    },

    _initShuhaikuiki: function() {
      this.Shuhaikuiki = new Shuhaikuiki({
        map: this.map,
        appConfig: this.appConfig,
        nls: this.nls,
      });
      this.Shuhaikuiki.placeAt(this.ShuhaikuikiNode);
      this.Shuhaikuiki.startup();
    },

    _initTeijiShuka: function() {
      this.TeijiShuka = new TeijiShuka({
        map: this.map,
        appConfig: this.appConfig,
        nls: this.nls,
      });
      this.TeijiShuka.placeAt(this.TeijiShukaNode);
      this.TeijiShuka.startup();
    },
      
  });
});
