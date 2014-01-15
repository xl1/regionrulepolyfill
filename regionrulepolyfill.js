// Generated by CoffeeScript 1.6.3
(function() {
  var RegionRulePolyfill, camelCaseToSnakeCase, getPrefixedProperty, prefixed, prefixedRegionfragmentchangeEventNames, randint, supportType;

  camelCaseToSnakeCase = function(str) {
    return str.replace(/[A-Z]/g, function(l) {
      return '-' + String.fromCharCode(l.charCodeAt(0) + 32);
    });
  };

  randint = function(max) {
    return Math.random() * (max + 1) | 0;
  };

  getPrefixedProperty = function(obj, prop, prefixes) {
    var prefix, prefixedProp, _i, _len;
    if (prefixes == null) {
      prefixes = ['webkit', 'adobe', 'moz', 'ms'];
    }
    if (obj[prop] != null) {
      return prop;
    } else {
      for (_i = 0, _len = prefixes.length; _i < _len; _i++) {
        prefix = prefixes[_i];
        prefixedProp = prefix + prop[0].toUpperCase() + prop.slice(1);
        if (obj[prefixedProp] != null) {
          return prefixedProp;
        }
      }
    }
  };

  prefixed = {};

  prefixedRegionfragmentchangeEventNames = ['webkitregionlayoutupdate', 'adoberegionlayoutupdate', 'regionlayoutupdate', 'webkitregionfragmentchange', 'adoberegionfragmentchange', 'mozregionfragmentchange', 'msregionfragmentchange', 'regionfragmentchange'];

  supportType = getPrefixedProperty(Element.prototype, 'getComputedRegionStyle') != null ? 'full' : getPrefixedProperty(document, 'getNamedFlows') != null ? 'basic' : window.CSSRegions != null ? 'polyfill' : (console.warn('CSS Regions is not supported.'), 'none');

  window.addEventListener('load', function() {
    return prefixed = {
      getRegionFlowRanges: getPrefixedProperty(Element.prototype, 'getRegionFlowRanges'),
      matches: getPrefixedProperty(Element.prototype, 'matchesSelector') || getPrefixedProperty(Element.prototype, 'matches'),
      getNamedFlows: getPrefixedProperty(document, 'getNamedFlows')
    };
  }, false);

  RegionRulePolyfill = {
    sheet: document.head.appendChild(document.createElement('style')).sheet,
    insertCSS: function(selector, style) {
      var p;
      if (typeof style !== 'string') {
        style = ((function() {
          var _i, _len, _ref, _results;
          _ref = Object.keys(style);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            p = _ref[_i];
            _results.push("" + (camelCaseToSnakeCase(p)) + ": " + style[p] + ";");
          }
          return _results;
        })()).join('\n');
      }
      return this.sheet.insertRule("" + selector + " {\n" + style + "}", this.sheet.cssRules.length);
    },
    handler: {},
    init: function() {
      var eventName, flow, handler, _i, _j, _len, _len1, _ref;
      this.sortNamedFlows();
      _ref = this.namedFlows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        flow = _ref[_i];
        this.update(flow);
        handler = this.handler[flow.name] = this.registerTimer.bind(this, flow);
        for (_j = 0, _len1 = prefixedRegionfragmentchangeEventNames.length; _j < _len1; _j++) {
          eventName = prefixedRegionfragmentchangeEventNames[_j];
          flow.addEventListener(eventName, handler, false);
        }
      }
    },
    namedFlows: [],
    sortNamedFlows: function() {
      var flow, flows, visited, _fn, _i, _len,
        _this = this;
      this.namedFlows = [];
      visited = {};
      flows = document[prefixed.getNamedFlows]();
      _fn = function(flow) {
        var c, content, contents, f, region, _j, _k, _l, _len1, _len2, _len3, _ref;
        if (visited[flow.name]) {
          return;
        }
        visited[flow.name] = true;
        contents = flow.getContent();
        for (_j = 0, _len1 = flows.length; _j < _len1; _j++) {
          f = flows[_j];
          if (!visited[f.name]) {
            _ref = f.getRegions();
            for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
              region = _ref[_k];
              for (_l = 0, _len3 = contents.length; _l < _len3; _l++) {
                content = contents[_l];
                c = region.compareDocumentPosition(content);
                if ((c === 0) || (c & Node.DOCUMENT_POSITION_CONTAINED_BY)) {
                  arguments.callee(f);
                }
              }
            }
          }
        }
        return _this.namedFlows.push(flow);
      };
      for (_i = 0, _len = flows.length; _i < _len; _i++) {
        flow = flows[_i];
        _fn(flow);
      }
    },
    willUpdate: {},
    timer: null,
    registerTimer: function(flow, event) {
      var _this = this;
      this.willUpdate[flow.name] = true;
      return this.timer || (this.timer = setTimeout(function() {
        var f, _i, _len, _ref;
        _ref = _this.namedFlows;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          f = _ref[_i];
          if (!_this.willUpdate[f.name]) {
            continue;
          }
          _this.willUpdate[f.name] = false;
          _this.update(f, event);
        }
        return _this.timer = null;
      }, 50));
    },
    update: function(flow, event) {
      var rule, _i, _len, _ref,
        _this = this;
      if (event) {
        flow.removeEventListener(event.type, this.handler[flow.name], false);
      }
      _ref = this.rules;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        rule = _ref[_i];
        this.applyStyleInFlow(flow, rule);
      }
      if (event) {
        return setTimeout(function() {
          return flow.addEventListener(event.type, _this.handler[flow.name], false);
        }, 1);
      }
    },
    rules: [],
    registerRule: function(regionSelector, contentSelector, style) {
      var className, ruleSelector;
      ruleSelector = (function() {
        switch (supportType) {
          case 'full':
            return "" + regionSelector + "::region(" + contentSelector + ")";
          case 'basic':
            className = '__INSERTED__' + randint(9999999);
            this.rules.push({
              regionSelector: regionSelector,
              contentSelector: contentSelector,
              className: className
            });
            return '.' + className;
          case 'polyfill':
            return regionSelector + ' ' + contentSelector;
        }
      }).call(this);
      return this.insertCSS(ruleSelector, style);
    },
    applyStyleInFlow: function(flow, _arg) {
      var className, content, contentSelector, elem, elems, r, region, regionSelector, regions, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
      regionSelector = _arg.regionSelector, contentSelector = _arg.contentSelector, className = _arg.className;
      regions = [];
      _ref = flow.getRegions();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        r = _ref[_i];
        if (r[prefixed.matches](regionSelector)) {
          regions.push(r);
        }
        regions.push.apply(regions, r.querySelectorAll(regionSelector));
      }
      if (regions.length === 0) {
        return;
      }
      _ref1 = flow.getContent();
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        content = _ref1[_j];
        content.classList.remove(className);
        _ref2 = content.getElementsByClassName(className);
        for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
          elem = _ref2[_k];
          elem.classList.remove(className);
        }
        elems = [];
        if (content[prefixed.matches](contentSelector)) {
          elems.push(content);
        }
        elems.push.apply(elems, content.querySelectorAll(contentSelector));
        for (_l = 0, _len3 = elems.length; _l < _len3; _l++) {
          elem = elems[_l];
          for (_m = 0, _len4 = regions.length; _m < _len4; _m++) {
            region = regions[_m];
            this.applyStyleInRegion(region, elem, className);
          }
        }
      }
    },
    getRange: function(region, idx) {
      return region[prefixed.getRegionFlowRanges]()[idx];
    },
    applyStyleInRegion: function(region, elem, className) {
      var comp, frag, i, range, targetRange;
      i = 0;
      while (true) {
        range = this.getRange(region, i);
        if (!range) {
          break;
        }
        comp = this.compare(range, elem);
        if (comp.etos >= 0) {
          break;
        }
        if (comp.stoe <= 0) {
          i++;
          continue;
        }
        targetRange = range.cloneRange();
        if (comp.stos < 0) {
          targetRange.setStartBefore(elem);
        }
        targetRange.setEndAfter(elem);
        frag = targetRange.extractContents().firstChild;
        frag.classList.add(className);
        targetRange.insertNode(frag);
        range = this.getRange(region, i);
        if (!range) {
          break;
        }
        comp = this.compare(range, elem);
        if (comp.etoe < 0) {
          targetRange = document.createRange();
          targetRange.setStart(range.endContainer, range.endOffset);
          targetRange.setEndAfter(frag);
          frag = targetRange.extractContents().lastChild;
          console.assert(frag.classList.contains(className));
          frag.classList.remove(className);
          targetRange.insertNode(frag);
        }
        i++;
      }
    },
    compare: function(range, elem) {
      var etoe, etos, stoe, stos, target;
      target = document.createRange();
      target.selectNode(elem);
      stoe = range.compareBoundaryPoints(range.START_TO_END, target);
      stos = range.compareBoundaryPoints(range.START_TO_START, target);
      etoe = range.compareBoundaryPoints(range.END_TO_END, target);
      etos = range.compareBoundaryPoints(range.END_TO_START, target);
      target.detach();
      return {
        stoe: stoe,
        stos: stos,
        etoe: etoe,
        etos: etos
      };
    }
  };

  window.addEventListener('load', function() {
    return RegionRulePolyfill.init();
  }, false);

  window.Region = function(regionSelector) {
    return {
      addRegionRule: function(contentSelector, style) {
        RegionRulePolyfill.registerRule(regionSelector, contentSelector, style);
        return this;
      }
    };
  };

  window.Region.supportType = supportType;

}).call(this);
