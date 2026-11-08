import {readFileSync} from 'node:fs';
import {defineConfig} from 'vite';
import {viteSingleFile} from 'vite-plugin-singlefile';
const asset=name=>readFileSync(new URL('./src/ai/'+name,import.meta.url));
export default defineConfig({base:'./',plugins:[{name:'embedded-ai-runtime',transformIndexHtml:{order:'post',handler:html=>{
 const safe=s=>s.replace(/<\/script/gi,'<\\/script');
 return html.replace('</head>',()=>'<script>'+safe(asset('ort.wasm.min.js').toString())+'</script><script type="text/plain" id="wasm-module">'+safe(asset('ort-wasm-simd-threaded.mjs').toString())+'</script><script type="text/plain" id="wasm-data">'+asset('ort-wasm-simd-threaded.wasm').toString('base64')+'</script><script type="text/plain" id="ort-license">'+safe(asset('ORT_LICENSE.txt').toString())+'</script></head>');
 }}},viteSingleFile()],build:{target:'es2020'}});
