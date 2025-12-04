(function(){
  function ensureContainer(){
    let c = document.getElementById('toast-container');
    if(!c){
      c = document.createElement('div');
      c.id = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function createToast(message, type='info', timeout=3500, title=null){
    const container = ensureContainer();
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'info');

    if(title){
      const tt = document.createElement('div');
      tt.className = 'title';
      tt.textContent = title;
      t.appendChild(tt);
    }
    const msg = document.createElement('div');
    msg.className = 'message';
    msg.textContent = message;
    t.appendChild(msg);

    // add to container
    container.appendChild(t);

    // request animation frame to allow CSS transition
    requestAnimationFrame(()=> t.classList.add('show'));

    // remove on timeout
    const to = setTimeout(()=> hideToast(t), timeout);

    // allow click to dismiss
    t.addEventListener('click', ()=>{
      clearTimeout(to);
      hideToast(t);
    });

    return t;
  }

  function hideToast(elem){
    if(!elem) return;
    elem.classList.remove('show');
    // wait for transition
    setTimeout(()=>{
      if(elem && elem.parentNode) elem.parentNode.removeChild(elem);
    }, 260);
  }

  // simple exported helper
  window.showToast = function(message, type='info', timeout=3500, title=null){
    try{
      return createToast(message, type, timeout, title);
    }catch(e){
      console.error('showToast error', e);
    }
  };
})();
