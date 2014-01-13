camelCaseToSnakeCase = (str) ->
  str.replace(/[A-Z]/g, (l) -> '-' + String.fromCharCode(l.charCodeAt(0) + 32))

randint = (max) ->
  Math.random() * (max + 1) |0

getPrefixedProperty = (obj, prop, prefixes=['webkit', 'adobe', 'moz', 'ms']) ->
  if obj[prop]?
    return prop
  else for prefix in prefixes
    prefixedProp = prefix + prop[0].toUpperCase() + prop[1..]
    if obj[prefixedProp]?
      return prefixedProp
  return

prefixed = {}
prefixedRegionfragmentchangeEventNames = [
  'webkitregionlayoutupdate'
  'adoberegionlayoutupdate'
  'regionlayoutupdate'
  'webkitregionfragmentchange'
  'adoberegionfragmentchange'
  'mozregionfragmentchange'
  'msregionfragmentchange'
  'regionfragmentchange'
]
supportType =
  if getPrefixedProperty(Element::, 'getComputedRegionStyle')?
    'full'
  else if getPrefixedProperty(document, 'getNamedFlows')?
    'basic'
  else if window.CSSRegions?
    'polyfill'
  else
    console.warn 'CSS Regions is not supported.'
    'none'

window.addEventListener 'load', ->
  prefixed =
    getRegionFlowRanges:
      getPrefixedProperty(Element::, 'getRegionFlowRanges')
    matches:
      getPrefixedProperty(Element::, 'matchesSelector') or
      getPrefixedProperty(Element::, 'matches')
    getNamedFlows:
      getPrefixedProperty(document, 'getNamedFlows')
, false

RegionRulePolyfill =
  sheet: document.head.appendChild(document.createElement 'style').sheet
  insertCSS: (selector, style) ->
    if typeof style isnt 'string'
      style = (for p in Object.keys(style)
        "#{camelCaseToSnakeCase(p)}: #{style[p]};"
      ).join('\n')
    @sheet.insertRule "#{selector} {\n#{style}}", @sheet.cssRules.length

  handler: {}
  init: ->
    @sortNamedFlows()
    for flow in @namedFlows
      @update(flow)
      handler = @handler[flow.name] = @registerTimer.bind(@, flow)
      for eventName in prefixedRegionfragmentchangeEventNames
        flow.addEventListener eventName, handler, false
    return

  namedFlows: []
  sortNamedFlows: ->
    @namedFlows = []
    visited = {}
    flows = document[prefixed.getNamedFlows]()
    for flow in flows
      do (flow=flow) =>
        return if visited[flow.name]
        visited[flow.name] = true
        contents = flow.getContent()
        for f in flows when not visited[f.name]
          for region in f.getRegions()
            for content in contents
              c = region.compareDocumentPosition(content)
              if (c is 0) or (c & Node.DOCUMENT_POSITION_CONTAINED_BY)
                arguments.callee(f)
        @namedFlows.push(flow)
    return

  willUpdate: {}
  timer: null
  registerTimer: (flow, event) ->
    @willUpdate[flow.name] = true
    @timer or= setTimeout =>
      for f in @namedFlows when @willUpdate[f.name]
        @willUpdate[f.name] = false
        @update(f, event)
      @timer = null
    , 50

  update: (flow, event) ->
    if event
      flow.removeEventListener event.type, @handler[flow.name], false
    for rule in @rules
      @applyStyleInFlow(flow, rule)
    if event
      setTimeout =>
        flow.addEventListener event.type, @handler[flow.name], false
      , 1

  rules: []
  registerRule: (regionSelector, contentSelector, style) ->
    ruleSelector = switch supportType
      when 'full'
        "#{regionSelector}::region(#{contentSelector})"
      when 'basic'
        className = '__INSERTED__' + randint(9999999)
        @rules.push { regionSelector, contentSelector, className }
        '.' + className
      when 'polyfill'
        regionSelector + ' ' + contentSelector
    @insertCSS(ruleSelector, style)

  applyStyleInFlow: (flow, { regionSelector, contentSelector, className }) ->
    regions = []
    for r in flow.getRegions()
      if r[prefixed.matches](regionSelector)
        regions.push(r)
      regions.push r.querySelectorAll(regionSelector)...
    if regions.length is 0
      return
    for content in flow.getContent()
      # reset styles
      content.classList.remove(className)
      for elem in content.getElementsByClassName(className)
        elem.classList.remove(className)
      # apply styles
      elems = []
      if content[prefixed.matches](contentSelector)
        elems.push content
      elems.push content.querySelectorAll(contentSelector)...
      for elem in elems
        for region in regions
          @applyStyleInRegion(region, elem, className)
    return

  getRange: (region, idx) ->
    region[prefixed.getRegionFlowRanges]()[idx]

  applyStyleInRegion: (region, elem, className) ->
    i = 0
    while true
      range = @getRange(region, i)
      break unless range

      comp = @compare(range, elem)
      if comp.etos >= 0
        break
      if comp.stoe <= 0
        i++
        continue # next range

      # apply style
      targetRange = range.cloneRange()
      if comp.stos < 0
        targetRange.setStartBefore(elem)
      targetRange.setEndAfter(elem)
      frag = targetRange.extractContents().firstChild
      frag.classList.add(className)
      targetRange.insertNode(frag)

      # reset if overset
      range = @getRange(region, i)
      break unless range

      comp = @compare(range, elem)
      if comp.etoe < 0
        targetRange = document.createRange()
        targetRange.setStart(range.endContainer, range.endOffset)
        targetRange.setEndAfter(frag)
        frag = targetRange.extractContents().lastChild
        console.assert frag.classList.contains className
        frag.classList.remove className
        targetRange.insertNode(frag)
      i++
    return

  compare: (range, elem) ->
    target = document.createRange()
    target.selectNode(elem)
    stoe = range.compareBoundaryPoints(range.START_TO_END, target)
    stos = range.compareBoundaryPoints(range.START_TO_START, target)
    etoe = range.compareBoundaryPoints(range.END_TO_END, target)
    etos = range.compareBoundaryPoints(range.END_TO_START, target)
    target.detach()
    { stoe, stos, etoe, etos }


window.addEventListener 'load', ->
  RegionRulePolyfill.init()
, false
window.Region = (regionSelector) ->
  addRegionRule: (contentSelector, style) ->
    RegionRulePolyfill.registerRule(regionSelector, contentSelector, style)
    @
