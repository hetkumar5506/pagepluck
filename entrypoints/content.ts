import type { ColorAsset, FontAsset, ImageAsset, ScanResult, SvgAsset } from '@/lib/types';

const MAX_ELEMENTS = 8_000;
const ranked = (values: string[]) => [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>())]
  .map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
const fileName = (url: string, fallback: string) => {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || fallback); }
  catch { return fallback; }
};
const toHex = (color: string) => {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  return channels?.length === 3 ? `#${channels.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}` : color;
};

function scan(): ScanResult {
  const elements = [...document.querySelectorAll<HTMLElement>('body *')].slice(0, MAX_ELEMENTS);
  const images = new Map<string, ImageAsset>();
  document.querySelectorAll<HTMLImageElement>('img').forEach((image, index) => {
    const url = image.currentSrc || image.src;
    if (url) images.set(url, { id: `image-${index}`, url, name: fileName(url, `image-${index + 1}.png`), kind: 'image', width: image.naturalWidth, height: image.naturalHeight });
  });
  document.querySelectorAll<HTMLVideoElement>('video[poster]').forEach((video, index) => {
    const url = video.poster;
    if (url) images.set(url, { id: `poster-${index}`, url, name: fileName(url, `poster-${index + 1}.jpg`), kind: 'image', width: video.videoWidth, height: video.videoHeight });
  });

  const styles = elements.map((element) => ({ element, style: getComputedStyle(element) }));
  const backgrounds = styles.flatMap(({ element, style }, elementIndex) => [...style.backgroundImage.matchAll(/url\(["']?(.+?)["']?\)/g)].map((match, imageIndex) => ({
    url: match[1], element, style, elementIndex, imageIndex,
  }))).filter(({ url, element }) => Boolean(url && element.clientWidth && element.clientHeight));
  const backgroundUses = backgrounds.reduce((counts, { url }) => {
    if (url) counts.set(url, (counts.get(url) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
  backgrounds.forEach(({ url, element, style, elementIndex, imageIndex }) => {
    if (!url) return;
    const isSprite = (backgroundUses.get(url) ?? 0) > 1;
    const x = Math.max(0, -(Number.parseFloat(style.backgroundPositionX) || 0));
    const y = Math.max(0, -(Number.parseFloat(style.backgroundPositionY) || 0));
    const id = `background-${elementIndex}-${imageIndex}`;
    const asset: ImageAsset = { id, url, name: isSprite ? `sprite-${elementIndex + 1}.png` : fileName(url, `background-${elementIndex + 1}.png`), kind: 'background', width: element.clientWidth, height: element.clientHeight };
    if (isSprite) asset.crop = { x, y, width: element.clientWidth, height: element.clientHeight };
    images.set(isSprite ? id : url, asset);
  });

  const svgs: SvgAsset[] = [...document.querySelectorAll<SVGSVGElement>('svg')].map((svg, index) => ({
    id: `svg-${index}`,
    markup: new XMLSerializer().serializeToString(svg),
    name: svg.getAttribute('aria-label')?.trim() || svg.id || `icon-${index + 1}`,
    width: Math.round(svg.getBoundingClientRect().width),
    height: Math.round(svg.getBoundingClientRect().height),
  }));
  const families = styles.map(({ style }) => style.fontFamily.split(',')[0]?.replace(/["']/g, '').trim()).filter((family): family is string => Boolean(family));
  const fontSources = new Map<string, string>();
  try {
    for (const sheet of document.styleSheets) for (const rule of [...sheet.cssRules]) if (rule instanceof CSSFontFaceRule) {
      const family = rule.style.fontFamily.replace(/["']/g, '').trim();
      const source = rule.style.getPropertyValue('src').match(/url\(["']?(.+?)["']?\)/)?.[1];
      if (family && source) fontSources.set(family, source);
    }
  } catch { /* Cross-origin stylesheets intentionally remain unreadable. */ }
  const fonts: FontAsset[] = ranked(families).map(({ value: family, count }) => ({ family, count, source: fontSources.get(family) }));
  const colorValues = styles.flatMap(({ style }) => [style.color, style.backgroundColor, style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor, style.fill, style.stroke])
    .filter((color) => color && color !== 'none' && color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent');
  const colors: ColorAsset[] = ranked(colorValues).slice(0, 64).map(({ value, count }) => ({ value, hex: toHex(value), count }));
  return { page: { title: document.title, url: location.href, host: location.hostname }, images: [...images.values()], svgs, fonts, colors };
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    browser.runtime.onMessage.addListener((message) => message?.type === 'SCAN_PAGE' ? Promise.resolve(scan()) : undefined);
  },
});
