<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bibliothèque Virtuelle SecuBox</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#05060f;--ink:#f0f2ff;--dim:rgba(240,242,255,.5);
  --fire:#ff0066;--earth:#ffff00;--water:#0066ff;--wood:#00ff88;--metal:#cc00ff;--yang:#ff9500;
  --glass:rgba(255,255,255,.04);--border:rgba(255,255,255,.08);
}
body{min-height:100vh;background:var(--bg);color:var(--ink);font-family:"Space Mono",monospace;padding:2rem}
h1{font-size:2rem;margin-bottom:.5rem;background:linear-gradient(90deg,var(--fire),var(--yang),var(--earth),var(--wood),var(--water),var(--metal));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.header{display:flex;flex-wrap:wrap;align-items:center;gap:1rem;margin-bottom:1.5rem}
.stats{color:var(--dim);font-size:.75rem;letter-spacing:.1em}
.search-box{display:flex;gap:.5rem;margin-left:auto}
.search-box input{background:var(--glass);border:1px solid var(--border);color:var(--ink);padding:.5rem 1rem;border-radius:4px;font-family:inherit;font-size:.8rem;width:240px}
.search-box input:focus{outline:none;border-color:var(--metal)}
.search-box input::placeholder{color:var(--dim)}
.tabs{display:flex;gap:.5rem;margin-bottom:1.5rem;flex-wrap:wrap}
.tab{padding:.4rem 1rem;background:var(--glass);border:1px solid var(--border);border-radius:4px;font-size:.7rem;cursor:pointer;transition:all .15s}
.tab:hover{background:rgba(255,255,255,.08)}
.tab.active{background:var(--metal);color:#000;border-color:var(--metal)}
.shelf{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:1.5rem}
.book{background:var(--glass);border:1px solid var(--border);border-left:4px solid var(--book-color,var(--metal));padding:1.2rem;border-radius:4px}
.book-head{display:flex;align-items:center;gap:.8rem;margin-bottom:.5rem}
.book-icon{font-size:1.8rem}
.book-title{font-size:1rem;font-weight:bold}
.book-count{margin-left:auto;font-size:.6rem;color:var(--dim)}
.book-desc{font-size:.65rem;color:var(--dim);margin-bottom:1rem}
.entries{display:flex;flex-direction:column;gap:.4rem;max-height:300px;overflow-y:auto}
.entry{display:flex;align-items:center;gap:.6rem;padding:.5rem;background:rgba(255,255,255,.02);border-radius:2px;text-decoration:none;color:var(--ink);transition:background .15s}
.entry:hover{background:rgba(255,255,255,.06)}
.entry-type{font-size:.5rem;padding:.15rem .4rem;border-radius:2px;background:var(--metal);color:#000;flex-shrink:0}
.entry-type.metablog{background:var(--fire)}
.entry-type.streamlit{background:var(--wood)}
.entry-type.haproxy{background:var(--water)}
.entry-name{font-size:.75rem;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.entry-domain{font-size:.55rem;color:var(--dim);flex-shrink:0}
.empty{color:var(--dim);font-style:italic;font-size:.7rem}
.all-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.8rem}
.hidden{display:none}
footer{margin-top:3rem;text-align:center;color:var(--dim);font-size:.6rem}
footer a{color:var(--water)}
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Bibliothèque Virtuelle</h1>
    <div class="stats" id="stats">Chargement...</div>
  </div>
  <div class="search-box">
    <input type="text" id="search" placeholder="Rechercher..." autocomplete="off">
  </div>
</div>
<div class="tabs" id="tabs"></div>
<div class="shelf" id="shelf"></div>
<div class="all-grid hidden" id="allGrid"></div>
<footer>SecuBox Meta Cataloger v1.0 | <a href="/cgi-bin/luci/admin/secubox/metacatalog" target="_blank">LuCI Dashboard</a></footer>
<script>
(async()=>{
  const [idx,bks]=await Promise.all([
    fetch("/metacatalog/api/index.json").then(r=>r.json()),
    fetch("/metacatalog/api/books.json").then(r=>r.json())
  ]);
  const allEntries=idx.entries||[];
  const entriesMap=Object.fromEntries(allEntries.map(e=>[e.id,e]));
  const books=bks.books||[];

  document.getElementById("stats").textContent=
    allEntries.length+" contenus | "+books.length+" collections | "+idx.generated;

  // Build tabs
  const tabsDiv=document.getElementById("tabs");
  const tabs=[{id:"books",name:"Collections",icon:"📚"},{id:"all",name:"Tout ("+allEntries.length+")",icon:"📋"}];
  books.forEach(b=>tabs.push({id:b.id,name:b.name,icon:b.icon,color:b.color}));
  tabs.forEach((t,i)=>{
    const btn=document.createElement("button");
    btn.className="tab"+(i===0?" active":"");
    btn.dataset.tab=t.id;
    btn.innerHTML=t.icon+" "+t.name;
    if(t.color)btn.style.setProperty("--metal",t.color);
    btn.onclick=()=>switchTab(t.id);
    tabsDiv.appendChild(btn);
  });

  // Render books shelf
  const shelf=document.getElementById("shelf");
  books.forEach(book=>{
    const bookEntries=(book.entries||[]).map(eid=>entriesMap[eid]).filter(e=>e);
    const div=document.createElement("div");
    div.className="book";
    div.dataset.book=book.id;
    div.style.setProperty("--book-color",book.color);
    div.innerHTML=
      "<div class=\"book-head\">"+
        "<span class=\"book-icon\">"+book.icon+"</span>"+
        "<span class=\"book-title\">"+book.name+"</span>"+
        "<span class=\"book-count\">"+bookEntries.length+" entries</span>"+
      "</div>"+
      "<div class=\"book-desc\">"+(book.description||"")+"</div>"+
      "<div class=\"entries\">"+
        (bookEntries.length?bookEntries.map(e=>renderEntry(e)).join(""):"<div class=\"empty\">Aucun contenu</div>")+
      "</div>";
    shelf.appendChild(div);
  });

  // Render all entries grid
  const allGrid=document.getElementById("allGrid");
  allEntries.forEach(e=>{
    allGrid.innerHTML+=renderEntry(e);
  });

  function renderEntry(e){
    return "<a class=\"entry\" href=\""+e.url+"\" target=\"_blank\" data-search=\""+(e.name+" "+e.domain+" "+(e.metadata?.title||"")).toLowerCase()+"\">"+
      "<span class=\"entry-type "+e.type+"\">"+e.type+"</span>"+
      "<span class=\"entry-name\">"+(e.metadata?.title||e.name)+"</span>"+
      "<span class=\"entry-domain\">"+e.domain+"</span>"+
    "</a>";
  }

  function switchTab(tabId){
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.querySelector(".tab[data-tab=\""+tabId+"\"]").classList.add("active");

    if(tabId==="books"){
      shelf.classList.remove("hidden");
      allGrid.classList.add("hidden");
      document.querySelectorAll(".book").forEach(b=>b.classList.remove("hidden"));
    }else if(tabId==="all"){
      shelf.classList.add("hidden");
      allGrid.classList.remove("hidden");
    }else{
      shelf.classList.remove("hidden");
      allGrid.classList.add("hidden");
      document.querySelectorAll(".book").forEach(b=>{
        b.classList.toggle("hidden",b.dataset.book!==tabId);
      });
    }
  }

  // Search
  const searchInput=document.getElementById("search");
  searchInput.addEventListener("input",()=>{
    const q=searchInput.value.toLowerCase().trim();
    document.querySelectorAll(".entry").forEach(e=>{
      e.classList.toggle("hidden",q&&!e.dataset.search.includes(q));
    });
    // Show empty message in books
    document.querySelectorAll(".book .entries").forEach(ent=>{
      const visible=ent.querySelectorAll(".entry:not(.hidden)").length;
      const empty=ent.querySelector(".empty");
      if(empty)empty.classList.toggle("hidden",visible>0||!q);
    });
  });
})();
</script>
</body>
</html>
