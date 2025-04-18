import { initDeploymentIndicator } from './deployment-indicator.js';
import { initPhaser } from './sprite-preview.js';
import { exportAsGif } from './gif-exporter.js';

// Initialize GIF.js worker
const workerScript = `(function(b){function a(b,d){if({}.hasOwnProperty.call(a.cache,b))return a.cache[b];var e=a.resolve(b);if(!e)throw new Error('Failed to resolve module '+b);var c={id:b,require:a,filename:b,exports:{},loaded:!1,parent:d,children:[]};d&&d.children.push(c);var f=b.slice(0,b.lastIndexOf('/')+1);return a.cache[b]=c.exports,e.call(c.exports,c,c.exports,f,b),c.loaded=!0,a.cache[b]=c.exports}a.modules={},a.cache={},a.resolve=function(b){return{}.hasOwnProperty.call(a.modules,b)?a.modules[b]:void 0},a.define=function(b,c){a.modules[b]=c};a.define('/gif.worker.coffee',function(d,e,f,g){var b,c;b=a('/GIFEncoder.js',d);c=function(a){var c,e,d,f;return c=new b(a.width,a.height),a.index===0?c.writeHeader():c.firstFrame=!1,c.setTransparent(a.transparent),c.setRepeat(a.repeat),c.setDelay(a.delay),c.setQuality(a.quality),c.addFrame(a.data),a.last&&c.finish(),d=c.stream(),a.data=d.pages,a.cursor=d.cursor,a.pageSize=d.constructor.pageSize,a.canTransfer?(f=function(c){for(var b=0,d=a.data.length;b<d;++b)e=a.data[b],c.push(e.buffer);return c}.call(this,[]),self.postMessage(a,f)):self.postMessage(a)},self.onmessage=function(a){return c(a.data)}}),a.define('/GIFEncoder.js',function(e,h,j,i){function c(){this.page=-1,this.pages=[],this.newPage()}function b(a,b){this.width=~~a,this.height=~~b,this.transparent=null,this.transIndex=0,this.repeat=-1,this.delay=0,this.image=null,this.pixels=null,this.indexedPixels=null,this.colorDepth=null,this.colorTab=null,this.usedEntry=new Array,this.palSize=7,this.dispose=-1,this.firstFrame=!0,this.sample=10,this.out=new c}var f=a('/TypedNeuQuant.js',e),g=a('/LZWEncoder.js',e);c.pageSize=4096,c.charMap={};for(var d=0;d<256;d++)c.charMap[d]=String.fromCharCode(d);c.prototype.newPage=function(){this.pages[++this.page]=new Uint8Array(c.pageSize),this.cursor=0},c.prototype.getData=function(){var d='';for(var a=0;a<this.pages.length;a++)for(var b=0;b<c.pageSize;b++)d+=c.charMap[this.pages[a][b]];return d},c.prototype.writeByte=function(a){this.cursor>=c.pageSize&&this.newPage(),this.pages[this.page][this.cursor++]=a},c.prototype.writeUTFBytes=function(b){for(var c=b.length,a=0;a<c;a++)this.writeByte(b.charCodeAt(a))},c.prototype.writeBytes=function(b,d,e){for(var c=e||b.length,a=d||0;a<c;a++)this.writeByte(b[a])},b.prototype.setDelay=function(a){this.delay=Math.round(a/10)},b.prototype.setFrameRate=function(a){this.delay=Math.round(100/a)},b.prototype.setDispose=function(a){this.dispose=a},b.prototype.setRepeat=function(a){this.repeat=a},b.prototype.setTransparent=function(a){this.transparent=a},b.prototype.addFrame=function(a){this.image=a,this.getImagePixels(),this.analyzePixels(),this.firstFrame&&(this.writeLSD(),this.writePalette(),this.repeat>=0&&this.writeNetscapeExt()),this.writeGraphicCtrlExt(),this.writeImageDesc(),this.firstFrame||this.writePalette(),this.writePixels(),this.firstFrame=!1},b.prototype.finish=function(){this.out.writeByte(59)},b.prototype.setQuality=function(a){a<1&&(a=1),this.sample=a},b.prototype.writeHeader=function(){this.out.writeUTFBytes('GIF89a')},b.prototype.analyzePixels=function(){var g=this.pixels.length,d=g/3;this.indexedPixels=new Uint8Array(d);var a=new f(this.pixels,this.sample);a.buildColormap(),this.colorTab=a.getColormap();var b=0;for(var c=0;c<d;c++){var e=a.lookupRGB(this.pixels[b++]&255,this.pixels[b++]&255,this.pixels[b++]&255);this.usedEntry[e]=!0,this.indexedPixels[c]=e}this.pixels=null,this.colorDepth=8,this.palSize=7,this.transparent!==null&&(this.transIndex=this.findClosest(this.transparent))},b.prototype.findClosest=function(e){if(this.colorTab===null)return-1;var k=(e&16711680)>>16,l=(e&65280)>>8,m=e&255,c=0,d=16777216,j=this.colorTab.length;for(var a=0;a<j;){var f=k-(this.colorTab[a++]&255),g=l-(this.colorTab[a++]&255),h=m-(this.colorTab[a]&255),i=f*f+g*g+h*h,b=parseInt(a/3);this.usedEntry[b]&&i<d&&(d=i,c=b),a++}return c},b.prototype.getImagePixels=function(){var a=this.width,g=this.height;this.pixels=new Uint8Array(a*g*3);var b=this.image,c=0;for(var d=0;d<g;d++)for(var e=0;e<a;e++){var f=d*a*4+e*4;this.pixels[c++]=b[f],this.pixels[c++]=b[f+1],this.pixels[c++]=b[f+2]}},b.prototype.writeGraphicCtrlExt=function(){this.out.writeByte(33),this.out.writeByte(249),this.out.writeByte(4);var b,a;this.transparent===null?(b=0,a=0):(b=1,a=2),this.dispose>=0&&(a=dispose&7),a<<=2,this.out.writeByte(0|a|0|b),this.writeShort(this.delay),this.out.writeByte(this.transIndex),this.out.writeByte(0)},b.prototype.writeImageDesc=function(){this.out.writeByte(44),this.writeShort(0),this.writeShort(0),this.writeShort(this.width),this.writeShort(this.height),this.firstFrame?this.out.writeByte(0):this.out.writeByte(128|this.palSize)},b.prototype.writeLSD=function(){this.writeShort(this.width),this.writeShort(this.height),this.out.writeByte(240|this.palSize),this.out.writeByte(0),this.out.writeByte(0)},b.prototype.writeNetscapeExt=function(){this.out.writeByte(33),this.out.writeByte(255),this.out.writeByte(11),this.out.writeUTFBytes('NETSCAPE2.0'),this.out.writeByte(3),this.out.writeByte(1),this.writeShort(this.repeat),this.out.writeByte(0)},b.prototype.writePalette=function(){this.out.writeBytes(this.colorTab);var b=768-this.colorTab.length;for(var a=0;a<b;a++)this.out.writeByte(0)},b.prototype.writeShort=function(a){this.out.writeByte(a&255),this.out.writeByte(a>>8&255)},b.prototype.writePixels=function(){var a=new g(this.width,this.height,this.indexedPixels,this.colorDepth);a.encode(this.out)},b.prototype.stream=function(){return this.out},e.exports=b}),a.define('/LZWEncoder.js',function(e,g,h,f){function d(y,D,C,B){function w(a,b){r[f++]=a,f>=254&&t(b)}function x(b){u(a),k=i+2,j=!0,l(i,b)}function u(b){for(var a=0;a<b;++a)h[a]=-1}function A(z,r){var g,t,d,e,y,w,s;for(q=z,j=!1,n_bits=q,m=p(n_bits),i=1<<z-1,o=i+1,k=i+2,f=0,e=v(),s=0,g=a;g<65536;g*=2)++s;s=8-s,w=a,u(w),l(i,r);a:while((t=v())!=c){if(g=(t<<b)+e,d=t<<s^e,h[d]===g){e=n[d];continue}if(h[d]>=0){y=w-d,d===0&&(y=1);do if((d-=y)<0&&(d+=w),h[d]===g){e=n[d];continue a}while(h[d]>=0)}l(e,r),e=t,k<1<<b?(n[d]=k++,h[d]=g):x(r)}l(e,r),l(o,r)}function z(a){a.writeByte(s),remaining=y*D,curPixel=0,A(s+1,a),a.writeByte(0)}function t(a){f>0&&(a.writeByte(f),a.writeBytes(r,0,f),f=0)}function p(a){return(1<<a)-1}function v(){if(remaining===0)return c;--remaining;var a=C[curPixel++];return a&255}function l(a,c){g&=d[e],e>0?g|=a<<e:g=a,e+=n_bits;while(e>=8)w(g&255,c),g>>=8,e-=8;if((k>m||j)&&(j?(m=p(++n_bits),j=!1):(++n_bits,m=n_bits==b?1<<b:p(n_bits))),a==o){while(e>0)w(g&255,c),g>>=8,e-=8;t(c)}}var s=Math.max(2,B),r=new Uint8Array(256),h=new Int32Array(a),n=new Int32Array(a),g=0,e=0,f,k=0,m,j=!1,q,i,o;this.encode=z}var c=-1,b=12,a=5003;e.exports=d}),a.define('/TypedNeuQuant.js',function(A,F,E,D){function C(A,B){function I(){o=[],q=new Int32Array(256),t=new Int32Array(a),y=new Int32Array(a),z=new Int32Array(a>>3);var c,d;for(c=0;c<a;c++)d=(c<<b+8)/a,o[c]=new Float64Array([d,d,d,0]),y[c]=e/a,t[c]=0}function J(){for(var c=0;c<a;c++)o[c][0]>>=b,o[c][1]>>=b,o[c][2]>>=b,o[c][3]=c}function K(b,a,c,e,f){o[a][0]-=b*(o[a][0]-c)/d,o[a][1]-=b*(o[a][1]-e)/d,o[a][2]-=b*(o[a][2]-f)/d}function L(j,e,n,l,k){var h=Math.abs(e-j),i=Math.min(e+j,a),g=e+1,f=e-1,m=1,b,d;while(g<i||f>h)i=Math.min(i,a),h=Math.max(h,0),g<i?(b=o[g][0]-j,b*=b,d=o[g][1]-e,b+=d*d,d=o[g][2]-n,b+=d*d,d=o[g][3]-l,b+=d*d,k&&(b-=k[g]/30),b<p&&(p=b,r=g),g++):0,f>h?(b=o[f][0]-j,b*=b,d=o[f][1]-e,b+=d*d,d=o[f][2]-n,b+=d*d,d=o[f][3]-l,b+=d*d,k&&(b-=k[f]/30),b<p&&(p=b,r=f),f--):0,m++}function C(a,n,d){var h=1e3,e=-1,f=q[n],g=f-1;while(f<c||g>=0)f<c?(d=o[f][3]-a,d>=h?f=c:(f++,d<0&&(d=-d),e=o[f][1]-n,e<0&&(e=-e),d+=e,d<h&&(e=o[f][2]-d,e<0&&(e=-e),d+=e,d<h&&(h=d,b=f)))):0,g>=0?(d=o[g][3]-a,d>=h?g=-1:(g--,d<0&&(d=-d),e=o[g][1]-n,e<0&&(e=-e),d+=e,d<h&&(e=o[g][2]-d,e<0&&(e=-e),d+=e,d<h&&(h=d,b=g)))):0;return b}function D(){var d,b,e,c,i,g,h,f,j,k=0,n=0;for(d=0;d<a;d++){for(e=o[d][0],b=o[d][1],c=o[d][2],f=o[d][3],g=0;g<a;g++)h=o[g][0]-e,h<0&&(h=-h),j=o[g][1]-b,j<0&&(j=-j),h+=j,j=o[g][2]-c,j<0&&(j=-j),h+=j,h<f&&(f=h);k+=f,n<f&&(n=f)}k/=a,n=n/k-k}function E(e,c){q[c]=e}function F(b){var c,f,d,g,h,n,e,k=b+1;for(c=b-1;b<a||c>=0;)b<a?(f=o[b][0],d=o[b][1],g=o[b][2],h=o[b][3],n=k-h,n<k&&(k=n),b++):0,c>=0?(f=o[c][0],d=o[c][1],g=o[c][2],h=o[c][3],n=k-h,n<k&&(k=n),c--):0;return k}function G(){var g,l,q,f,h,c,d=[],i=[];for(g=0;g<a;g++)l=o[g][3],l>z[f=g>>3]&&(z[f]=l);for(q=0;q<a>>3;q++)h=q<<3,c=h+8,c>a&&(c=a);for(f=h;f<c;f++)l=o[f][3],l>d[q]&&(d[q]=l);for(q=0;q<a>>3;q++)for(g=0;g<a>>3;g++)l=z[q]>z[g]?z[q]-z[g]:z[g]-z[q],l>i[q]&&(i[q]=l);r=0;for(g=0;g<a;g++)h=g>>3,o[g][3]*=y[h]}function H(){var b,d,c,f,e,g,h=0,i=0;for(b=0;b<a;b++){for(e=o[b][0],d=o[b][1],c=o[b][2],f=e>d?e:d,c>f&&(f=c),h<f&&(h=f),g=e<d?e:d,c<g&&(g=c),i>g&&(i=g);b<a;b++)e=o[b][0],d=o[b][1],c=o[b][2],e>d?e:d}t[r]=h,t[r+1]=i}var r,M=B,c=M,N=A,e=1024,n=10,m=1<<n,k=10,d=m>>k,g=m<<10-k,a=1<<19,o,q,t,y,z;this.buildColormap=function(){I(),J(),G(),H(),D()},this.getColormap=function(){var b,d,c=0,e=[];for(b=0;b<a;b++)d=o[b][3],t[d]=b;for(b=0;b<a;b++)d=t[b],e[c++]=o[d][0],e[c++]=o[d][1],e[c++]=o[d][2];return e},this.lookupRGB=C}var w=1<<3,e=w*w*w,f=e>>3,r=e>>2,n=e>>1,m=1<<19,i=4,k=1<<i,b=k>>1,h=b>>1,x=k<<1,j=1<<2,o=1<<k-1,d=k+1,g=1<<d,a=g+1,c=1<<9,l=c-1,s=1<<19,t=1<<13,q=t-1;A.exports=C}),b.GIFEncoder=a('/GIFEncoder.js')})(function(){return this}());`;

