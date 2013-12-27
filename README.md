# ::region() pseudo element polyfill

An (incomplete) polyfill of [`::region()` functional pseudo element](http://www.w3.org/TR/css3-regions/#the-region-pseudo-element).
Work in progress.

## Usage

```html
<script src="path/to/regionrulepolyfill.js"></script>
<script>
Region('#region1').addRegionRule('p', {
  color: 'red',
  backgroundColor: 'green'
});
Region('#region2').addRegionRule('h1', 'margin-right: 100px;');
</script>
```

## Dependencies

In environments without basic CSS Regions supports, this polyfill works on [Adobe's CSS Regions Polyfill](http://adobe-webplatform.github.io/css-regions-polyfill).

## Lisence

MIT
