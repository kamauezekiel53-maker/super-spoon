// js/router.js
const Router = (function(){
  function parseHash(hash){
    if(!hash) return null;
    const parts = hash.replace(/^#\/?/, '').split('/');
    if(parts[0] === 'movie' && parts[1]) return { type:'movie', id: parts[1] };
    return null;
  }

  function handleHash(){
    const r = parseHash(location.hash);
    if(r && window.App && typeof window.App.openFromRouter === 'function'){
      window.App.openFromRouter(r.id);
    }
  }

  window.addEventListener('hashchange', handleHash);
  setTimeout(handleHash, 50);

  return { parseHash, handleHash };
})();