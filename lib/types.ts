export type ImageAsset = {
  id: string;
  url: string;
  name: string;
  kind: 'image' | 'background';
  width: number;
  height: number;
  crop?: { x: number; y: number; width: number; height: number };
};
export type SvgAsset = { id: string; markup: string; name: string; width: number; height: number };
export type FontAsset = { family: string; count: number; source?: string };
export type ColorAsset = { value: string; hex: string; count: number };
export type ScanResult = {
  page: { title: string; url: string; host: string };
  images: ImageAsset[];
  svgs: SvgAsset[];
  fonts: FontAsset[];
  colors: ColorAsset[];
};
