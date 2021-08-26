var opLayer_Prefectures = new Object();
define([
  "dojo/_base/declare",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "dojo/on",
  "dojo/_base/lang",
  "dojo/dom-construct",
  "dojo/dom",
  'dojo/dom-style'
], function (
  declare,
  html,
  BaseWidget,
  on,
  lang,
  domConstruct,
  dom,
  domStyle
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "ToggleLegend",
    baseClass: "ToggleLegend",
    visible: true,

    _jimuLayerInfos: null,

    postCreate: function () {
      html.setAttr(this.domNode, "aria-label", this.nls._widgetLabel);
      if (this.closeable || !this.isOnScreen) {
        html.addClass(this.searchNode, "default-width-for-openAtStart");
      }
      this.listenWidgetIds.push("framework");
    },

    startup: function () {
      this.inherited(arguments);
      on(dom.byId("toggle-legend"), "click", function () {
        this.visible = !this.visible;
        domStyle.set(dom.byId("_37"), "display", this.visible ? "none" : "block");
      });
    },
  });
});
