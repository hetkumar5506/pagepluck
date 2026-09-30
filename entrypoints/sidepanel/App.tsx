import Download from 'reicon-react/icons/Download';
import ImageIcon from 'reicon-react/icons/Image';
import Palette from 'reicon-react/icons/Palette';
import Refresh from 'reicon-react/icons/Refresh';
import Search from 'reicon-react/icons/Search';
import TypeIcon from 'reicon-react/icons/Text';
import Code from 'reicon-react/icons/Code';
import { useEffect, useMemo, useState } from 'react';
import type { ImageAsset, ScanResult, SvgAsset } from '@/lib/types';

type Tab = 'images' | 'svgs' | 'colors' | 'fonts';
const tabs: { id: Tab; label: string; icon: typeof ImageIcon }[] = [
  { id: 'images', label: 'Images', icon: ImageIcon }, { id: 'svgs', label: 'SVGs', icon: Code },
  { id: 'colors', label: 'Colors', icon: Palette }, { id: 'fonts', label: 'Fonts', icon: TypeIcon },
];
const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-|-$/g, '') || 'asset';
const safeFolder = (name: string) => name.trim().replace(/[^a-z0-9_-]+/gi, '_').replace(/^_|_$/g, '') || 'website';
const svgUrl = (markup: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
const croppedUrl = async (asset: ImageAsset) => {
  if (!asset.crop) return asset.url;
  const bitmap = await createImageBitmap(await (await fetch(asset.url)).blob());
  const canvas = new OffscreenCanvas(asset.crop.width, asset.crop.height);
  canvas.getContext('2d')?.drawImage(bitmap, asset.crop.x, asset.crop.y, asset.crop.width, asset.crop.height, 0, 0, asset.crop.width, asset.crop.height);
  bitmap.close();
  return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/png' }));
};

export default function App() {
  const [data, setData] = useState<ScanResult>();
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('images');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState('');

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
      <button className="icon-button" onClick={scan} aria-label="Rescan page" title="Rescan"><Refresh size={18} /></button>
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
          <label className="check"><input type="checkbox" checked={selected.has(asset.id)} onChange={() => toggle(asset.id)} /><span /></label>
          <div className="preview checker">{asset.crop ? <span className="sprite-preview" style={{ width: asset.crop.width, height: asset.crop.height, backgroundImage: `url(${JSON.stringify(asset.url)})`, backgroundPosition: `-${asset.crop.x}px -${asset.crop.y}px` }} /> : <img src={asset.url} alt="" loading="lazy" />}</div>
          <div className="asset-meta"><strong title={asset.name}>{asset.name}</strong><span>{asset.width || '—'} × {asset.height || '—'} · {asset.kind}</span></div>
          <button className="save-one" onClick={() => void saveImage(asset, true)} aria-label={`Save ${asset.name}`}><Download size={15} /> Save</button>
        </article>)}</div>
        {!filteredImages.length && <Empty label="No images found" />}
      </>}

      {tab === 'svgs' && <div className="asset-grid svg-grid">{data.svgs.map((asset) => <article className={`asset-card ${selected.has(asset.id) ? 'selected' : ''}`} key={asset.id}>
        <label className="check"><input type="checkbox" checked={selected.has(asset.id)} onChange={() => toggle(asset.id)} /><span /></label>
        <div className="preview checker"><img src={svgUrl(asset.markup)} alt="" /></div>
        <div className="asset-meta"><strong>{asset.name}</strong><span>{asset.width || '—'} × {asset.height || '—'}</span></div>
        <button className="save-one" onClick={() => saveSvg(asset, true)}><Download size={15} /> Save</button>
      </article>)}</div>}

      {tab === 'colors' && <div className="color-list">{data.colors.map((color) => <button key={color.value} onClick={() => { void navigator.clipboard.writeText(color.hex); setNotice(`${color.hex} copied`); }}><span className="swatch" style={{ backgroundColor: color.value }} /><span><strong>{color.hex}</strong><small>{color.value}</small></span><b>{color.count} uses</b></button>)}</div>}

      {tab === 'fonts' && <div className="font-list">{data.fonts.map((font) => <article key={font.family}><div><strong>{font.family}</strong><span>{font.count} elements</span></div><p style={{ fontFamily: font.family }}>Aa Bb Cc — 0123456789</p>{font.source && <a href={font.source} download>Font source</a>}</article>)}</div>}
    </section>}
    <footer>Runs locally · Nothing is uploaded</footer>
  </main>;
}

function Empty({ label }: { label: string }) { return <div className="empty"><ImageIcon size={24} /><p>{label}</p></div>; }
