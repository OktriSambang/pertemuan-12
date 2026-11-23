"use strict";
class SalamPengguna extends HTMLElement {
  connectedCallback() {
    const nama = this.getAttribute("nama") || "Tamu";
    this.textContent = `Halo, ${nama}! Selamat datang di blog profil saya.`;
  }
}
customElements.define("salam-pengguna", SalamPengguna);


/* ---------- Template <kartu-artikel> ---------- */
const templateKartu = document.createElement("template");
templateKartu.innerHTML = `
  <style>
    :host { display: block; }
    .kartu {
      border: 1px solid var(--kartu-garis, #ddd);
      border-radius: var(--kartu-radius, 8px);
      padding: 16px;
      background: var(--kartu-latar, transparent);
      color: var(--kartu-teks, inherit);
      transition: background-color .15s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .kartu:hover { background: var(--kartu-hover, #eef4fb); }
    ::slotted(h3) {
      margin: 0 0 .25rem;
      color: var(--kartu-judul, #1f4e78);
      font-size: 1.05rem;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    ::slotted(p) {
      font-size: 0.95rem;
      overflow-wrap: anywhere;
    }
    .aksi { margin-top: auto; display: flex; gap: 8px; }
    button {
      cursor: pointer;
      padding: .4rem .8rem;
      border: 1px solid var(--tombol-garis, #888);
      border-radius: 6px;
      background: var(--tombol-latar, #f2f2f2);
      color: var(--tombol-teks, inherit);
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    button:hover { opacity: 0.85; }
  </style>
  <article class="kartu">
    <slot name="judul">Tanpa judul</slot>
    <slot>Tanpa isi</slot>
    <div class="aksi">
      <button type="button" class="btn-like" part="tombol-like">Like (0)</button>
      <button type="button" class="btn-hapus" part="tombol-hapus">Hapus</button>
      <slot name="aksi"></slot>
    </div>
  </article>`;


/* ---------- Komponen <kartu-artikel> ---------- */
class KartuArtikel extends HTMLElement {
  #like = 0;        // state jumlah like milik tiap kartu
  #tombolLike;      // referensi tombol di dalam shadow tree

  // Atribut "like" diamati agar halaman bisa memulihkan jumlah like
  static get observedAttributes() {
    return ["like"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateKartu.content.cloneNode(true));

    this.#tombolLike = this.shadowRoot.querySelector(".btn-like");
    this.#tombolLike.addEventListener("click", () => {
      this.#like++;
      this.#perbaruiTombolLike();
      this.dispatchEvent(new CustomEvent("suka", {
        detail: { jumlah: this.#like },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot.querySelector(".btn-hapus").addEventListener("click", () => {
      // Komponen TIDAK menghapus dirinya sendiri;
      // halaman yang memutuskan lewat listener "hapus-artikel".
      this.dispatchEvent(new CustomEvent("hapus-artikel", {
        bubbles: true,
        composed: true,
      }));
    });
  }

  disconnectedCallback() {
    console.log("kartu-artikel dilepas dari halaman");
  }

  attributeChangedCallback(nama, nilaiLama, nilaiBaru) {
    if (nama === "like") {
      this.#like = Number(nilaiBaru) || 0;
      this.#perbaruiTombolLike();
    }
  }

  #perbaruiTombolLike() {
    this.#tombolLike.textContent = `Like (${this.#like})`;
  }
}
customElements.define("kartu-artikel", KartuArtikel);


/* ---------- Komponen <tombol-tema> (Shadow DOM) ---------- */
const templateTema = document.createElement("template");
templateTema.innerHTML = `
  <style>
    :host { display: inline-block; }
    button {
      cursor: pointer;
      padding: 6px 12px;
      border: 1px solid var(--tema-tombol-garis, white);
      border-radius: 6px;
      background: var(--tema-tombol-latar, transparent);
      color: var(--tema-tombol-teks, white);
      font: inherit;
      font-size: 0.9rem;
      transition: background-color 0.2s ease;
    }
    button:hover { background: var(--tema-tombol-hover, steelblue); }
  </style>
  <button type="button" part="tombol-tema"></button>`;

class TombolTema extends HTMLElement {
  #btn;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateTema.content.cloneNode(true));

    this.#btn = this.shadowRoot.querySelector("button");

    // Cek preferensi awal dari localStorage
    if (localStorage.getItem("tema") === "dark") {
      document.body.classList.add("dark-mode");
    }
    this.#perbaruiLabel();

    this.#btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const aktifDark = document.body.classList.contains("dark-mode");
      localStorage.setItem("tema", aktifDark ? "dark" : "light");
      this.#perbaruiLabel();
      // Kirim event agar halaman tahu tema berubah
      this.dispatchEvent(new CustomEvent("ganti-tema", {
        detail: { gelap: aktifDark },
        bubbles: true,
        composed: true,
      }));
    });
  }

  #perbaruiLabel() {
    this.#btn.textContent = document.body.classList.contains("dark-mode")
      ? "Mode Terang" : "Mode Gelap";
  }
}
customElements.define("tombol-tema", TombolTema);


