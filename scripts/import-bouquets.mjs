// Import only the catalog photos selected for FLEUR. No customer or private files.
// Studio versions are edited/AI-assisted; -real versions preserve the actual shoots.
import fs from 'node:fs/promises';
import path from 'node:path';
const assets=[
  {
    "path": "public/catalog/burgundy-chrysanthemum.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-burgundy-chrysanthemum.webp?v=1793647214"
  },
  {
    "path": "public/catalog/burgundy-chrysanthemum-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-burgundy-chrysanthemum-real.webp?v=1793647272"
  },
  {
    "path": "public/catalog/lime-chrysanthemum.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-lime-chrysanthemum.webp?v=1793647221"
  },
  {
    "path": "public/catalog/lime-chrysanthemum-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-lime-chrysanthemum-real.webp?v=1793647276"
  },
  {
    "path": "public/catalog/rainbow-chrysanthemum.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-rainbow-chrysanthemum.webp?v=1793647226"
  },
  {
    "path": "public/catalog/rainbow-chrysanthemum-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-rainbow-chrysanthemum-real.webp?v=1793647281"
  },
  {
    "path": "public/catalog/red-roses-pink.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-red-roses-pink.webp?v=1793647230"
  },
  {
    "path": "public/catalog/red-roses-pink-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-red-roses-pink-real.webp?v=1793647286"
  },
  {
    "path": "public/catalog/ivory-roses.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-ivory-roses.webp?v=1793647238"
  },
  {
    "path": "public/catalog/ivory-roses-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-ivory-roses-real.webp?v=1793647290"
  },
  {
    "path": "public/catalog/red-roses-cream.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-red-roses-cream.webp?v=1793647242"
  },
  {
    "path": "public/catalog/red-roses-cream-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-red-roses-cream-real.webp?v=1793647294"
  },
  {
    "path": "public/catalog/fuchsia-roses.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-fuchsia-roses.webp?v=1793647247"
  },
  {
    "path": "public/catalog/fuchsia-roses-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-fuchsia-roses-real.webp?v=1793647299"
  },
  {
    "path": "public/catalog/pink-lisianthus.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-pink-lisianthus.webp?v=1793647254"
  },
  {
    "path": "public/catalog/pink-lisianthus-real.webp",
    "url": "https://cdn.shopify.com/s/files/1/0835/0990/3430/files/fleur-pink-lisianthus-real.webp?v=1793647305"
  }
];
for (const asset of assets) {
 const url = new URL(asset.url);
 if(url.hostname !== 'cdn.shopify.com') throw new Error('Unexpected asset host');
 const response=await fetch(url,{headers:{'User-Agent':'FLEUR-Asset-Importer/1.0'}});
 if(!response.ok) throw new Error(asset.path+' HTTP '+response.status);
 const data=Buffer.from(await response.arrayBuffer());
 if(data.length<2000||data.length>3000000) throw new Error('Unexpected file size '+asset.path);
 await fs.mkdir(path.dirname(asset.path),{recursive:true});
 await fs.writeFile(asset.path,data);
 console.log(asset.path,data.length+' bytes');
}
