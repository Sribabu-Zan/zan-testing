import { PreloaderStage } from "./PreloaderStage";

/**
 * Runs while the HTML is still being parsed, right after the preloader's own
 * markup: a visitor who has already seen it this session, or who prefers
 * reduced motion, gets a <style> that hides it before first paint — and the
 * preloaded flag, so the navbar does not wait for an event that never comes.
 *
 * It injects a style rather than removing the node: React still has to find
 * the node to hydrate it.
 */
const SKIP_SCRIPT = `(function(){try{var d=document,r=d.documentElement,s=false;try{s=sessionStorage.getItem('zan.preloader.seen')==='1'}catch(e){}if(s||window.matchMedia('(prefers-reduced-motion: reduce)').matches){var t=d.createElement('style');t.setAttribute('data-zan-preloader','skip');t.textContent='#zan-preloader{display:none!important}';d.head.appendChild(t);r.setAttribute('data-preloaded','1')}}catch(e){}})();`;

/**
 * First-visit preloader. A server component, so the skip script is part of
 * the server HTML and is only ever hydrated, never created on the client.
 */
export function Preloader() {
  return (
    <>
      <PreloaderStage />
      <script dangerouslySetInnerHTML={{ __html: SKIP_SCRIPT }} />
    </>
  );
}
