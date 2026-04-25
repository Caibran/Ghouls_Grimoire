/* js/resources.js — real resource links */

window.RESOURCES = [
  {
    name: 'EOEngine',
    desc: 'Cross-platform Endless Online game engine.',
    href: 'https://www.eoengine.net'
  },
  {
    name: 'EOCobra',
    desc: 'Endless Online client — by Caibran.',
    href: 'https://github.com/Caibran/EOCobra'
  },
  {
    name: 'EOMapJS',
    desc: 'Browser-based Endless Online map editor.',
    href: 'https://github.com/Cirras/eomap-js'
  },
  {
    name: 'Etheos',
    desc: 'Modern Endless Online server implementation.',
    href: 'https://github.com/Ethanmoffat/etheos'
  },
  {
    name: 'EndlessClient',
    desc: 'Open-source Endless Online client by Ethanmoffat.',
    href: 'https://github.com/Ethanmoffat/endlessclient'
  },
  {
    name: 'EOSERV',
    desc: 'Endless Online server emulator.',
    href: 'https://eoserv.net'
  }
];

window.renderResources = function () {
  var list = document.getElementById('resource-list');
  if (!list) return;
  list.innerHTML = window.RESOURCES.map(function (r) {
    return '<a href="' + r.href + '" class="resource-link-card" target="_blank" rel="noopener">' +
      '<div class="rlc-name">' + r.name + '</div>' +
      '<div class="rlc-desc">' + r.desc + '</div>' +
      '<span class="rlc-url">' + r.href.replace(/^https?:\/\//, '') + ' &rarr;</span>' +
    '</a>';
  }).join('');
};

/* Resources are static — render immediately, no server call needed */
document.addEventListener('DOMContentLoaded', window.renderResources);