// Create a Blob containing the worker code
const workerBlob = new Blob([workerScript], { type: 'application/javascript' });
// Create a URL for the worker blob
const workerUrl = URL.createObjectURL(workerBlob);

// Initialize components
initDeploymentIndicator();

// Handle file upload and preview
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');

function handleFile(file) {
  console.log('Handling file:', file.name);
  const reader = new FileReader();
  
  reader.onload = function(e) {
    console.log('File loaded');
    const img = new Image();
    
    img.onload = function() {
      console.log('Image loaded:', img.width, 'x', img.height);
      
      // Get current values from inputs
      const frameWidth = parseInt(document.getElementById('frame-width').value) || 64;
      const frameHeight = parseInt(document.getElementById('frame-height').value) || 64;
      const frameCount = parseInt(document.getElementById('frame-count').value) || Math.floor(img.width / frameWidth);
      const fps = parseInt(document.getElementById('fps').value) || 12;
      
      console.log('Using parameters:', {
        frameWidth,
        frameHeight,
        frameCount,
        fps
      });
      
      initPhaser(e.target.result, {
        frameWidth,
        frameHeight,
        frameCount,
        fps
      });
    };
    
    img.onerror = function() {
      console.error('Error loading image');
    };
    
    img.src = e.target.result;
  };
  
  reader.onerror = function() {
    console.error('Error reading file');
  };
  
  reader.readAsDataURL(file);
}

// File input change handler
fileInput.addEventListener('change', (e) => {
  console.log('File input change event');
  if (e.target.files && e.target.files[0]) {
    handleFile(e.target.files[0]);
  }
});

// Click handler for upload area
uploadArea.addEventListener('click', () => {
  fileInput.click();
});

// Drag and drop handlers
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
    handleFile(e.dataTransfer.files[0]);
  }
});

// Parameter change handler
[
  document.getElementById('frame-width'),
  document.getElementById('frame-height'),
  document.getElementById('frame-count'),
  document.getElementById('fps')
].forEach(input => {
  input.addEventListener('change', () => {
    console.log('Parameter changed:', input.id, input.value);
    const file = fileInput.files && fileInput.files[0];
    if (file) {
      handleFile(file);
    }
  });
});

// Export button handler
document.getElementById('export-gif').addEventListener('click', () => exportAsGif(workerUrl));

// Tab switching functionality
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    const tabId = tab.getAttribute('data-tab') + '-tab';
    document.getElementById(tabId).classList.add('active');
  });
}); 