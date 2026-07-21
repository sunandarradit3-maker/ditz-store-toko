const state={content:null,selected:null,brief:null,proof:null,orderId:null};
const qs=(s,root=document)=>root.querySelector(s);
const qsa=(s,root=document)=>[...root.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(n)||0);
const esc=value=>String(value??"").replace(/[&<>'"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));

async function loadContent(){
  const response=await fetch("/content.json",{cache:"no-store"});
  if(!response.ok)throw new Error("Konten gagal dimuat");
  const base=await response.json();
  const preview=new URLSearchParams(location.search).get("preview")==="1";
  if(preview){
    try{state.content=JSON.parse(localStorage.getItem("ditz-content-draft"))||base}catch{state.content=base}
  }else state.content=base;
}

function projectCard(project){
  return `<article class="project-card reveal">
    <div class="project-image">
      <img src="${esc(project.image)}" alt="Preview ${esc(project.title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.project-image').classList.add('image-error');this.remove()">
      <span class="project-tag">${esc(project.category||"Website")}</span>
    </div>
    <div class="project-content">
      <h3>${esc(project.title)}</h3>
      <p>${esc(project.description)}</p>
      <div class="project-actions">
        <a class="button button-ghost" href="${esc(project.url)}" target="_blank" rel="noopener noreferrer">Live Demo ↗</a>
      </div>
    </div>
  </article>`;
}

function packageCard(pkg){
  return `<article class="price-card ${pkg.featured?"featured":""} reveal" data-package="${esc(pkg.id)}">
    <span class="price-badge">${esc(pkg.badge)}</span>
    <h3>${esc(pkg.name)}</h3>
    <div class="price-number">${money(pkg.price)} ${pkg.startingFrom?"<small>mulai</small>":""}</div>
    <ul>${(pkg.features||[]).map(item=>`<li>${esc(item)}</li>`).join("")}</ul>
    <button class="button button-gold choose-package" type="button" data-package="${esc(pkg.id)}">Pilih Paket <span>→</span></button>
  </article>`;
}

function render(){
  const {projects=[],packages=[]}=state.content;
  qs("#projectGrid").innerHTML=projects.map(projectCard).join("");
  qs("#studentGrid").innerHTML=packages.filter(p=>p.group==="PELAJAR").map(packageCard).join("");
  qs("#umkmGrid").innerHTML=packages.filter(p=>p.group==="UMKM").map(packageCard).join("");
  observeReveals();
}

function showToast(message){
  const toast=qs("#toast");toast.textContent=message;toast.classList.add("show");
  clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200);
}

function openModal(id){qs(id).hidden=false;document.body.classList.add("modal-open")}
function closeModal(id){qs(id).hidden=true;if(qsa(".modal-backdrop:not([hidden])").length===0)document.body.classList.remove("modal-open")}

function checkoutStep(current){return `<div class="checkout-progress" aria-label="Langkah checkout"><span class="${current>=1?"active":""}"></span><span class="${current>=2?"active":""}"></span><span class="${current>=3?"active":""}"></span></div>`}

function beginCheckout(id){
  state.selected=state.content.packages.find(p=>p.id===id);
  if(!state.selected)return;
  state.orderId=`DITZ-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  state.proof=null;
  qs("#checkoutBody").innerHTML=`
    <span class="kicker">CHECKOUT PROJECT</span>
    <h2 id="checkoutTitle">${esc(state.selected.name)}</h2>
    ${checkoutStep(1)}
    <div class="checkout-price">${money(state.selected.price)}</div>
    <form id="briefForm">
      <div class="form-grid">
        <label>Nama lengkap<input name="name" autocomplete="name" required maxlength="80"></label>
        <label>Nomor WhatsApp<input name="wa" inputmode="tel" autocomplete="tel" required placeholder="08..." maxlength="20"></label>
        <label>Nama usaha atau project<input name="business" maxlength="100"></label>
        <label>Jenis website<input name="type" required placeholder="Toko online, portfolio..." maxlength="100"></label>
        <label>Gaya desain<input name="style" placeholder="Minimalis, luxury, futuristik..." maxlength="120"></label>
        <label>Target selesai<input name="deadline" placeholder="Contoh: 14 hari" maxlength="80"></label>
        <label class="wide">Link referensi<input name="reference" type="url" placeholder="Opsional"></label>
        <label class="wide">Detail kebutuhan<textarea name="brief" required maxlength="2500" placeholder="Jelaskan halaman, fitur, warna, dan kebutuhan lainnya..."></textarea></label>
      </div>
      <label class="consent"><input type="checkbox" required> Saya memahami harga dapat berubah jika kebutuhan di luar brief atau paket.</label>
      <button class="button button-gold full-button" type="submit">Lanjut ke Pembayaran <span>→</span></button>
    </form>`;
  openModal("#checkoutModal");
  setTimeout(()=>qs("#briefForm input")?.focus(),60);
}

function renderPayment(brief){
  state.brief=brief;
  const {dana}=state.content.brand;
  qs("#checkoutBody").innerHTML=`
    <span class="kicker">PEMBAYARAN MANUAL</span>
    <h2 id="checkoutTitle">Transfer lewat DANA</h2>
    ${checkoutStep(2)}
    <div class="order-box"><span>Nomor pesanan</span><strong>${esc(state.orderId)}</strong><span>Total</span><strong>${money(state.selected.price)}</strong></div>
    <div class="dana-box"><div><small>Nomor DANA DiTz Store</small><strong>${esc(dana)}</strong></div><button type="button" id="copyDana">Salin nomor</button></div>
    <ol class="steps"><li>Transfer sesuai total pesanan ke nomor DANA di atas.</li><li>Ambil screenshot bukti pembayaran.</li><li>Pilih screenshot, lalu lanjutkan ke WhatsApp.</li></ol>
    <label class="upload-box">Bukti pembayaran<input id="proofInput" type="file" accept="image/png,image/jpeg,image/webp"><strong>Pilih screenshot bukti transfer</strong><span id="proofName">PNG, JPG, atau WEBP</span></label>
    <button class="button button-gold full-button" type="button" id="continueOrder">Siapkan Pesanan WhatsApp</button>
    <p class="security-copy">Pembayaran belum dianggap lunas sampai admin mengecek transaksi DANA. Website tidak menyimpan saldo pelanggan dan tidak memverifikasi pembayaran secara otomatis.</p>`;
}

function orderMessage(){
  const f=state.brief,p=state.selected;
  return `Halo DiTz Store, saya ingin mengonfirmasi pesanan website.\n\nNomor Pesanan: ${state.orderId}\nPaket: ${p.name}\nTotal: ${money(p.price)}\nStatus: Menunggu verifikasi pembayaran\n\nNama: ${f.name}\nWhatsApp: ${f.wa}\nUsaha/Project: ${f.business||"-"}\nJenis Website: ${f.type}\nGaya Desain: ${f.style||"-"}\nTarget Selesai: ${f.deadline||"Fleksibel"}\nReferensi: ${f.reference||"-"}\n\nBrief:\n${f.brief}\n\nSaya sudah menyiapkan bukti transfer DANA. Mohon dicek dan dikonfirmasi.`;
}

async function continueOrder(){
  if(!state.proof){showToast("Pilih screenshot bukti pembayaran dulu");return}
  const message=orderMessage();
  try{await navigator.clipboard.writeText(message)}catch{}
  const shareData={title:`Pesanan ${state.orderId}`,text:message,files:[state.proof]};
  if(navigator.share&&navigator.canShare?.(shareData)){
    try{await navigator.share(shareData);renderSuccess();return}catch(error){if(error?.name==="AbortError")return}
  }
  const wa=state.content.brand.whatsapp;
  window.open(`https://wa.me/${wa}?text=${encodeURIComponent(message)}`,"_blank","noopener");
  renderSuccess(true);
}

function renderSuccess(manualAttach=false){
  qs("#checkoutBody").innerHTML=`
    <span class="kicker">PESANAN SIAP</span>
    <h2 id="checkoutTitle">Lanjutkan di WhatsApp.</h2>
    ${checkoutStep(3)}
    <div class="order-box"><span>Nomor pesanan</span><strong>${esc(state.orderId)}</strong><span>Status</span><strong>Menunggu verifikasi</strong></div>
    <p>${manualAttach?"Pesan sudah dibuka di WhatsApp. Lampirkan screenshot bukti transfer secara manual sebelum mengirim.":"Brief dan bukti pembayaran sudah disiapkan untuk dibagikan."}</p>
    <button class="button button-ghost full-button" type="button" id="copyOrder">Salin ulang detail pesanan</button>
    <button class="button button-gold full-button" type="button" id="finishOrder">Selesai</button>`;
}

function showLegal(type){
  const terms=`<span class="kicker">LEGAL</span><h2 id="legalTitle">Syarat Layanan</h2><ul><li>Pengerjaan dimulai setelah pembayaran atau DP diverifikasi.</li><li>Revisi mengikuti jumlah pada paket dan brief awal.</li><li>Perubahan besar di luar brief dapat dikenakan biaya tambahan.</li><li>Domain, API, lisensi, dan perpanjangan VPS dibayar pelanggan kecuali tertulis termasuk.</li><li>Source code atau akses final diserahkan setelah kewajiban pembayaran selesai.</li></ul>`;
  const privacy=`<span class="kicker">LEGAL</span><h2 id="legalTitle">Kebijakan Privasi</h2><p>Data yang diisi pada checkout dipakai untuk menyusun pesan pesanan dan tidak dikirim ke server DiTz Store. Bukti pembayaran diproses di perangkat pengguna dan dibagikan melalui fitur berbagi perangkat atau WhatsApp.</p><p>Website ini tidak menyimpan saldo, data kartu, atau kredensial pembayaran.</p>`;
  qs("#legalBody").innerHTML=type==="privacy"?privacy:terms;openModal("#legalModal");
}

function observeReveals(){
  const items=qsa(".reveal:not(.visible)");
  if(!("IntersectionObserver" in window)){items.forEach(x=>x.classList.add("visible"));return}
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.12});
  items.forEach(item=>observer.observe(item));
}

