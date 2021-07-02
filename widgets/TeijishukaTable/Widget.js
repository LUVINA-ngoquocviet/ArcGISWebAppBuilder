define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "jimu/FilterManager",
  "jimu/LayerStructure",
  "esri/layers/FeatureLayer",
  "esri/tasks/query",
  "jimu/dijit/SimpleTable",
  "widgets/common",
], function (
  declare,
  lang,
  array,
  html,
  BaseWidget,
  FilterManager,
  LayerStructure,
  FeatureLayer,
  Query,
  SimpleTable,
  common
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "TeijishukaTable",
    baseClass: "jimu-widget-search-selectbox",

    opLayer: new Object(),
    tableDijit: null,

    postCreate: function () {
      html.setAttr(this.domNode, "aria-label", this.nls._widgetLabel);

      if (this.closeable || !this.isOnScreen) {
        html.addClass(this.searchNode, "default-width-for-openAtStart");
      }
      this.listenWidgetIds.push("framework");

      this.filterManager = FilterManager.getInstance();
      this.layerStructure = LayerStructure.getInstance();
    },

    startup: function () {
      this.inherited(arguments);

      if (!(this.config && this.config.sources)) {
        this.config.sources = [];
      }

      var self = this;
      var opLayers = this.map.itemInfo.itemData.operationalLayers;
      var tables = this.map.itemInfo.itemData.tables;

      this.opLayers = opLayers.concat(tables);

      self._createTable(self);

      // set event handler
      var _event = document.getElementById("TeijishukaTable_event");
      _event.onchange = function(evt){
        self._outEvent(self);
      };

      this.opLayers = this.map.itemInfo.itemData.operationalLayers;
      array.some(
        opLayers,
        lang.hitch(this, function (layer) {
            var title_array = layer.title.split(" ");
            // if (title_array.length != 3) {
            //   return;
            // }
            
          if (layer.layerType === "ArcGISFeatureLayer") {
            if (title_array[0] = "japan_railways") {
              self.opLayer = new FeatureLayer(layer.layerObject.url);
            }
          }
        }));
    },

    _createTable: function(self) {
      var fields = [{
          name: 'no',
          title: 'No.',
          width: '8%',
          type: 'text'
        }, {
          name: 'center_ten_cd',
          title: 'センター店コード',
          width: '15%',
          type: 'text'
        }, {
          name: 'jusho',
          title: '住所',
          width: '42%',
          type: 'text'
        }, {
          name: 'shuka_time_disp',
          title: '集荷時間帯',
          width: '15%',
          type: 'text'
        }, {
          name: 'yobi',
          title: '曜日',
          width: '20%',
          type: 'text'
        }];

      var tableDijit = new SimpleTable({
        id: 'teijishukaTable',
        fields: fields,
        selectable: true,
        autoHeight: false,
        autoWidth: false,
      });

      tableDijit.placeAt(self.TeijishukaTableNode).startup();
      tableDijit.clear();
      self.tableDijit = tableDijit;

    },
    
    _outEvent: function(self) {
      if(common.area_shiten_cd_0 != "-"){
        var query = new Query();
        var queryCount = new Query();

        query.returnGeometry = false;
        // query.outFields = [];
        // query.orderByFields = [];
        queryCount.returnGeometry = false;
        // queryCount.outFields = [];
        // queryCount.orderByFields = [];
        query.where = "1 = 1";
        queryCount.where = "1 = 1";
        var countNoki = 0;

        self.opLayer.queryFeatures(queryCount).then(function(response){
          response.features.forEach(function(data){
            countNoki++;
          });
          countNoki = Number(countNoki);
          document.getElementById("TeijishukaTableLabel").innerHTML = countNoki.toLocaleString() + "軒先";
          document.getElementById("TeijishukaTable-print-btn").style.display = "block";
        });

        self.tableDijit.clear();
        var before = ["","","","","",""];
        self.opLayer.queryFeatures(query).then(function(response){
          // var _yobi_disp ="";
          var _no = 0;
          response.features.forEach(function(data){
            // if(before[5] != data.attributes.teiji_shuka_id ...)
            _no++;
            self.tableDijit.addRow({
              no: _no,
              center_ten_cd: "_center_ten_cd" + _no,
              jusho: "_jusho" + _no,
              shuka_time_disp: "_shuka_time_disp" + _no,
              yobi: "_yobi" + _no
            }, -1, true);

          });
          self.tableDijit.updateUI();
        }, function(e) {
          console.log(e);
        });

      }else {
        document.getElementById("TeijishukaTableLabel").innerHTML = "";
        document.getElementById("TeijishukaTable-print-btn").style.display = "none";
        self.tableDijit.clear();
      }
    },

  print: function(){
    var url = "https://www.luvina.net";
    // url += "?param=" + common.kengen_lv;

    window.open(url, "_blank");
  },

  });
});
