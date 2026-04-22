/* =============================================================
   Ghoul's Grimoire — resources.js
   Resource download data. Edit to add new resources.
   ============================================================= */

window.RESOURCES = [
  { id:1,  category:'pixel-art', name:'Aseprite Config Pack',       desc:'Custom palettes, brushes, and scripts for EO-style sprite work.',         type:'ZIP',      href:'#' },
  { id:2,  category:'pixel-art', name:'EO Palette Collection',      desc:'32-color palettes extracted from the original Endless Online GFX files.',  type:'GPL',      href:'#' },
  { id:3,  category:'pixel-art', name:'Isometric Grid Templates',   desc:'Aseprite isometric grid templates matching the EO tile coordinate system.',type:'ASEPRITE', href:'#' },
  { id:4,  category:'tilesets',  name:'Dark Dungeon Tileset',        desc:'32x32 dark dungeon tileset compatible with EO map format.',                type:'PNG',      href:'#' },
  { id:5,  category:'tilesets',  name:'Forest and Nature Pack',      desc:'Trees, grass, rocks, and water tiles in classic EO top-down style.',      type:'PNG',      href:'#' },
  { id:6,  category:'sounds',    name:'EO Atmosphere Sound Pack',    desc:'Royalty-free ambient sound effects that fit the EO atmosphere.',           type:'ZIP',      href:'#' },
  { id:7,  category:'docs',      name:'EO Protocol Reference',       desc:'Comprehensive documentation of the Endless Online network protocol packets.',type:'PDF',   href:'#' },
  { id:8,  category:'docs',      name:'GFX File Format Guide',       desc:'Complete reference for the EO GFX format: header layout and bitmap structure.',type:'MD', href:'#' },
  { id:9,  category:'docs',      name:'EIF ENF ESF Format Spec',     desc:'Data file specifications for Item, NPC, Spell, and Class pub files.',     type:'PDF',      href:'#' },
  { id:10, category:'projects',  name:'EOEngine Starter Template',   desc:'Bootstrap project using EOEngine with connection handling and packet parsing.',type:'ZIP', href:'#' },
  { id:11, category:'projects',  name:'EOCobra Config Examples',     desc:'Example configuration profiles and Lua scripts for EOCobra workflows.',   type:'ZIP',      href:'#' }
];

window.RESOURCE_CATEGORIES = [
  { slug:'all',       label:'All Resources'   },
  { slug:'pixel-art', label:'Pixel Art Tools' },
  { slug:'tilesets',  label:'Tilesets'        },
  { slug:'sounds',    label:'Sound FX'        },
  { slug:'docs',      label:'Documentation'   },
  { slug:'projects',  label:'Project Files'   }
];

window.renderResourceRow = function (r) {
  return `
<div class="resource-row" data-category="${r.category}">
  <div class="resource-info">
    <div class="resource-name">${r.name}</div>
    <div class="resource-desc">${r.desc}</div>
  </div>
  <span class="resource-type">${r.type}</span>
  <a href="${r.href}" class="resource-dl-btn">Download</a>
</div>`;
};
