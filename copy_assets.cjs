const fs = require('fs');
const path = require('path');

const mediaDir = './public/media';

const filesToCopy = [
  { src: 'HAGON 2.png', dest: 'hagon_xchange_hero.png' },
  { src: 'HAGON 2.png', dest: 'HAGON 2-2.png' },
  { src: 'FDS74000v0.png', dest: 'FDS74000v0-2.png' },
  { src: 'FDS74600v0-dm ds sc.png', dest: 'FDS74600v0-dm ds sc-2.png' },
  { src: 'FCL76300v1-ds-sc.png', dest: 'FCL76200v0-ds sc-1.png' },
  { src: 'FCL76300v1-ds-sc.png', dest: 'FCL76200v1-ds-sc.png' },
  { src: 'FCL76100v0 sc.png', dest: 'FCL76100v0 sc-3.png' },
  { src: 'create_a_premium_product_video.mp4', dest: 'milena_xchange_video-1.mp4' },
  { src: 'FBH71500v0-ds-sc(BK Front).png', dest: 'FBH71500v0-ds-sc(BK Front)-2.png' }
];

console.log('Copying missing assets...');
filesToCopy.forEach(({ src, dest }) => {
  const srcPath = path.join(mediaDir, src);
  const destPath = path.join(mediaDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} -> ${dest}`);
  } else {
    console.warn(`Source file not found: ${srcPath}`);
  }
});
console.log('Done copying assets.');
