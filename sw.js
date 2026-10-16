/* 서비스 워커: 사이트 파일을 캐시해 앱처럼 빠르게 열리고, 오프라인에서도 화면이 뜨게 합니다.
 * 파일을 수정해 배포할 때는 CACHE 버전 숫자를 올려주세요. (예: vision-v2) */
const CACHE = "vision-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./course.html",
  "./watch.html",
  "./my.html",
  "./css/style.css",
  "./js/data.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 내 사이트 파일: 네트워크 우선(최신 내용), 실패 시 캐시. 외부(YouTube 등)는 건드리지 않음.
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
