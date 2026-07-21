const PIN_HASH="400e33686eb02a3f3613790ec22f280da49dc092ce5f2dc68a6d7c34fe819f7c";
const root=document.querySelector("#adminRoot");
let content=null;
const esc=value=>String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
async function hash(value){const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return[...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function load(){const r=await fetch("/content.json",{cache:"no-store"});const base=await r.json();try{content=JSON.parse(localStorage.getItem("ditz-content-draft"))||base}catch{content=base}}
function saveDraft(){localStorage.setItem("ditz-content-draft",JSON.stringify(content));alert("Draft tersimpan di browser ini.")}
function loginView(message=""){
  const lock=Number(localStorage.getItem("ditz-lock-until")||0),remaining=Math.ceil((lock-Date.now())/1000);
  root.innerHTML=`<section class="admin-login"><a class="text-link" href="/">← Kembali ke website</a><div style="margin-top:32px"><span class="kicker">HIDDEN ADMIN</span><h1>DiTz Control</h1><p class="security-copy">Masukkan PIN admin. Panel ini tidak ditampilkan pada navigasi publik.</p></div><form id="loginForm"><input type="password" name="pin" inputmode="numeric" autocomplete="one-time-code" maxlength="12" placeholder="PIN admin" ${remaining>0?"disabled":""} required><button class="button button-gold" ${remaining>0?"disabled":""}>Masuk</button></form><p id="loginMessage">${remaining>0?`Terlalu banyak percobaan. Coba lagi dalam ${remaining} detik.`:esc(message)}</p></section>`;
  document.querySelector("#loginForm").addEventListener("submit",async e=>{
    e.preventDefault();
    const lockUntil=Number(localStorage.getItem("ditz-lock-until")||0);if(Date.now()<lockUntil)return loginView();
    const ok=await hash(new FormData(e.target).get("pin"))===PIN_HASH;
    if(ok){sessionStorage.setItem("ditz-admin-session","1");localStorage.removeItem("ditz-login-attempts");panelView();return}
    const attempts=Number(localStorage.getItem("ditz-login-attempts")||0)+1;localStorage.setItem("ditz-login-attempts",String(attempts));
    if(attempts>=5){localStorage.setItem("ditz-lock-until",String(Date.now()+30000));localStorage.setItem("ditz-login-attempts","0");loginView();return}
    loginView(`PIN salah. Sisa percobaan: ${5-attempts}.`);
  });
}
function projectRows(){return content.projects.map((p,i)=>`<div class="admin-project-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.url)}</small></div><button type="button" data-remove-project="${i}">Hapus</button></div>`).join("")||'<p class="security-copy">Belum ada project.</p>'}
function priceRows(){return content.packages.map((p,i)=>`<label class="admin-row"><strong>${esc(p.name)}</strong><input type="number" min="0" step="5000" value="${Number(p.price)||0}" data-price-index="${i}"></label>`).join("")}
function panelView(){
  root.innerHTML=`<div class="admin-shell"><header class="admin-header"><div><span class="kicker">CONTENT CONTROL</span><h1>DiTz Control</h1></div><div class="admin-actions"><a class="button button-ghost" href="/?preview=1" target="_blank" rel="noopener">Preview Draft</a><button class="button button-ghost" id="logout">Keluar</button></div></header><div class="admin-note"><strong>Mode static profesional:</strong> perubahan disimpan sebagai draft di browser. Untuk membuatnya tampil bagi semua pengunjung, unduh <code>content.json</code> lalu ganti file yang sama di repository GitHub dan deploy ulang.</div><div class="admin-grid"><section class="admin-card"><h2>Harga paket</h2><div id="priceRows">${priceRows()}</div><div class="admin-actions"><button class="button button-gold" id="savePrices">Simpan Draft Harga</button></div></section><section class="admin-card"><h2>Project portfolio</h2><form class="admin-form" id="projectForm"><input name="title" required maxlength="100" placeholder="Nama project"><input name="category" maxlength="80" placeholder="Kategori"><input class="wide" name="url" type="url" required placeholder="Link live demo"><input class="wide" name="image" type="url" required placeholder="URL screenshot atau thumbnail"><textarea class="wide" name="description" required maxlength="500" placeholder="Deskripsi project"></textarea><button class="button button-gold wide" type="submit">Tambah Project</button></form><div class="admin-project-list" id="projectList">${projectRows()}</div></section></div><section class="admin-card"><h2>Publikasi konten</h2><p class="security-copy">Unduh file terbaru, lalu upload untuk mengganti <code>content.json</code> di root repository.</p><div class="admin-actions"><button class="button button-gold" id="downloadJson">Unduh content.json</button><button class="button button-ghost" id="copyJson">Salin JSON</button><label class="button button-ghost">Impor JSON<input id="importJson" type="file" accept="application/json" hidden></label><button class="button button-ghost" id="resetDraft">Reset Draft</button></div></section></div>`;
  bindPanel();
}
function bindPanel(){
  document.querySelector("#logout").onclick=()=>{sessionStorage.removeItem("ditz-admin-session");loginView()};
  document.querySelector("#savePrices").onclick=()=>{document.querySelectorAll("[data-price-index]").forEach(input=>content.packages[Number(input.dataset.priceIndex)].price=Number(input.value));saveDraft()};
  document.querySelector("#projectForm").onsubmit=e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.target));content.projects.push(p);saveDraft();panelView()};
  document.querySelector("#projectList").onclick=e=>{const b=e.target.closest("[data-remove-project]");if(!b)return;content.projects.splice(Number(b.dataset.removeProject),1);saveDraft();panelView()};
  document.querySelector("#downloadJson").onclick=()=>{const blob=new Blob([JSON.stringify(content,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="content.json";a.click();URL.revokeObjectURL(a.href)};
  document.querySelector("#copyJson").onclick=async()=>{await navigator.clipboard.writeText(JSON.stringify(content,null,2));alert("JSON disalin.")};
  document.querySelector("#importJson").onchange=async e=>{try{const next=JSON.parse(await e.target.files[0].text());if(!Array.isArray(next.projects)||!Array.isArray(next.packages))throw new Error();content=next;saveDraft();panelView()}catch{alert("File JSON tidak valid.")}};
  document.querySelector("#resetDraft").onclick=async()=>{if(!confirm("Hapus seluruh draft lokal?"))return;localStorage.removeItem("ditz-content-draft");await load();panelView()};
}
(async()=>{try{await load();sessionStorage.getItem("ditz-admin-session")==="1"?panelView():loginView()}catch{root.innerHTML='<section class="admin-login"><h1>Gagal memuat panel</h1><p>Pastikan content.json tersedia.</p></section>'}})();
