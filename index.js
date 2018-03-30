window.addEventListener('click', evt => {
  if (evt.target.dataset.action) {
    evt.stopPropagation();
    const ds = evt.target.dataset;
    switch (ds.action) {
      case 'close-dialog':
        closePrompt();
        break;
      case 'close-tab':
        closeTab(ds.tabId);
        break;
      case 'refresh-tab':
        find(tabs, t => t.id === ds.tabId).webview.reload();
        break;
      case 'open-history':
        newTab({ title: ds.title, url: ds.url });
        break;
    }
  }
});

window.addEventListener('keypress', evt => {
  if (evt.key.toLowerCase() === 'r' && evt.ctrlKey) {
    evt.preventDefault();
    const t = find(tabs, t => t.selected);
    if (t) t.webview.reload();
  }
});

let promptCallback;
function handlePromptKeyPress(evt) {
  if (evt.keyCode === 13) {
    promptCallback(evt.target.value);
    closePrompt();
  }
}
function prompt(msg, defaultValue, callback) {
  $('dialog-container').style.display = 'block';
  const input = document.createElement('input');
  promptCallback = callback;
  $('dialog-container').innerHTML = `
    <div class="dialog dialog-prompt" style="">
      <span class="icon-close" data-action="close-dialog">✕</span>
      <div class="msg">${msg}</div>
      <input value="${defaultValue}" onkeypress="handlePromptKeyPress(event)"/>
    </div>
  `;
}

function closePrompt() {
  $('dialog-container').innerHTML = '';
  $('dialog-container').style.display = 'none';
}

const tabsNode = document.getElementById('tabs');
tabsNode.addEventListener('click', evt => {
  const tabNode = findParent(evt.target, 'tab-item');
  if (!tabNode) return;
  if (tabNode.dataset.action === 'add-tab') {
    prompt('Please input the url:', 'http://localhost:', value => {
      newTab({ title: 'Loading...', url: value });
    });

    return;
  }
  selectTab(tabNode.dataset.id);
});
let tabs = [];
let tabHistory = storage.local.getItem('tabHistory') || [];
// [
//   { title: 'rekit-studio', url: 'http://localhost:6078' },
//   { title: 'nextgen-ui', url: 'http://localhost:6056' },
//   { title: 'hercules-ui', url: 'http://localhost:6081' },
// ];

function saveTabHistory() {
  // const hash = {};
  // forEach(tabHistory, t => hash[t.url] = t);
  const newHistory = [];
  const newHash = {};
  forEach([].concat(tabs).reverse().concat(tabHistory), t => {
    if (!newHash[t.url]) newHistory.push({
      title: t.title,
      url: t.url,
    });
    newHash[t.url] = true;
  });
  tabHistory = newHistory;
  storage.local.setItem('tabHistory', newHistory);
}
const render = debounce(() => {
  tabsNode.innerHTML = [
    '<div class="tab-item menu-tab">',
    '<label>…</label>',
    '<ul class="menu-history">',
    tabHistory
      .map(
        tab =>
          `<li data-title="${tab.title}" data-url="${
            tab.url
          }" data-action="open-history"><span class="title" data-title="${tab.title}" data-url="${
            tab.url
          }" data-action="open-history">${tab.title}</span> - ${tab.url}</li>`
      )
      .join(''),
    '</ul>',
    '</div>',
  ]
    .concat(
      tabs.map(tab => {
        if (tab.selected) tab.webview.style.visibility = 'visible';
        else tab.webview.style.visibility = 'hidden';
        return `<div class="tab-item${tab.selected ? ' active' : ''}" data-id="${tab.id}">
          <label>${tab.title}</label>
          <span class="icon-refresh" data-tab-id="${tab.id}" data-action="refresh-tab">⇧</span>
          <span class="icon-close" data-tab-id="${tab.id}" data-action="close-tab">✕</span>
        </div>`;
      })
    )
    .concat(['<div class="tab-item add-tab" data-action="add-tab"><span>✕</span></div>'])
    .join('');
    saveTabHistory();
}, 50);

function newTab(args) {
  const wv = document.createElement('webview');
  document.getElementById('wv-container').appendChild(wv);
  wv.src = args.url;

  const tab = {
    id: guid(),
    title: args.title,
    url: args.url,
    webview: wv,
  };
  tabs.push(tab);
  selectTab(tab.id);
  wv.addEventListener('dom-ready', () => {
    forEach(tabs, t => {
      if (t.id === tab.id) {
        setTimeout(() => {
          tab.title = wv.getTitle();
          saveTabHistory();
          render();
        }, 2000);
      }
    });
  });
  render();
  return tab.id;
}

function closeTab(id) {
  let nextSelect = false;
  tabs = tabs.filter(tab => {
    if (tab.id === id) {
      if (tab.selected) nextSelect = true;
      tab.webview.parentNode.removeChild(tab.webview);
      delete tab.webview;
      return false;
    }
    return true;
  });
  if (tabs.length > 0 && nextSelect) selectTab(tabs[tabs.length - 1].id);
  render();
}

function selectTab(id) {
  forEach(tabs, tab => {
    if (tab.id === id) tab.selected = true;
    else tab.selected = false;
  });
  const t = find(tabs, t => t.selected);
  if (t) document.title=`${t.title} - ${t.url}`;
  render();
}

render();
// newTab({ title: 'loading', url: 'http://localhost:6056' });
