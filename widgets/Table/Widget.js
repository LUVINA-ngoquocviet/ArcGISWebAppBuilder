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
    name: "Table",
    baseClass: "jimu-widget-search-selectbox",
    attackHani_layer_id:"",
    opLayerIn: "",
    opLayerOut: "",

    tableDijit:["","","",""],

    checkTrueList: new Array(),

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

      // ▽▽▽　process display tabs
      var menu = document.getElementById('tab_menu1');
      var menus = menu.getElementsByTagName('a');
      // save current status
      var current;
      for (var i = 0, l = menus.length; i < l; i++) {
        tab_init(menus[i], i);
      }
      function tab_init(link, index){
        var id = link.hash.slice(1);
        var page = document.getElementById(id);

        if(!current){
          current = {page:page, menu:link};
          page.style.display = 'block';
          link.className = 'active';
        }else {
          page.style.display = 'none';
        }
        link.onclick = function(){
          current.page.style.display = 'none';
          current.menu.className = '';
          page.style.display = 'block';
          link.className = 'active';
          current.page = page;
          current.menu = link;
          return false;
        };
      }
      // △△△　process display tabs

      if (!(this.config && this.config.sources)) {
        this.config.sources = [];
      }

      var self = this;
      var opLayers = this.map.itemInfo.itemData.operationalLayers;
      var tables = this.map.itemInfo.itemData.tables;

      this.opLayers = opLayers.concat(tables);

      self._createTableIn(self);
      self._createTableOut(self);

      // set event handler
      var _event = document.getElementById("AttackHani_event");
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
            if (title_array[0] = "japan_roads") {
              self.attackHani_layer_id = layer.id;
              self.opLayerIn = new FeatureLayer(layer.layerObject.url);
            }
          }
        }));

        this.opLayers = this.map.itemInfo.itemData.tables;
        array.some(
          opLayers,
          lang.hitch(this, function (layer) {
            var title_array = layer.title.split(" ");
            // ...
            if (layer.selfType === "table") {
              if (title_array[0] = "japan_roads") {
                self.opLayerOut = new FeatureLayer(layer.layerObject.url);
              }
            }
          }));
    },

    _createTableIn: function(self) {
      var fields = [{
        name: 'checkbox',
        title: '',
        width: 'auto',
        type: 'checkbox',
        onChange: function(tr, checkBox) {
          var id = dojo.attr(tr, "id");
          self._changeEvent(self, checkBox, id);
        }
      }, {
        name: 'employee',
        title: '社員番号',
        width: '60%',
        type: 'text'
      }, {
        name: 'quantity',
        title: 'アタック個数',
        width: '60%',
        type: 'text'
      }];

      var tableDijit = new SimpleTable({
        id: 'summaryTableIn',
        fields: fields,
        selectable: true,
        autoHeight: false,
        autoWidth: false,
      });

      tableDijit.placeAt(self.tableNodeIn).startup();
      dojo.addClass('summaryTableIn', 'summary-table');
      tableDijit.clear();
      self.tableDijit[0] = tableDijit;

      tableDijit = new SimpleTable({
        id: 'summaryTableInout',
        fields: fields,
        selectable: true,
        autoHeight: false,
        autoWidth: false,
      });

      tableDijit.placeAt(self.tableNodeInout).startup();
      dojo.addClass('summaryTableInout', 'summary-table');
      tableDijit.clear();
      self.tableDijit[1] = tableDijit;

    },

    _createTableOut: function(self) {
      var fields = [{
          name: 'employee',
          title: '社員番号',
          width: '60%',
          type: 'text'
        }, {
          name: 'quantity',
          title: 'アタック個数',
          width: '60%',
          type: 'text'
        }];

      var tableDijit = new SimpleTable({
        id: 'summaryTableOutin',
        fields: fields,
        selectable: true,
        autoHeight: false,
        autoWidth: false,
      });

      tableDijit.placeAt(self.tableNodeOutin).startup();
      dojo.addClass('summaryTableOutin', 'summary-table');
      tableDijit.clear();
      self.tableDijit[2] = tableDijit;

      var tableDijit = new SimpleTable({
        id: 'summaryTableOut',
        fields: fields,
        selectable: true,
        autoHeight: false,
        autoWidth: false,
      });

      tableDijit.placeAt(self.tableNodeOut).startup();
      dojo.addClass('summaryTableOut', 'summary-table');
      tableDijit.clear();
      self.tableDijit[3] = tableDijit;
    },
    
    _outEvent: function(self) {
      self.checkTrueList = new Array();
      if(common.area_shiten_cd_0 != "-"){
        var query = new Query();
        query.returnGeometry = false;
        // query.outFields = [];
        // query.orderByFields = [];
        query.where = "1 = 1";

        self.tableDijit[0].clear();
        self.tableDijit[1].clear();
        self.opLayerIn.queryFeatures(query).then(function(response){
          response.features.forEach(function(data){
            if(data.attributes.shain_kbn == "01") {
              var row = self.tableDijit[0].addRow({
                employee: "employee0", //data.attributes.syain_id
                quantity: "0個"
              }, -1, true);

              dojo.attr(row.tr, "id", "center_ten_cd + syain_id");
            } else {
              var row = self.tableDijit[1].addRow({
                employee: "employee1", //data.attributes.syain_id
                quantity: "1個"
              }, -1, true);
            }
          });
          self.tableDijit[0].updateUI();
          self.tableDijit[1].updateUI();
        });

        self.tableDijit[2].clear();
        self.tableDijit[3].clear();
        self.opLayerIn.queryFeatures(query).then(function(response){
          response.features.forEach(function(data){
            if(data.attributes.shain_kbn == "01") {
              var row = self.tableDijit[2].addRow({
                employee: "employee2", //data.attributes.syain_id
                quantity: "2個"
              }, -1, true);
            } else {
              var row = self.tableDijit[3].addRow({
                employee: "employee3", //data.attributes.syain_id
                quantity: "3個"
              }, -1, true);
            }
          });
          self.tableDijit[2].updateUI();
          self.tableDijit[3].updateUI();
        });

      }else {
        self.tableDijit[0].clear();
        self.tableDijit[1].clear();
        self.tableDijit[2].clear();
        self.tableDijit[3].clear();
      }
      self._filter(self, false);
    },

  _changeEvent: function(self, checkBox, id){
    if(!checkBox.checked){
      for(let i=0; i< self.checkTrueList.length; i++){
        if(self.checkTrueList[i] == id){
          self.checkTrueList.splice(i--, 1);
        }
      }
    } else {
      self.checkTrueList.push(id);
    }
    self._filter(self, checkBox.checked);
  },

  _filter: function(self, highlightFlg){
    var expr = "";

    self.filterManager.applyWidgetFilter(self.attackHani_layer_id, self.id, expr);

    if(highlightFlg) {
      self._highlight();
    }
  },

  _highlight: function(){
    var layerStructure = LayerStructure.getInstance();
    var layer = layerStructure.getNodeById(tanto_area_layer_id);
    layer.getExtent().then(lang.hitch(layer, function(extend){
      layer.zoomTo(extend);
    }));
  },

  });
});
