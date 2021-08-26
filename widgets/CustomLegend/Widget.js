var opLayer_Prefectures = new Object();
define([
  "dojo/_base/declare",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "jimu/LayerInfos/LayerInfos",
  "esri/dijit/Legend",
  "./Utils",
  "dojo/on",
  "dojo/_base/lang",
  "dojo/dom-construct",
  "dojo/dom",
  "dojo/query",
  "dojo/domReady!"
], function (
  declare,
  html,
  BaseWidget,
  LayerInfos,
  Legend,
  legendUtils,
  on,
  lang,
  domConstruct,
  dom,
  query
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "CustomLegend",
    baseClass: "customlegend",

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

      if (!this.config.layerState || this.config.syncWithWebmap) {
        // compatible before online5.4
        this.config.layerState = {};
      }
      this._jimuLayerInfos = LayerInfos.getInstanceSync();
      this._createLegendForOperationalLayers();

      this._bindEvent();
    },

    _createLegendForOperationalLayers: function () {
      var legendParams = {
        arrangement: this.config.legend.arrangement,
        autoUpdate: this.config.legend.autoUpdate,
        respectCurrentMapScale: this.config.legend.respectCurrentMapScale,
        //respectVisibility: false,
        map: this.map,
        layerInfos: this._getLayerInfosParam()
      };
      this.legend = new Legend(legendParams, "refBA");

      on(dom.byId("refBA"), "load", function () {
        var listLabel = [];
        query(".esriLegendService > table").forEach(function(node){
          listLabel.push(node);
        });
        var i = 0;
        query(".esriLegendService > div").forEach(function(node){
          domConstruct.place(listLabel[i], node, "after")
          i++;
        });
      });

      this.legend.startup();

      var listLabel = [];

      // query(".esriLegendService > table").forEach(function (node) {
      //   listLabel.push(node);
      // });
      // console.log("nam");
      // console.log(listLabel);
      // var i = 0;
      // query(".esriLegendService > div").forEach(function (node) {
      //   domConstruct.place(listLabel[i], node, "after")
      //   i++;
      // });
    },

    _bindEvent: function () {
      if (this.config.legend.autoUpdate) {
        this.own(on(this._jimuLayerInfos,
          'layerInfosIsShowInMapChanged',
          lang.hitch(this, 'refreshLegend')));

        this.own(on(this._jimuLayerInfos,
          'layerInfosChanged',
          lang.hitch(this, 'refreshLegend')));

        this.own(on(this._jimuLayerInfos,
          'basemapLayersChanged',
          lang.hitch(this, 'refreshLegend')));

        this.own(on(this._jimuLayerInfos,
          'layerInfosRendererChanged',
          lang.hitch(this, 'refreshLegend')));
      }
    },

    _getLayerInfosParam: function () {
      var layerInfosParam;
      var basemapLayerInfosParam = [];

      layerInfosParam = basemapLayerInfosParam.concat(legendUtils.getLayerInfosParam(this.config));

      return layerInfosParam;
    },

    refreshLegend: function () {
      if (this.legend) {
        var layerInfos = this._getLayerInfosParam();
        this.legend.refresh(layerInfos);
      }
    },

    // _getLayerInfosParam2: function() {              
    //   var layerInfosParam;           
    //   if(this.config.legend.layerInfos === undefined) {        
    //     // widget has not been configed.        
    //     console.log("Zoo");
    //     layerInfosParam = legendUtils.getLayerInfosParam();           
    //   } else {        
    //     // widget has been configed, respect config.        
    //     layerInfosParam = legendUtils.getLayerInfosParamByConfig(this.config.legend);
    //   }             
    //   filteredLayerInfosParam = layerInfosParam.filter(function(layerInfoParam) {
    //     console.log(layerInfoParam.layer)               
    //     if(layerInfoParam.title === "Topografie und Bodenbedeckung"){          
    //       layerInfoParam.hideLayers=[0,1,2,5,6,7,8,9,10,11,12,13,14,15,16,17,18]; 
    //       //01234            //THE WAY I TRIED TO ACCESS THE legendResponse OBJECT           
    //       layerInfoParam.layer.legendResponse;           
    //       layerInfoParam.title="This is the title"           
    //       layerInfoParam.layer.layerInfos[3].name ="This is the name";            
    //       return layerInfoParam;                    
    //     }                
    //   });      
    //   return filteredLayerInfosParam;   
    // }

  });
});
