// Generated by CoffeeScript 1.6.3
(function() {
  var RegionNode, camelCaseToSnakeCase, getPrefixedProperty, prefixed, prefixedRegionfragmentchangeEventNames, randint, supportType;

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

  RegionNode = (function() {
    RegionNode.prototype.insertCSS = (function() {
      var sheet;
      sheet = document.head.appendChild(document.createElement('style')).sheet;
      return function(selector, style) {
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
        return sheet.insertRule("" + selector + " {\n" + style + "}", sheet.cssRules.length);
      };
    })();

    function RegionNode(regionSelector) {
      this.regionSelector = regionSelector;
      this.rules = [];
      this.timer = {};
      this.handler = {};
      if (supportType === 'basic') {
        if (document.readyState === 'complete') {
          this.initialize();
        } else {
          window.addEventListener('load', this.initialize.bind(this), false);
        }
      }
    }

    RegionNode.prototype.initialize = function() {
      var eventName, flow, handler, _i, _j, _len, _len1, _ref;
      _ref = document[prefixed.getNamedFlows]();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        flow = _ref[_i];
        this.update(flow);
        handler = this.handler[flow.name] = this.update.bind(this, flow);
        for (_j = 0, _len1 = prefixedRegionfragmentchangeEventNames.length; _j < _len1; _j++) {
          eventName = prefixedRegionfragmentchangeEventNames[_j];
          flow.addEventListener(eventName, handler, false);
        }
      }
      return this;
    };

    RegionNode.prototype.update = function(flow, event) {
      var _base, _name,
        _this = this;
      (_base = this.timer)[_name = flow.name] || (_base[_name] = setTimeout(function() {
        var rule, _i, _len, _ref;
        if (event) {
          flow.removeEventListener(event.type, _this.handler[flow.name], false);
        }
        _ref = _this.rules;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          rule = _ref[_i];
          _this.applyStyleInFlow(flow, rule.selector, rule.className);
        }
        _this.timer[flow.name] = null;
        if (event) {
          return setTimeout(function() {
            return flow.addEventListener(event.type, _this.handler[flow.name], false);
          }, 1);
        }
      }, 50));
      return this;
    };

    RegionNode.prototype.addRegionRule = function(selector, style) {
      var className, ruleSelector;
      ruleSelector = (function() {
        switch (supportType) {
          case 'full':
            return "" + this.regionSelector + "::region(" + selector + ")";
          case 'basic':
            className = '__INSERTED__' + randint(9999999);
            this.rules.push({
              selector: selector,
              className: className
            });
            return '.' + className;
          case 'polyfill':
            return "" + this.regionSelector + " " + selector;
        }
      }).call(this);
      this.insertCSS(ruleSelector, style);
      return this;
    };

    RegionNode.prototype.applyStyleInFlow = function(flow, contentSelector, className) {
      var content, elem, elems, r, region, regions, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref2;
      regions = [];
      _ref = flow.getRegions();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        r = _ref[_i];
        if (r[prefixed.matches](this.regionSelector)) {
          regions.push(r);
        }
        regions.push.apply(regions, r.querySelectorAll(this.regionSelector));
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
      return this;
    };

    RegionNode.prototype.getRange = function(region, idx) {
      return region[prefixed.getRegionFlowRanges]()[idx];
    };

    RegionNode.prototype.applyStyleInRegion = function(region, elem, className) {
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
        elem.classList.add(className);
        targetRange = range.cloneRange();
        if (comp.stos < 0) {
          targetRange.setStartBefore(elem);
        }
        targetRange.setEndAfter(elem);
        frag = targetRange.extractContents().firstChild;
        frag.classList.add(className);
        targetRange.insertNode(frag);
        range = this.getRange(region, i);
        comp = this.compare(range, elem);
        console.assert(comp.stos <= 0);
        console.assert(comp.stoe >= 0);
        if (comp.etoe < 0) {
          elem.classList.remove(className);
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
      return this;
    };

    RegionNode.prototype.compare = function(range, elem) {
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
    };

    return RegionNode;

  })();

  window.Region = function(s) {
    return new RegionNode(s);
  };

}).call(this);
