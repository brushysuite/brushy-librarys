import * as csstree from 'css-tree';

export class CSSParser {
  parse(css: string) {
    return csstree.parse(css);
  }
}
