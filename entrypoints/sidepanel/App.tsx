import Download from 'reicon-react/icons/Download';
import ImageIcon from 'reicon-react/icons/Image';
import Palette from 'reicon-react/icons/Palette';
import Refresh from 'reicon-react/icons/Refresh';
import Search from 'reicon-react/icons/Search';
import TypeIcon from 'reicon-react/icons/Text';
import Code from 'reicon-react/icons/Code';
import Copy from 'reicon-react/icons/Copy';
import Moon from 'reicon-react/icons/Moon';
import Sun from 'reicon-react/icons/Sun';
import { useEffect, useMemo, useState } from 'react';
import { applyTheme, storedTheme, type Theme } from '@/lib/theme';
import type { ImageAsset, ScanResult, SvgAsset } from '@/lib/types';

type Tab = 'images' | 'svgs' | 'colors' | 'fonts';
const tabs: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: 'images', label: 'Images', icon: ImageIcon }, { id: 'svgs', label: 'SVGs', icon: Code },
  { id: 'colors', label: 'Colors', icon: Palette }, { id: 'fonts', label: 'Fonts', icon: TypeIcon },
];
const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '') || 'asset';
const safeFolder = (name: string) => name.trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_|_$/g, '') || 'website';
const svgUrl = (markup: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const MIN_PASTE_SIZE = 256;

const pngBlob = async (asset: ImageAsset) => {
  const bitmap = await createImageBitmap(await (await fetch(asset.url)).blob());
  const crop = asset.crop ?? { x: 0, y: 0, width: bitmap.width, height: bitmap.height };
  const canvas = new OffscreenCanvas(crop.width, crop.height);
  canvas.getContext('2d')?.drawImage(bitmap, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  bitmap.close();
  return canvas.convertToBlob({ type: 'image/png' });
};
const croppedUrl = async (asset: ImageAsset) => (asset.crop ? URL.createObjectURL(await pngBlob(asset)) : asset.url);
const svgPngBlob = async (asset: SvgAsset) => {
  const image = new Image();
  image.src = svgUrl(asset.markup);
  await image.decode();
  const width = asset.width || image.naturalWidth || MIN_PASTE_SIZE;
  const height = asset.height || image.naturalHeight || MIN_PASTE_SIZE;
  // shortcut: icons drawn below MIN_PASTE_SIZE are upscaled so a pasted raster is usable; drop the scale for pixel-exact copies.
  const scale = Math.max(1, MIN_PASTE_SIZE / Math.max(width, height));
  const canvas = new OffscreenCanvas(Math.round(width * scale), Math.round(height * scale));
  canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.convertToBlob({ type: 'image/png' });
};
const writeClipboard = async (text: string, raster?: () => Promise<Blob>) => {
  if (raster) {
    try {
      // Paste-ready: apps that accept images (Figma, Slack, Docs) take the PNG, code editors take the text.
      await navigator.clipboard.write([new ClipboardItem({
        'text/plain': new Blob([text], { type: 'text/plain' }),
        'image/png': await raster(),
      })]);
      return;
    } catch { /* Raster copy is best-effort; fall through to text. */ }
  }
  await navigator.clipboard.writeText(text);
};

export default function App() {
  const [data, setData] = useState<ScanResult>();
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('images');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');
  const [theme, setTheme] = useState<Theme>(storedTheme);

  useEffect(() => { applyTheme(theme); }, [theme]);

  const scan = async () => {
    setError(''); setData(undefined); setSelected(new Set());
    try {
      const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!active?.id) throw new Error();
      setData(await chrome.tabs.sendMessage(active.id, { type: 'SCAN_PAGE' }));
    } catch { setError('PagePluck cannot scan this page. Refresh a regular website and try again.'); }
  };
  useEffect(() => { void scan(); }, []);
  const filteredImages = useMemo(() => data?.images.filter((asset) => `${asset.name} ${asset.url}`.toLowerCase().includes(query.toLowerCase())) ?? [], [data, query]);
  const folder = `${safeFolder(data?.page.title.split(/[|—]/)[0] || data?.page.host || 'website')}_assets`;
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const saveUrl = (url: string, name: string, saveAs = false) => chrome.downloads.download({ url, filename: `${folder}/${safeName(name)}`, saveAs, conflictAction: 'uniquify' });
  const saveImage = async (asset: ImageAsset, saveAs = false) => saveUrl(await croppedUrl(asset), asset.name, saveAs);
  const saveSvg = (asset: SvgAsset, saveAs = false) => saveUrl(svgUrl(asset.markup), `${safeName(asset.name)}.svg`, saveAs);
  const copy = async (message: string, text: string, raster?: () => Promise<Blob>) => {
    try { await writeClipboard(text, raster); setNotice(message); }
    catch { setNotice('Clipboard is blocked here. Keep the panel focused and retry.'); }
  };
  const copyImage = (asset: ImageAsset) => copy(`${asset.name} copied — paste it anywhere`, asset.url, () => pngBlob(asset));
  const copySvg = (asset: SvgAsset) => copy(`${asset.name} copied — paste it anywhere`, asset.markup, () => svgPngBlob(asset));
  const downloadSelected = async () => {
    if (!data) return;
    const assets = tab === 'images' ? data.images.filter(({ id }) => selected.has(id)) : data.svgs.filter(({ id }) => selected.has(id));
    for (const asset of assets) await (tab === 'images' ? saveImage(asset as ImageAsset) : saveSvg(asset as SvgAsset));
    setNotice(`${assets.length} asset${assets.length === 1 ? '' : 's'} saved to Downloads/${folder}`);
  };
  const downloadAll = async () => {
    if (!data) return;
    for (const asset of data.images) await saveImage(asset);
    for (const asset of data.svgs) await saveSvg(asset);
    setNotice(`${data.images.length + data.svgs.length} assets saved to Downloads/${folder}`);
  };
  const selectable = tab === 'images' ? filteredImages : data?.svgs ?? [];
  const allSelected = selectable.length > 0 && selectable.every(({ id }) => selected.has(id));
  const toggleAll = () => setSelected((current) => {
    const next = new Set(current);
    allSelected ? selectable.forEach(({ id }) => next.delete(id)) : selectable.forEach(({ id }) => next.add(id));
    return next;
  });

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><img src="/icon/32.png" alt="" /><div><span>PagePluck</span><small>Asset exporter</small></div></div>
      <div className="topbar-actions">
        <button className="icon-button" onClick={scan} aria-label="Rescan page" title="Rescan"><Refresh size={18} /></button>
        <button className="icon-button theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>

    {data && <>
      <section className="page-summary">
        <div><p className="eyebrow">Current page</p><h1>{data.page.title}</h1><p className="host">{data.page.host}</p></div>
        <button className="primary-button" onClick={downloadAll}><Download size={16} /> Download all</button>
      </section>
      <nav className="tabs" aria-label="Asset types">{tabs.map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setSelected(new Set()); }}><Icon size={17} /><span>{label}</span><b>{data[id].length}</b></button>)}</nav>
    </>}

    {error && <section className="state error" role="alert">{error}</section>}
    {!data && !error && <section className="state" role="status"><span className="spinner" />Scanning this page…</section>}
    {notice && <button className="notice" onClick={() => setNotice('')} aria-label="Dismiss notification">{notice}</button>}

    {data && <section className="content">
      {(tab === 'images' || tab === 'svgs') && <div className="asset-tools">
        <label className="select-all"><input type="checkbox" checked={allSelected} onChange={toggleAll} /> Select all</label>
        <button className="secondary-button" disabled={!selected.size} onClick={downloadSelected}><Download size={15} /> Download selected ({selected.size})</button>
      </div>}

      {tab === 'images' && <>
        <label className="search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search images" /></label>
        <div className="asset-grid">{filteredImages.map((asset) => <article className={`asset-card ${selected.has(asset.id) ? 'selected' : ''}`} key={asset.id}>
          <label className="check"><input type="checkbox" checked={selected.has(asset.id)} onChange={() => toggle(asset.id)} aria-label={`Select ${asset.name}`} /><span /></label>
          <div className="preview checker" onDoubleClick={() => void copyImage(asset)} title="Double-click to copy">
            {asset.crop ? <span className="sprite-preview" style={{ width: asset.crop.width, height: asset.crop.height, backgroundImage: `url(${JSON.stringify(asset.url)})`, backgroundPosition: `-${asset.crop.x}px -${asset.crop.y}px` }} /> : <img src={asset.url} alt="" loading="lazy" />}
          </div>
          <div className="asset-meta"><strong title={asset.name}>{asset.name}</strong><span>{asset.width || '—'} × {asset.height || '—'} · {asset.kind}</span></div>
          <div className="card-actions">
            <button className="card-action" onClick={() => void copyImage(asset)} aria-label={`Copy ${asset.name}`} title="Copy to clipboard"><Copy size={14} /> Copy</button>
            <button className="card-action" onClick={() => void saveImage(asset, true)} aria-label={`Save ${asset.name}`}><Download size={14} /> Save</button>
          </div>
        </article>)}</div>
        {!filteredImages.length && <Empty label="No images found" />}
      </>}

      {tab === 'svgs' && <>
        <div className="asset-grid">{data.svgs.map((asset) => <article className={`asset-card ${selected.has(asset.id) ? 'selected' : ''}`} key={asset.id}>
          <label className="check"><input type="checkbox" checked={selected.has(asset.id)} onChange={() => toggle(asset.id)} aria-label={`Select ${asset.name}`} /><span /></label>
          <div className="preview checker" onDoubleClick={() => void copySvg(asset)} title="Double-click to copy">
            <img src={svgUrl(asset.markup)} alt="" />
          </div>
          <div className="asset-meta"><strong title={asset.name}>{asset.name}</strong><span>{asset.width || '—'} × {asset.height || '—'}</span></div>
          <div className="card-actions">
            <button className="card-action" onClick={() => void copySvg(asset)} aria-label={`Copy ${asset.name} markup`} title="Copy SVG markup"><Copy size={14} /> Copy</button>
            <button className="card-action" onClick={() => saveSvg(asset, true)} aria-label={`Save ${asset.name}`}><Download size={14} /> Save</button>
          </div>
        </article>)}</div>
        {!data.svgs.length && <Empty label="No SVGs found" />}
      </>}

      {tab === 'colors' && <div className="color-list">{data.colors.map((color) => <button key={color.value} onClick={() => void copy(`${color.hex} copied to clipboard`, color.hex)} title={`Copy ${color.hex}`}><span className="swatch" style={{ backgroundColor: color.value }} /><span><strong>{color.hex}</strong><small>{color.value}</small></span><b>{color.count} uses</b></button>)}</div>}

      {tab === 'fonts' && <div className="font-list">{data.fonts.map((font) => <article className="font-card" key={font.family}>
        <button className="font-copy" onClick={() => void copy(`“${font.family}” copied to clipboard`, font.family)} title={`Copy “${font.family}”`}>
          <span className="font-head"><strong>{font.family}</strong><span>{font.count} elements</span></span>
          <span className="font-sample" style={{ fontFamily: font.family }}>Aa Bb Cc — 0123456789</span>
          <span className="font-hint"><Copy size={12} /> Click to copy the family name</span>
        </button>
        {font.source && <a href={font.source} download>Font source</a>}
      </article>)}</div>}
    </section>}
    <footer>Runs locally · Nothing is uploaded</footer>
  </main>;
}

function Empty({ label }: { label: string }) { return <div className="empty"><ImageIcon size={24} /><p>{label}</p></div>; }
