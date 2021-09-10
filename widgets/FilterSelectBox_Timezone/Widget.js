define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/html",
  "jimu/BaseWidget",
  "dijit/form/Select",
  "jimu/FilterManager",
  "jimu/LayerStructure",
  "esri/layers/FeatureLayer",
  "widgets/common",
], function (
  declare,
  lang,
  array,
  html,
  BaseWidget,
  Select,
  FilterManager,
  LayerStructure,
  FeatureLayer,
  common
) {
  //To create a widget, you need to derive from BaseWidget.
  return declare([BaseWidget], {
    name: "FilterSelectBox_Timezone",
    baseClass: "jimu-widget-search-selectbox",

    attack_layer_id: "",
    shuhaikuiki_suryo_id: "",

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

      // Create select box
      self._createSelect(self);

      var jigyosho = document.getElementById("NimotsuShousai_jigyosho");
      jigyosho.onchange = function (evt) {
        self._jigyoshoFilterEvent(self);
      };

      this.opLayers = this.map.itemInfo.itemData.operationalLayers;

      array.some(
        this.opLayers,
        lang.hitch(this, function (layer) {
          if (layer.layerType === "ArcGISFeatureLayer") {
            var title_array = layer.title.split(" ");
            // if (title_array.length != 3) {
            //   return;
            // }
            var layerName = title_array[0];
            switch (layerName) {
              case "japan_sea_ports":
                self.layerStructure.getNodeById(layer.id).show();
                self.attack_layer_id = layer.id;
                if (self.shuhaikuiki_suryo_id != "") {
                  self._filter(self);
                  common._eventHandlerNimotsu();
                }
                break;
              case "japan_airport":
                self.layerStructure.getNodeById(layer.id).show();
                self.shuhaikuiki_suryo_id = layer.id;
                if (self.attack_layer_id != "") {
                  self._filter(self);
                  common._eventHandlerNimotsu();
                }
              default:
                break;
            }
          }
        })
      );
      // MERGE kensaku
      // this._initShuhaikuiki();
      // this._initTeijiShuka();

    },

    _createSelect: function (self) {
      var timezoneArray = [
        { value: 0, label: "1便（～12：59）", selected: true },
        { value: 1, label: "2便（13：00～17：59）" },
        { value: 2, label: "3便（18：00～）" },
      ];
      new Select({
        id: "NimotsuShousai_timezoneSelect",
        options: timezoneArray,
        disabled: true,
        onChange: function (state) {
          common.area_time_select = state;
          self._filter(self);
          common._eventHandlerNimotsu();
        },
      })
        .placeAt(self.searchNode_timezone)
        .startup();

      var itemTypeArray = [
        { value: "0", label: "全体", selected: true },
        { value: "1", label: "クール（冷蔵）" },
        { value: "2", label: "クール（冷凍）" },
        { value: "3", label: "ネコポス" },
        { value: "4", label: "アマゾン" },
        { value: "5", label: "ネコポス除外" },
        { value: "6", label: "アマゾン除外" },
        { value: "7", label: "ネコポス・アマゾン除外" },
      ];
      new Select({
        id: "NimotsuShousai_itemSelect",
        options: itemTypeArray,
        disabled: true,
        onChange: function (state) {
          common.area_item_select = state;
          self._filter(self);
          common._eventHandlerNimotsu();
        },
      })
        .placeAt(self.searchNode_itemtype)
        .startup();
    },

    _jigyoshoFilterEvent: function (self) {
      var shitenTimeLabel = document.getElementById("shitenTimeLabel");
      if( common.area_shiten_cd != "-") {
        shitenTimeLabel.style.display = "none";
        common._setDomVal("NimotsuShousai_timezoneSelect", "disabled", false);
        common._setDomVal("NimotsuShousai_itemSelect", "disabled", false);
      }else {
        shitenTimeLabel.style.display = "";
        common._setDomVal("NimotsuShousai_timezoneSelect", "value", 0);
        common._setDomVal("NimotsuShousai_itemSelect", "value", "0");
        common._setDomVal("NimotsuShousai_timezoneSelect", "disabled", true);
        common._setDomVal("NimotsuShousai_itemSelect", "disabled", true);
      }
      self._filter(self);
      common._eventHandlerNimotsu();
    },

    _filter: function (self) {
      var timeVal = common._getDomVal("NimotsuShousai_timezoneSelect", "value");
      var itemVal = common._getDomVal("NimotsuShousai_itemSelect", "value");
      var expr = "CH1 ='" + timeVal + "'";
      var exprShuhaikuikiSuryo = "";
      switch (itemVal) {
        case "1":
        case "2":
        case "3":
          exprShuhaikuikiSuryo += "REF ='" + itemVal + "'";
          break;
        case "4":
          exprShuhaikuikiSuryo += "REF ='" + "1" + "'";  
        break;
        case "5":
          exprShuhaikuikiSuryo += "INP ='" + itemVal + "'";
        break;
        case "6":
          exprShuhaikuikiSuryo += "REF ='" + "2" + "'";  
          break;
        case "7":
          exprShuhaikuikiSuryo += "REF ='" + "3" + "'";
          break;
        default:
          break;
      }
      self.filterManager.applyWidgetFilter(self.attack_layer_id, self.id, expr);
      self.filterManager.applyWidgetFilter(self.shuhaikuiki_suryo_id, self.id, exprShuhaikuikiSuryo);

      var target = dijit.byId("jimu_dijit_DrawBox_0");
      if (target != null) {
        target.clear();
        target.emit("user-clear");
      }
    },
  });
});
