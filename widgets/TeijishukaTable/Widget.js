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
        this.opLayers,
        lang.hitch(this, function (layer) {
          if (layer.layerType === "ArcGISFeatureLayer") {
            var title_array = layer.title.split(" ");
            
            if (title_array[0] == "japan_airport") {
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
      if(common.area_shiten_cd != "-"){
        var query = new Query();
        var queryCount = new Query();

        query.returnGeometry = false;
        query.outFields = ["AAC", "FID_1","COA", "NA3", "OPT", "CLT", "AD2"];
        // query.orderByFields = [];
        queryCount.returnGeometry = false;
        queryCount.returnDistinctValues = true;
        queryCount.outFields = ["FID_1"];

        var expr = common.teijishuka_expr ? common.teijishuka_expr : "1 = 1";
        console.log(expr);
        query.where = expr;
        queryCount.where = expr;
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
              center_ten_cd: data.attributes.AAC,
              jusho: data.attributes.COA,
              shuka_time_disp: data.attributes.OPT + '~' + data.attributes.CLT,
              yobi: self._formatYobi(data.attributes.AD2)
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

  _formatYobi(AD2){
    var yobi = "";
    switch (AD2) {
      case '1':
        yobi = "月";
        break;
      case '2':
        yobi = "火";
        break;
      case '3':
        yobi = "水";
        break;
      case '4':
        yobi = "木";
        break;
      case '5':
        yobi = "金";
        break;
      case '6':
        yobi = "土";
        break;
      default:
        break;
    }
    return yobi;
  },

  print: function(){
    var url = "https://www.luvina.net";
    // url += "?param=" + common.kengen_lv;

    window.open(url, "_blank");
    alert("稼働画面に移動");
  },

  });
});
