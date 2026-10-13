export interface RenderOptions {
  enableCSS?: boolean;
  enableImages?: boolean;
  enableBackgrounds?: boolean;
  enableShadows?: boolean;
  enableFonts?: boolean;
}

export interface RPAOptions {
  renderOptions?: RenderOptions;
  cacheTTL?: number;
  enableLogs?: boolean;
  logPath?: string;
}
