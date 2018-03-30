const setItem = type => (key, item) => {
  const obj = window[`${type}Storage`];
  return obj.setItem(key, JSON.stringify(item));
};
const getItem = type => (key, defaultValue, saveIfNotExist) => {
  const obj = window[`${type}Storage`];
  const savedItem = obj.getItem(key);
  if (!savedItem && saveIfNotExist) {
    setItem(type)(key, defaultValue);
  }

  return savedItem ? JSON.parse(savedItem) : defaultValue;
};

const storage = {
  local: {
    setItem: setItem('local'),
    getItem: getItem('local'),
  },
  session: {
    setItem: setItem('session'),
    getItem: getItem('session'),
  },
};

function $(id) {
  return document.getElementById(id);
}
function forEach(arr, callback) {
  for (let i = 0; i < arr.length; i++) callback(arr[i], i);
}

function guid() {
  return 'xyxyxyxy'.replace(/[xy]/g, c => {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8; // eslint-disable-line
    return v.toString(16);
  });
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function findParent(node, className) {
  while (node) {
    if (node.className.indexOf(className) >= 0) return node;
    node = node.parentNode;
  }
  return null;
}

function find(arr, callback) {
  for (const item of arr) {
    if (callback(item)) return item;
  }
  return null;
}