function bindEvents(){
  document.addEventListener("click",event=>{
    const choose=event.target.closest(".choose-package");if(choose)beginCheckout(choose.dataset.package);
    const legal=event.target.closest("[data-open-legal]");if(legal)showLegal(legal.dataset.openLegal);
    if(event.target.closest("#closeCheckout"))closeModal("#checkoutModal");
    if(event.target.closest("#closeLegal"))closeModal("#legalModal");
    if(event.target.id==="checkoutModal")closeModal("#checkoutModal");
    if(event.target.id==="legalModal")closeModal("#legalModal");
    if(event.target.closest("#copyDana")){navigator.clipboard.writeText(state.content.brand.dana).then(()=>showToast("Nomor DANA disalin"));}
    if(event.target.closest("#continueOrder"))continueOrder();
    if(event.target.closest("#copyOrder")){navigator.clipboard.writeText(orderMessage()).then(()=>showToast("Detail pesanan disalin"));}
    if(event.target.closest("#finishOrder"))closeModal("#checkoutModal");
  });
  document.addEventListener("submit",event=>{
    if(event.target.id==="briefForm"){event.preventDefault();renderPayment(Object.fromEntries(new FormData(event.target)))}
  });
  document.addEventListener("change",event=>{
    if(event.target.id==="proofInput"){
      const file=event.target.files?.[0];
      if(file&&file.size>8*1024*1024){event.target.value="";showToast("Ukuran file maksimal 8 MB");return}
      state.proof=file||null;qs("#proofName").textContent=file?`${file.name} • ${(file.size/1024/1024).toFixed(1)} MB`:"PNG, JPG, atau WEBP";
    }
  });
  const menu=qs("#menuButton"),links=qs("#navLinks");
  menu.addEventListener("click",()=>{const open=links.classList.toggle("open");menu.setAttribute("aria-expanded",String(open));menu.textContent=open?"×":"☰"});
  qsa("#navLinks a").forEach(a=>a.addEventListener("click",()=>{links.classList.remove("open");menu.setAttribute("aria-expanded","false");menu.textContent="☰"}));
  addEventListener("scroll",()=>qs("#header").classList.toggle("scrolled",scrollY>20),{passive:true});
  addEventListener("keydown",event=>{if(event.key==="Escape"){closeModal("#checkoutModal");closeModal("#legalModal")}});
}

(async()=>{
  try{await loadContent();render();bindEvents();observeReveals()}
  catch(error){console.error(error);qs("#projectGrid").innerHTML='<p>Konten gagal dimuat. Silakan refresh halaman.</p>'}
})();
