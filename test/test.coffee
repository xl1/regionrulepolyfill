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
