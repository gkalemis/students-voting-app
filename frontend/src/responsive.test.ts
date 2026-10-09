import {describe,it,expect} from 'vitest';
import fs from 'node:fs';
import viteConfig from '../vite.config';
describe('responsive shell',()=>{
 it('declares mobile viewport and Greek language',()=>{const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');expect(html).toContain('name="viewport"');expect(html).toContain('width=device-width');expect(html).toContain('lang="el"')});
 it('includes phone, tablet, safe-area and touch rules',()=>{const css=fs.readFileSync(new URL('./styles.css',import.meta.url),'utf8');expect(css).toContain('@media(max-width:900px)');expect(css).toContain('@media(max-width:700px)');expect(css).toContain('@media(max-width:420px)');expect(css).toContain('env(safe-area-inset-bottom)');expect(css).toContain('min-height:44px')});
 it('keeps compiled bundles separate from uploaded branding assets',()=>{expect(viteConfig.build?.assetsDir).toBe('static')});
 it('includes a touch-friendly language control',()=>{const css=fs.readFileSync(new URL('./extras.css',import.meta.url),'utf8');expect(css).toContain('.language');expect(css).toContain('white-space:nowrap')});
});
