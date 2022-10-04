///////////////////////////////////////////////////////////////////////////
// Copyright © Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'esri/tasks/PrintTask',
  "esri/tasks/PrintParameters",
  "esri/tasks/PrintTemplate",
  "esri/request",
  'esri/lang',
  'esri/arcgis/utils',
  'esri/SpatialReference',
  'dojo/_base/config',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/dom-style',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/promise/all',
  'dojo/Deferred',
  'jimu/portalUrlUtils',
  'dojo/text!./templates/Print.html',
  'dojo/text!./templates/PrintResult.html',
  'dojo/aspect',
  'dojo/query',
  'jimu/LayerInfos/LayerInfos',
  'jimu/dijit/LoadingIndicator',
  'jimu/dijit/Message',
  'jimu/utils',
  'jimu/SpatialReference/srUtils',
  'dojo/on',
  'dijit/popup',
  'dijit/form/ValidationTextBox',
  'dijit/form/Form',
  'dijit/form/Select',
  'dijit/form/NumberTextBox',
  'dijit/form/Button',
  'dijit/form/CheckBox',
  'dijit/ProgressBar',
  'dijit/form/DropDownButton',
  'dijit/TooltipDialog',
  'dijit/form/RadioButton',
  'dijit/form/SimpleTextarea',
  'esri/IdentityManager',
  'dojo/store/Memory',
  'dojo/dom',
  'widgets/common',
  'jimu/WidgetManager',
  'dojo/keys'
  // 'dojo/NodeList-dom'
], function (
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  PrintTask,
  PrintParameters,
  PrintTemplate,
  esriRequest,
  esriLang,
  arcgisUtils,
  SpatialReference,
  dojoConfig,
  lang,
  array,
  html,
  domStyle,
  domConstruct,
  domClass,
  all,
  Deferred,
  portalUrlUtils,
  printTemplate,
  printResultTemplate,
  aspect,
  query,
  LayerInfos,
  LoadingIndicator,
  Message,
  utils,
  srUtils,
  on,
  popup,
  ValidationTextBox,
  Form,
  Select,
  NumberTextBox,
  Button,
  CheckBox,
  ProgressBar,
  DropDownButton,
  TooltipDialog,
  RadioButton,
  SimpleTextarea,
  IdentityManager,
  Memory,
  dom,
  common,
  WidgetManager,
  keys) {
  // Main print dijit
  var PrintDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: printTemplate,
    map: null,
    count: 1,
    results: [],
    authorText: null,
    copyrightText: null,
    copyrightEditable: true,
    defaultTitle: null,
    defaultFormat: null,
    defaultLayout: null,
    baseClass: "gis_PrintDijit",
    pdfIcon: require.toUrl("./widgets/Print/images/pdf.png"),
    imageIcon: require.toUrl("./widgets/Print/images/image.png"),
    printTaskURL: null,
    printTask: null,
    async: false,
    // showAdvancedOption: true,
    _showSettings: false,

    _currentTemplateInfo: null,

    //  operational layer infos
    operLayerInfos: null,

    // list Default Scales
    listDefaultScales: [],

    postCreate: function () {
      this.inherited(arguments);
      var printParams = {
        async: this.async
      };
      // var _handleAs = 'json';

      this.printTask = new PrintTask(this.printTaskURL, printParams);
      this.printparams = new PrintParameters();
      this.printparams.map = this.map;
      //fix issue #7141
      // this.printparams.outSpatialReference = this.map.spatialReference;

      this.shelter = new LoadingIndicator({
        hidden: true
      });
      this.shelter.placeAt(this.domNode);
      this.shelter.startup();
      this.shelter.show();

      this.titleNode.set('value', this.defaultTitle);
      this.authorNode.set('value', this.defaultAuthor);
      this.copyrightNode.set('value', this.defaultCopyright);
      this.copyrightNode.set('readOnly', !this.copyrightEditable);

      srUtils.loadResource().then(lang.hitch(this, function () {
        var wkidLabel;
        if (srUtils.isValidWkid(this.map.spatialReference.wkid)) {
          this.wkidInput.set('value', this.map.spatialReference.wkid);
          wkidLabel = srUtils.getSRLabel(this.map.spatialReference.wkid);
          this.wkidLabel.innerHTML = utils.sanitizeHTML(wkidLabel);
          this.wkidLabel.title = wkidLabel;
        } else {
          this.wkidInput.set('value', '');
          this.wkidLabel.innerHTML = '';
          this.wkidLabel.title = '';
        }
        this.wkidInput.set('invalidMessage', this.nls.invalidWkid);
        this.wkidInput.validator = function (value) {
          return !value || value.trim() === '' || srUtils.isValidWkid(+value);
        };
      }));

      var serviceUrl = portalUrlUtils.setHttpProtocol(this.printTaskURL);
      var portalNewPrintUrl = portalUrlUtils.getNewPrintUrl(this.appConfig.portalUrl);
      this._isNewPrintUrl = serviceUrl === portalNewPrintUrl ||
        /sharing\/tools\/newPrint$/.test(serviceUrl);
      var scaleRadio = query('input', this.printWidgetMapScale.domNode)[0];
      var extentRadio = query('input', this.printWidgetMapExtent.domNode)[0];
      utils.combineRadioCheckBoxWithLabel(scaleRadio, this.printWidgetMapScaleLabel);
      utils.combineRadioCheckBoxWithLabel(extentRadio, this.printWidgetMapExtentLabel);

      if (this.defaultLayout === 'MAP_ONLY') {
        html.setStyle(this.titleTr, 'display', 'none');
      } else {
        html.setStyle(this.titleTr, 'display', '');
      }

      if (this._hasLabelLayer()) {
        html.setStyle(this.labelsFormDijit.domNode, 'display', '');
        html.setStyle(this.labelsTitleNode, 'display', '');
      } else {
        html.setStyle(this.labelsFormDijit.domNode, 'display', 'none');
        html.setStyle(this.labelsTitleNode, 'display', 'none');
      }

      LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function (layerInfosObj) {
          this.layerInfosObj = layerInfosObj;
          return all([this._getPrintTaskInfo(), this._getLayerTemplatesInfo()])
            .then(lang.hitch(this, function (results) {
              var taksInfo = results[0],
                templatesInfo = results[1];
              if (templatesInfo && !templatesInfo.error) {
                var parameters = templatesInfo && templatesInfo.results;
                if (parameters && parameters.length > 0) {
                  array.some(parameters, lang.hitch(this, function (p) {
                    return p && p.paramName === 'Output_JSON' ?
                      this.templateInfos = p.value : false;
                  }));
                  if (this.templateInfos && this.templateInfos.length > 0) {
                    this.templateNames = array.map(this.templateInfos, function (ti) {
                      return ti.layoutTemplate;
                    });
                  }
                }
              } else {
                console.warn('Get Layout Templates Info Error',
                  templatesInfo && templatesInfo.error);
              }
              if (!esriLang.isDefined(taksInfo) || (taksInfo && taksInfo.error)) {

                this._handleError(taksInfo.error);
              } else {
                this._handlePrintInfo(taksInfo);
              }
            }));
        })).always(lang.hitch(this, function () {
          this.shelter.hide();
        }));

      if (this.printTask._getPrintDefinition) {
        aspect.after(
          this.printTask,
          '_getPrintDefinition',
          lang.hitch(this, 'printDefInspector'),
          false);
      }
      if (this.printTask._createOperationalLayers) {
        // if opLayers contains markerSymbol of map.infoWindow, the print job will failed
        aspect.after(
          this.printTask,
          '_createOperationalLayers',
          lang.hitch(this, '_fixInvalidSymbol')
        );
        aspect.after(
          this.printTask,
          '_createOperationalLayers',
          lang.hitch(this, '_excludeInvalidLegend')
        );
      }
    },

    _printWithGridLayout: function () {
      //Phóng to cửa sổ map
      if (query(".lm_maximised").length == 0) {
        query(".no-tabs").children().forEach(function (node) {
          if (domClass.contains(node, "lm_controls")) {
            query(".lm_maximise", node).forEach(function (nodeChild) {
              nodeChild.click();
            });
          }
        });
      }

      //Thu nhỏ map
      //Lấy tọa độ map hiện tại
      let currentExtent = this.map.geographicExtent;
      //Lấy tọa độ map sau khi thu nhỏ
      const coordinatesLarge = common._getCoordinatesLarge(currentExtent.xmin, currentExtent.ymin, currentExtent.xmax, currentExtent.ymax);
      //Khai báo đối tượng zoom
      let extentGeoLarge = new esri.geometry.Extent();
      extentGeoLarge.xmin = coordinatesLarge.xmin;
      extentGeoLarge.ymin = coordinatesLarge.ymin;
      extentGeoLarge.xmax = coordinatesLarge.xmax;
      extentGeoLarge.ymax = coordinatesLarge.ymax;
      //Thu nhỏ map theo tọa độ đã lấy được
      this.map.setExtent(extentGeoLarge, false);

      //Init LayerInfos
      LayerInfos.getInstance(this.map, this.map.itemInfo)
        .then(lang.hitch(this, function(operLayerInfos) {
          this.operLayerInfos = operLayerInfos;
        }));

      array.forEach(this.operLayerInfos.getLayerInfoArray(), function(layerInfo) {
        if (layerInfo.isShowInMap()) {
          // add to listDefaultScales
          this.listDefaultScales.push(layerInfo.getScaleRange().minScale);
          // set scale on current view map
          layerInfo.setScaleRange(this.map.getMinScale(), 0);
        }
      }, this);

      //Tắt sự kiện map
      this._disableEventsOnMap();

      //Ẩn các widget trên màn hình 
      this._visibilityWidgetsOnMap("none");

      this._onClickSingle(extentGeoLarge);
      this._visibilityWidgetsOnMap("block");

      // Ngăn chặn sự kiện click hiện tại lan rộng tới thằng khác.
      event.stopPropagation();

      //Bật sự kiện map
      this._enableEventsOnMap();
      setTimeout(function(){
        this.map.setExtent(extentGeoLarge, false);
      }, 6*5000);
      
    },

    //Disable events trên map
    _disableEventsOnMap: function () {
      this.map.disableClickRecenter();
      this.map.disableDoubleClickZoom();
      this.map.disableKeyboardNavigation();
      this.map.disableMapNavigation();
      this.map.disablePan();
      this.map.disablePinchZoom();
      this.map.disableRubberBandZoom();
      this.map.disableScrollWheel();
      this.map.disableScrollWheelZoom();
      this.map.disableShiftDoubleClickZoom();
      this.map.setInfoWindowOnClick(false);
    },

    //Enable events trên map
    _enableEventsOnMap: function () {
      this.map.enableClickRecenter();
      this.map.enableDoubleClickZoom();
      this.map.enableKeyboardNavigation();
      this.map.enableMapNavigation();
      this.map.enablePan();
      this.map.enablePinchZoom();
      this.map.enableRubberBandZoom();
      this.map.enableScrollWheel();
      this.map.enableScrollWheelZoom();
      this.map.enableShiftDoubleClickZoom();
      this.map.setInfoWindowOnClick(true);
    },

    //Zoom vào ô đã click
    _onClickSingle: function (extentGeoLarge) {
      var extentGeo = new esri.geometry.Extent();
      extentGeo.xmin = extentGeoLarge.xmin;
      extentGeo.ymin = extentGeoLarge.ymin;
      extentGeo.xmax = extentGeoLarge.xmax;
      extentGeo.ymax = extentGeoLarge.ymax;
      // var extendCurrent = this.map.geographicExtent;
      var self = this;
      //Zoom
      var coordinatesCenter = this.map.geographicExtent.getCenter();
      var ArrayCoordinates = this._getArrayCoordinate(coordinatesCenter, extentGeo);

      domConstruct.destroy("wrapper-grid");

      for(let i = 0; i< ArrayCoordinates.length; i++) {
        console.log(self.map);
        let ai = i;
        setTimeout(function() {
          self._setExtentMap(ArrayCoordinates[ai], true).then(lang.hitch(this, function() {
            self.print();
          }));
        }, 5000 * (i+1));
        setTimeout(function () {
          self._setExtentMap(extentGeoLarge);
        }, 5000 * (ArrayCoordinates.length + 1));
      }
    },

    _setExtentMap: function (Coordinate, fit) {
      var extentGeo = new esri.geometry.Extent();
      console.log(Coordinate);
      extentGeo.xmin = Coordinate.xmin;
      extentGeo.ymin = Coordinate.ymin;
      extentGeo.xmax = Coordinate.xmax;
      extentGeo.ymax = Coordinate.ymax;
      // Zoom
      return this.map.setExtent(extentGeo, fit);
    },

    _getArrayCoordinate: function(coordinatesCenter, extentGeo) {
      var ArrayCoordinates = [];
      var extendGeoNumOne = new esri.geometry.Extent();
      extendGeoNumOne.xmin = extentGeo.xmin;
      extendGeoNumOne.ymin = coordinatesCenter.y;
      extendGeoNumOne.xmax = coordinatesCenter.x;
      extendGeoNumOne.ymax = extentGeo.ymax;
      ArrayCoordinates.push(extendGeoNumOne);
      
      var extendGeoNumTwo = new esri.geometry.Extent();
      extendGeoNumTwo.xmin = coordinatesCenter.x;
      extendGeoNumTwo.ymin = coordinatesCenter.y;
      extendGeoNumTwo.xmax = extentGeo.xmax;
      extendGeoNumTwo.ymax = extentGeo.ymax;
      ArrayCoordinates.push(extendGeoNumTwo);

      var extendGeoNumThree = new esri.geometry.Extent();
      extendGeoNumThree.xmin = extentGeo.xmin;
      extendGeoNumThree.ymin = extentGeo.ymin;
      extendGeoNumThree.xmax = coordinatesCenter.x;
      extendGeoNumThree.ymax = coordinatesCenter.y;
      ArrayCoordinates.push(extendGeoNumThree);

      var extendGeoNumFour = new esri.geometry.Extent();
      extendGeoNumFour.xmin = coordinatesCenter.x;
      extendGeoNumFour.ymin = extentGeo.ymin;
      extendGeoNumFour.xmax = extentGeo.xmax;
      extendGeoNumFour.ymax = coordinatesCenter.y
      ArrayCoordinates.push(extendGeoNumFour);

      return ArrayCoordinates;

    },

    //Chọn nhiều item bằng ctrl
    _onClickMultiple: function (nodeItem, indexItem, listCoordinates) {
      var selectedItem = false;
      //Check item có phải đã được chọn trước đó rồi không?
      for (let i = 0; i < common.objItems.length; i++) {
        if (common.objItems[i].indexItem == indexItem) {
          selectedItem = true;
          // Set lại màu cũ cho item
          domStyle.set(nodeItem, "background", "blue");
          domStyle.set(nodeItem, "opacity", "0.2");
          //Xóa item này khỏi mảng data tọa độ
          common.objItems.splice(i, 1);
          break;
        }
      }

      //Nếu item chưa được chọn trước đó
      if (!selectedItem) {
        // Set màu cho item được chọn
        domStyle.set(nodeItem, "background", "yellow");
        domStyle.set(nodeItem, "opacity", "1");

        //Tạo obj item
        var objItem = {
          indexItem: indexItem,
          coordinates: {}
        }
        objItem.coordinates.xmin = listCoordinates[indexItem].xmin;
        objItem.coordinates.ymin = listCoordinates[indexItem].ymin;
        objItem.coordinates.xmax = listCoordinates[indexItem].xmax;
        objItem.coordinates.ymax = listCoordinates[indexItem].ymax;

        //Add item này vào mảng data tọa độ
        common.objItems.push(objItem);
      }
    },

    //Ẩn/hiện các widgets on screen
    _visibilityWidgetsOnMap: function (displayVal) {
      query("#map").children().forEach(function (node) {
        if (node.id !== "map_root") {
          domStyle.set(node.id, "display", displayVal);
        }
      });
    },

    _onOutputSRChange: function (newValue) {
      var wkidLabel;
      if (srUtils.isValidWkid(+newValue)) {
        wkidLabel = srUtils.getSRLabel(+newValue);
        this.wkidLabel.innerHTML = utils.sanitizeHTML(wkidLabel);
        this.wkidLabel.title = wkidLabel;
      } else {
        this.wkidLabel.innerHTML = '';
        this.wkidLabel.title = '';
      }
    },

    _hasLabelLayer: function () {
      return array.some(this.map.graphicsLayerIds, function (glid) {
        var l = this.map.getLayer(glid);
        return l && l.declaredClass === 'esri.layers.LabelLayer';
      }, this);
    },

    _getPrintTaskInfo: function () {
      // portal own print url: portalname/arcgis/sharing/tools/newPrint
      var def = new Deferred();
      if (this._isNewPrintUrl) { // portal own print url
        def.resolve({
          isGPPrint: false
        });
      } else {
        esriRequest({
          url: this.printTaskURL,
          content: {
            f: "json"
          },
          callbackParamName: "callback",
          handleAs: "json",
          timeout: 60000
        }).then(lang.hitch(this, function (data) {
          def.resolve({
            isGPPrint: true,
            data: data
          });
        }), lang.hitch(this, function (err) {
          def.resolve({
            error: err
          });
        })
        );
      }

      return def;
    },

    _getLayerTemplatesInfo: function () {
      var def = new Deferred();
      var parts = this.printTaskURL.split('/');
      var pos = parts.indexOf('GPServer');
      if (pos > -1) {
        var url = null;
        if (/Utilities\/PrintingTools\/GPServer/.test(this.printTaskURL)) {
          url = parts.slice(0, pos + 1).join('/') + '/' +
            encodeURIComponent('Get Layout Templates Info Task') + '/execute';
        } else {
          url = parts.slice(0, pos + 1).join('/') + '/' +
            encodeURIComponent('Get Layout Templates Info') + '/execute';
        }
        esriRequest({
          url: url,
          content: {
            f: "json"
          },
          callbackParamName: "callback",
          handleAs: "json",
          timeout: 60000
        }).then(lang.hitch(this, function (info) {
          def.resolve(info);
        }), lang.hitch(this, function (err) {
          def.resolve({
            error: err
          });
        }));
      } else {
        def.resolve(null);
      }

      return def;
    },

    _fixInvalidSymbol: function (opLayers) {
      array.forEach(opLayers, function (ol) {
        if (ol.id === 'map_graphics') {
          var layers = lang.getObject('featureCollection.layers', false, ol);
          if (layers && layers.length > 0) {
            array.forEach(layers, function (layer) {
              if (layer && layer.featureSet &&
                layer.featureSet.geometryType === "esriGeometryPoint") {
                array.forEach(layer.featureSet.features, function (f) {
                  if (f && f.symbol && !f.symbol.style) {
                    f.symbol.style = "esriSMSSquare";
                  }
                });
              }
            });
          }
        }
      }, this);
      return opLayers;
    },

    _excludeInvalidLegend: function (opLayers) {
      function getSubLayerIds(legendLayer) {
        return array.filter(legendLayer.subLayerIds, lang.hitch(this, function (subLayerId) {
          var subLayerInfo = this.layerInfosObj.getLayerInfoById(legendLayer.id + '_' + subLayerId);
          return subLayerInfo && subLayerInfo.getShowLegendOfWebmap();
        }));
      }

      if (this.printTask.allLayerslegend) {
        var legends = arcgisUtils.getLegendLayers({ map: this.map, itemInfo: this.map.itemInfo });
        var legendLayersOfWebmap = array.map(legends, function (legend) {
          return {
            id: legend.layer.id
          };
        });

        var legendArray = this.printTask.allLayerslegend;
        var arr = [];
        for (var i = 0; i < legendArray.length; i++) {
          var legendLayer = legendArray[i];
          var layer = this.map.getLayer(legendLayer.id);
          var layerInfo = this.layerInfosObj.getLayerInfoById(legendLayer.id);
          var validLayerType = layer && layer.declaredClass &&
            layer.declaredClass !== "esri.layers.GraphicsLayer";
          var validRenderer = !layer.renderer ||
            (layer.renderer && !layer.renderer.hasVisualVariables());
          var showLegendInMap = layerInfo && layerInfo.getShowLegendOfWebmap();
          if (validLayerType && validRenderer && showLegendInMap) {
            if (legendLayer.subLayerIds) {
              legendLayer.subLayerIds = lang.hitch(this, getSubLayerIds, legendLayer)();
            }

            arr.push(legendLayer);
          }
        }

        // fix issue 6072
        array.forEach(legendLayersOfWebmap, lang.hitch(this, function (legend) {
          var inLegends = array.some(arr, lang.hitch(this, function (l) {
            return l.id === legend.id;
          }));
          var layerInfo = this.layerInfosObj.getLayerInfoById(legend.id);
          var showLegend = layerInfo && layerInfo.getShowLegendOfWebmap() &&
            layerInfo.isShowInMap();
          if (!inLegends && showLegend) {
            arr.push(legend);
          }
        }));
        this.printTask.allLayerslegend = arr;
      }
      return opLayers;
    },

    printDefInspector: function (printDef) {
      //do what you want here then return the object.
      if (this.preserve.preserveScale === 'force') {
        printDef.mapOptions.scale = this.preserve.forcedScale;
      }
      return printDef;
    },

    _handleError: function (err) {
      console.log('print widget load error: ', err);
      new Message({
        message: err.message || err
      });
    },

    onLayoutChange: function (newValue) {
      var pos = this.templateNames && this.templateNames.indexOf(newValue);
      if (pos > -1) {
        html.empty(this.customTextElementsTable);
        var templateInfo = this._currentTemplateInfo = this.templateInfos[pos];
        var customTextElements = lang.getObject(
          "layoutOptions.customTextElements",
          false, templateInfo);
        if (customTextElements && customTextElements.length > 0) {
          var textNames = [];
          array.forEach(customTextElements, lang.hitch(this, function (cte) {
            for (var p in cte) {
              if (textNames.indexOf(p) < 0) {
                var row = this.customTextElementsTable.insertRow(-1);
                var cell0 = row.insertCell(-1);
                cell0.appendChild(html.toDom(p + ': '));
                var cell1 = row.insertCell(-1);
                cell1.appendChild((new ValidationTextBox({
                  name: p,
                  trim: true,
                  required: false,
                  value: cte[p],
                  style: 'width:100%'
                })).domNode);
                textNames.push(p);
              }
            }
          }));
        }

        var hasAuthorText = lang.getObject('layoutOptions.hasAuthorText', false, templateInfo);
        if (!hasAuthorText) {
          html.setStyle(this.authorTr, 'display', 'none');
        } else {
          html.setStyle(this.authorTr, 'display', '');
        }
        var hasCopyrightText = lang.getObject(
          'layoutOptions.hasCopyrightText', false, templateInfo);
        if (!hasCopyrightText) {
          html.setStyle(this.copyrightTr, 'display', 'none');
        } else {
          html.setStyle(this.copyrightTr, 'display', '');
        }
        var hasTitleText = lang.getObject('layoutOptions.hasTitleText', false, templateInfo);
        if (!hasTitleText) {
          html.setStyle(this.titleTr, 'display', 'none');
        } else {
          html.setStyle(this.titleTr, 'display', '');
        }
        var hasLegend = lang.getObject('layoutOptions.hasLegend', false, templateInfo);
        if (!hasLegend) {
          html.setStyle(this.legendTr, 'display', 'none');
        } else {
          html.setStyle(this.legendTr, 'display', '');
        }
      } else if (newValue === 'MAP_ONLY') {
        html.setStyle(this.authorTr, 'display', 'none');
        html.setStyle(this.copyrightTr, 'display', 'none');
        html.setStyle(this.titleTr, 'display', 'none');
        html.setStyle(this.legendTr, 'display', 'none');

        this._currentTemplateInfo = {
          layoutOptions: {
            hasTitleText: false,
            hasCopyrightText: false,
            hasAuthorText: false,
            hasLegend: false
          }
        };
      } else {
        html.setStyle(this.authorTr, 'display', '');
        html.setStyle(this.copyrightTr, 'display', '');
        html.setStyle(this.titleTr, 'display', '');
        html.setStyle(this.legendTr, 'display', '');
        this._currentTemplateInfo = {
          layoutOptions: {
            hasTitleText: true,
            hasCopyrightText: true,
            hasAuthorText: true,
            hasLegend: true
          }
        };
      }
    },

    _getMapAttribution: function () {
      var attr = this.map.attribution;
      if (attr && attr.domNode) {
        return html.getProp(attr.domNode, 'textContent');
      } else {
        return "";
      }
    },

    closeSettings: function () {
      popup.close(this.settingsDialog);
      this._showSettings = false;
    },

    showSettings: function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (this._showSettings) {
        popup.close(this.settingsDialog);
        this._showSettings = false;
      } else {
        popup.open({
          popup: this.settingsDialog,
          around: this.advancedButtonDijit
        });
        this._showSettings = true;
      }
    },

    _handlePrintInfo: function (rData) {
      if (!rData.isGPPrint) {
        domStyle.set(this.layoutDijit.domNode.parentNode.parentNode, 'display', 'none');
        domStyle.set(this.formatDijit.domNode.parentNode.parentNode, 'display', 'none');
        domStyle.set(this.advancedButtonDijit, 'display', 'none');
      } else {
        var data = rData.data;
        domStyle.set(this.layoutDijit.domNode.parentNode.parentNode, 'display', '');
        domStyle.set(this.formatDijit.domNode.parentNode.parentNode, 'display', '');
        domStyle.set(this.advancedButtonDijit, 'display', '');

        this.own(on(document.body, 'click', lang.hitch(this, function (event) {
          if (!this._showSettings) {
            return;
          }
          var target = event.target || event.srcElement;
          var node = this.settingsDialog.domNode;
          var isInternal = target === node || html.isDescendant(target, node);
          if (!isInternal) {
            popup.close(this.settingsDialog);
            this._showSettings = false;
          }
        })));
        // if (this.showAdvancedOption) {
        //   domStyle.set(this.advancedButtonDijit.domNode, 'display', '');
        // } else {
        //   domStyle.set(this.advancedButtonDijit.domNode, 'display', 'none');
        // }
        var Layout_Template = array.filter(data.parameters, function (param) {
          return param.name === "Layout_Template";
        });
        if (Layout_Template.length === 0) {
          console.log("print service parameters name for templates must be \"Layout_Template\"");
          return;
        }
        var layoutItems = array.map(Layout_Template[0].choiceList, function (item) {
          return {
            label: item,
            value: item
          };
        });
        layoutItems.sort(function (a, b) {
          return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
        });
        if (layoutItems.length > 0) {
          this.layoutDijit.addOption(layoutItems);
          if (this.defaultLayout) {
            this.layoutDijit.set('value', this.defaultLayout);
          } else {
            this.layoutDijit.set('value', Layout_Template[0].defaultValue);
          }
        } else if (this.defaultLayout) {
          this.layoutDijit.addOption([{
            label: this.defaultLayout,
            value: this.defaultLayout
          }]);
          this.layoutDijit.set('value', this.defaultLayout);
        }

        var Format = array.filter(data.parameters, function (param) {
          return param.name === "Format";
        });
        if (Format.length === 0) {
          console.log("print service parameters name for format must be \"Format\"");
          return;
        }
        var formatItems = array.map(Format[0].choiceList, function (item) {
          return {
            label: item,
            value: item
          };
        });
        formatItems.sort(function (a, b) {
          return (a.label > b.label) ? 1 : ((b.label > a.label) ? -1 : 0);
        });
        if (formatItems.length > 0) {
          this.formatDijit.addOption(formatItems);
          if (this.defaultFormat) {
            this.formatDijit.set('value', this.defaultFormat);
          } else {
            this.formatDijit.set('value', Format[0].defaultValue);
          }
        } else if (this.defaultFormat) {
          this.formatDijit.addOption([{
            label: this.defaultFormat,
            value: this.defaultFormat
          }]);
          this.formatDijit.set('value', this.defaultFormat);
        }
      }
    },

    //Click Button Print
    beforePrint: function () {
      if (this.printSettingsFormDijit.isValid()) {
        this._printWithGridLayout();
      } else {
        this.printSettingsFormDijit.validate();
      }
    },

    print: function () {
      if (this.printSettingsFormDijit.isValid()) {
        var form = this.printSettingsFormDijit.get('value');
        lang.mixin(form, this.layoutMetadataDijit.get('value'));
        lang.mixin(form, this.forceAttributesFormDijit.get('value'));
        lang.mixin(form, this.labelsFormDijit.get('value'));
        this.preserve = this.preserveFormDijit.get('value');
        lang.mixin(form, this.preserve);
        this.layoutForm = this.layoutFormDijit.get('value');
        var mapQualityForm = this.mapQualityFormDijit.get('value');
        var mapOnlyForm = this.mapOnlyFormDijit.get('value');
        lang.mixin(mapOnlyForm, mapQualityForm);

        var elementsObj = this.customTextElementsDijit.get('value');
        var cteArray = [], hasDate = false, locale = dojoConfig.locale || 'en';
        for (var p in elementsObj) {
          var cte = {};
          if (p === 'Date') {
            hasDate = true;
          }
          cte[p] = elementsObj[p];
          cteArray.push(cte);
        }
        if (!hasDate) {
          cteArray.push({ Date: new Date().toLocaleString(locale) });
        }

        var templateInfo = this._currentTemplateInfo;
        var hasAuthorText = lang.getObject('layoutOptions.hasAuthorText', false, templateInfo);
        var hasCopyrightText = lang.getObject('layoutOptions.hasCopyrightText',
          false, templateInfo);
        var hasTitleText = lang.getObject('layoutOptions.hasTitleText', false, templateInfo);

        var template = new PrintTemplate();
        // template.format = form.format;
        // template.layout = form.layout;
        template.format = "PDF";
        template.layout = "A3 Landscape";
        template.preserveScale = (form.preserveScale === 'true' || form.preserveScale === 'force');
        if (form.preserveScale === 'force') {
          template.outScale = this.preserve.forcedScale > 0 ? this.preserve.forcedScale : this.map.getScale();
        }
        template.forceFeatureAttributes = form.forceFeatureAttributes && form.forceFeatureAttributes[0];
        template.label = form.title;
        template.exportOptions = mapOnlyForm;
        template.showLabels = form.showLabels && form.showLabels[0];
        template.layoutOptions = {
          authorText: hasAuthorText ? form.author : "",
          copyrightText: hasCopyrightText ? (form.copyright || this._getMapAttribution()) : "",
          legendLayers: this._getLegendLayers(), // fix issue 7744
          titleText: hasTitleText ? form.title : "",
          customTextElements: cteArray,
          scalebarUnit: this.layoutForm.scalebarUnit
        };
        template.exportOptions = {
          width: 1104,
          height: 410
        };
        // template.format = "PDF";

        this.printparams.template = template;
        this.printparams.extraParameters = { // come from source code of jsapi
          printFlag: true
        };
        // reset outSpatialReference
        this.printparams.outSpatialReference = undefined;
        var outWkid = +this.wkidInput.get('value');
        if (srUtils.isValidWkid(outWkid) && outWkid !== this.map.spatialReference.wkid) {
          this.printparams.outSpatialReference = new SpatialReference(outWkid);
        }
        var fileHandel = this.printTask.execute(this.printparams,  lang.hitch(this, function() {
          //Reset scale for layers
          let countLayerShowInMap = 0;  //index in listDefaultScales

          array.forEach(this.operLayerInfos.getLayerInfoArray(), function(layerInfo) {
            if (layerInfo.isShowInMap()) {
              layerInfo.setScaleRange(this.listDefaultScales[countLayerShowInMap], 0);
              countLayerShowInMap++;
            }
          }, this);
        }));

        var result = new printResultDijit({
          count: this.count.toString(),
          icon: (form.format === "PDF") ? this.pdfIcon : this.imageIcon,
          docName: form.title,
          title: form.title + ', ' + form.format + ', ' + form.layout,
          fileHandle: fileHandel,
          nls: this.nls
        }).placeAt(this.printResultsNode, 'last');
        result.startup();
        domStyle.set(this.clearActionBarNode, 'display', 'block');
        this.count++;
      } else {
        this.printSettingsFormDijit.validate();
      }

      // minimised map
      if (query(".lm_maximised").length !== 0) {
        query(".no-tabs").children().forEach(function (node) {
          if (domClass.contains(node, "lm_controls")) {
            query(".lm_maximise", node).forEach(function (nodeChild) {
              nodeChild.click();
            });
          }
        });
      }
    },

    _getLegendLayers: function () {
      var hasLegend = lang.getObject('layoutOptions.hasLegend', false, this._currentTemplateInfo);
      var enabledLegend = this.layoutForm.legend.length > 0 && this.layoutForm.legend[0];
      if (this.printTask && !this.printTask._createOperationalLayers) {
        // if don't have _createOptionalLayers function
        var legendLayers = [];
        if (hasLegend && enabledLegend) {
          var legends = arcgisUtils.getLegendLayers({ map: this.map, itemInfo: this.map.itemInfo });
          legendLayers = array.map(legends, function (legend) {
            return {
              layerId: legend.layer.id
            };
          });
        }

        return legendLayers;
      } else {
        return (hasLegend && enabledLegend) ? null : [];
      }
    },

    clearResults: function () {
      domConstruct.empty(this.printResultsNode);
      domStyle.set(this.clearActionBarNode, 'display', 'none');
      this.count = 1;
    },

    updateAuthor: function (user) {
      user = user || '';
      if (user && this.authorTB) {
        this.authorTB.set('value', user);
      }
    },

    getCurrentMapScale: function () {
      this.forceScaleNTB.set('value', this.map.getScale());
    }
  });

  // Print result dijit
  var printResultDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: printResultTemplate,
    url: null,
    postCreate: function () {
      this.inherited(arguments);
      this.progressBar.set('label', this.nls.creatingPrint);
      this.fileHandle.then(lang.hitch(this, '_onPrintComplete'), lang.hitch(this, '_onPrintError'));
    },
    _onPrintComplete: function (data) {
      if (data.url) {
        this.url = data.url;
        html.setStyle(this.progressBar.domNode, 'display', 'none');
        html.setStyle(this.successNode, 'display', 'inline-block');
        domClass.add(this.resultNode, "printResultHover");
      } else {
        this._onPrintError(this.nls.printError);
      }
    },
    _onPrintError: function (err) {
      console.log(err);
      html.setStyle(this.progressBar.domNode, 'display', 'none');
      html.setStyle(this.errNode, 'display', 'block');
      domClass.add(this.resultNode, "printResultError");

      html.setAttr(this.domNode, 'title', err.details || err.message || "");
    },
    _openPrint: function () {
      if (this.url !== null) {
        window.open(this.url);
      }
    },
  });
  return PrintDijit;
});