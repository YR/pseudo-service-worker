importScripts('node_modules/workbox-sw/build/importScripts/workbox-sw.dev.v1.0.1.js');

const workboxSW = new WorkboxSW({
  clientsClaim: true,
  skipWaiting: true,
});