/* ---------- Template <kartu-komentar> (Shadow DOM + Slot) ----------*/
const templateKomentar = document.createElement("template");
templateKomentar.innerHTML = `
  <style>
    :host { display: block; margin-bottom: 0.5rem; }
    .komentar {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .65rem .85rem;
      border-left: 4px solid var(--komentar-aksen, #2e75b6);
      background: var(--komentar-latar, #f7f7f7);
      border-radius: 0 var(--komentar-radius, 6px) var(--komentar-radius, 6px) 0;
      border: 1px solid var(--komentar-garis, #ccc);
      border-left: 4px solid var(--komentar-aksen, #2e75b6);
    }
    .teks { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    ::slotted([slot="nama"]) {
      font-weight: bold;
      color: var(--komentar-nama, #1f4e78);
      font-size: 0.95rem;
    }
    ::slotted(:not([slot])) {
      font-size: 0.95rem;
    }
    .aksi-komentar { display: flex; gap: 6px; }
    button {
      cursor: pointer;
      padding: .3rem .6rem;
      border-radius: 6px;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .btn-hapus {
      border: 1px solid #d9534f;
      background: transparent;
      color: #d9534f;
    }
    .btn-hapus:hover { background: #d9534f; color: white; }
    .btn-edit {
      border: 1px solid var(--komentar-aksen, #1f4e78);
      background: transparent;
      color: var(--komentar-aksen, #1f4e78);
    }
    .btn-edit:hover { background: var(--komentar-aksen, #1f4e78); color: white; }
  </style>
  <div class="komentar">
    <div class="teks">
      <slot name="nama">Anonim</slot>
      <slot>(kosong)</slot>
    </div>
    <div class="aksi-komentar">
      <button type="button" class="btn-edit" part="tombol-edit">Edit</button>
      <button type="button" class="btn-hapus" part="tombol-hapus">Hapus</button>
    </div>
  </div>`;

class KartuKomentar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(templateKomentar.content.cloneNode(true));

    this.shadowRoot.querySelector(".btn-hapus").addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("hapus-komentar", {
        detail: { id: this.dataset.id },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot.querySelector(".btn-edit").addEventListener("click", () => {
      // Ambil teks dari elemen slotted di light DOM
      const namaEl = this.querySelector('[slot="nama"]');
      const pesanEl = this.querySelector(':not([slot])');
      this.dispatchEvent(new CustomEvent("edit-komentar", {
        bubbles: true,
        composed: true,
        detail: {
          id: this.dataset.id,
          nama: namaEl ? namaEl.textContent : "",
          pesan: pesanEl ? pesanEl.textContent : "",
          elemen: this,
        },
      }));
    });
  }

  disconnectedCallback() {
    console.log("kartu-komentar dilepas dari halaman");
  }
}
customElements.define("kartu-komentar", KartuKomentar);


/* ---------- <daftar-artikel> dari API ---------- */
function buatKartu(post) {
  const kartu = document.createElement("kartu-artikel");
  kartu.dataset.id = post.id;

  const judul = document.createElement("h3");
  judul.slot = "judul";                 // masuk ke <slot name="judul">
  judul.textContent = post.title;       // textContent: aman dari XSS

  const isi = document.createElement("p");  //  <slot> default
  isi.textContent = post.body;

  kartu.append(judul, isi);
  return kartu;
}

class DaftarArtikel extends HTMLElement {
  #sudahMuat = false;

  connectedCallback() {
    if (this.#sudahMuat) return;
    this.#sudahMuat = true;
    this.muat();
  }

  async muat() {
    this.textContent = "Memuat artikel...";
    const batas = Number(this.getAttribute("batas")) || 5;

    try {
      const res = await fetch(`https://jsonplaceholder.typicode.com/posts?_limit=${batas}`);
      if (!res.ok) throw new Error("Status: " + res.status);
      const data = await res.json();

      this.replaceChildren(...data.map(buatKartu));

      // Beri tahu halaman bahwa kartu sudah siap
      this.dispatchEvent(new CustomEvent("artikel-dimuat", {
        detail: { jumlah: data.length },
        bubbles: true,
      }));
    } catch (error) {
      console.error(error);
      const pesan = document.createElement("p");
      pesan.textContent = "Gagal memuat artikel, silakan coba lagi.";
      const ulang = document.createElement("button");
      ulang.type = "button";
      ulang.textContent = "Coba lagi";
      ulang.addEventListener("click", () => this.muat());
      this.replaceChildren(pesan, ulang);
    }
  }
}
customElements.define("daftar-artikel", DaftarArtikel);
