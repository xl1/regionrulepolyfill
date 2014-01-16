camelCaseToSnakeCase = (str) ->
  str.replace(/[A-Z]/g, (l) -> '-' + String.fromCharCode(l.charCodeAt(0) + 32))

getPrefixedProperty = (obj, prop, prefixes=['webkit', 'adobe', 'moz', 'ms']) ->
  props = [prop].concat (
    for prefix in prefixes
      prefix + prop[0].toUpperCase() + prop[1..]
  )
  for p in props
    switch typeof res = obj[p]
      when 'undefined'
        continue
      when 'function'
        return res.bind(obj)
      else
        return res
  return

checkContainment = (computed, style) ->
  for prop in Object.keys(style)
    expect(computed[prop]).toBe style[prop]
  return

check = (region, contentQuery, style) ->
  view = region.ownerDocument.defaultView
  getStyle = (e) -> view.getComputedStyle(e, '')
  switch view.Region.supportType
    when 'polyfill'
      for elem in region.querySelectorAll(contentQuery)
        checkContainment(getStyle(elem), style)
    when 'basic'
      for range in getPrefixedProperty(region, 'getRegionFlowRanges')()
        for elem in range.cloneContents().querySelectorAll(contentQuery)
          checkContainment(getStyle(elem), style)
    when 'full'
      '''
      Todo: Test region.getComputedRegionStyle(elem) contains style
      regionrulepolyfill has nothing to do if supportType is 'full',
      so I think this test is needless
      '''
  return


describe 'window.Region()', ->
  it 'should accept (selector:string) argment', ->
    expect(window.Region).not.toThrow('#region')

  describe 'addRegionRule()', ->
    ret = null
    beforeEach -> ret = window.Region('#region')

    it 'should accept (selector:string, style:string) argument', ->
      expect(ret.addRegionRule).not.toThrow('#content', 'margin-left: 10px;')

    it 'should accept (selector:string, style:object) argument', ->
      expect(ret.addRegionRule).not.toThrow('#content', { backgroundColor: 'red' })

    it 'should allow method chains', ->
      expect(ret.addRegionRule('#content', '')).toBe ret

describe 'Region.supportType', ->
  it 'should be "polyfill", "basic" or "full" (or "none")', ->
    expect(['polyfill', 'basic', 'full']).toContain window.Region.supportType

describe 'basic:', ->
  ifr = document.createElement 'iframe'
  ifr.width = ifr.height = 800
  ifr.src = '/demo/basic.html'
  ifr.onload = ->
    @loaded = true
 
   it 'test style of .intro::region(p)', ->
    runs ->
      document.body.appendChild(ifr)
    waitsFor 500, -> ifr.loaded
    runs ->
      intro = ifr.contentDocument.getElementsByClassName('intro')[0]
      check intro, 'p', {
        fontSize: '20px'
      }

  it 'test style of .outro::region(p)', ->
    outro = ifr.contentDocument.getElementsByClassName('outro')[0]
    check outro, 'p', {
      textDecoration: 'underline',
      marginRight: '50px'
    }

  it 'all regions should fit', ->
    flow = getPrefixedProperty(ifr.contentDocument, 'getNamedFlows')()[0]
    if Region.supportType is 'polyfill'
      expect(flow.overset).toBe false
    else
      for region in flow.getRegions()
        expect(getPrefixedProperty(region, 'regionOverset')).toBe 'fit'
    return
