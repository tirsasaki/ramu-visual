(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("promptForm");
  const fields = {
    productName: $("productName"), subtitle: $("subtitle"), weight: $("weight"),
    contents: $("contents"), price: $("price"), leftStrip: $("leftStrip"),
    rightStrip: $("rightStrip"), visualConcept: $("visualConcept"), ratio: $("ratio"),
    camera: $("camera"), lighting: $("lighting"), quality: $("quality"),
    watermarkEnabled: $("watermarkEnabled"), watermarkText: $("watermarkText")
  };
  let activeView = "json";
  let toastTimer;

  const example = {
    productName: "Luwak White Koffie",
    subtitle: "Original",
    weight: "19 g × 9 saset",
    contents: "9 saset kopi instan 3-in-1",
    price: "Rp15.000 per bungkus",
    leftStrip: "Kopi Instan 3-in-1\nWhite Coffee Original",
    rightStrip: "Berat: 19 g × 9 saset\nBPOM RI Terdaftar",
    visualConcept: "foto iklan produk yang hangat di atas meja kayu, suasana kafe pada pagi hari, latar interior lembut dan kabur, properti pendukung alami, serta nuansa nyaman dan menggugah selera",
    ratio: "1:1",
    camera: "sejajar mata, menghadap lurus ke produk",
    lighting: "cahaya pagi yang hangat, lembut, dan realistis",
    quality: "fotografi produk sangat realistis, detail tinggi, tajam",
    watermarkEnabled: true,
    watermarkText: "Griya Bunga Asri · Blok MM No 1"
  };

  function value(name) { return fields[name].value.trim(); }
  function lines(name) { return value(name).split(/\n+/).map((item) => item.trim()).filter(Boolean); }

  function buildData() {
    const watermarkOn = fields.watermarkEnabled.checked;
    return {
      versi_skema: "1.1",
      jenis_generasi: "gambar_produk_jualan",
      produk: {
        nama: value("productName"),
        subjudul: value("subtitle"),
        berat: value("weight"),
        isi: value("contents"),
        harga: value("price")
      },
      konsep_visual: value("visualConcept"),
      left_strip: lines("leftStrip"),
      right_strip: lines("rightStrip"),
      pengaturan_gambar: {
        rasio: fields.ratio.value,
        sudut_kamera: fields.camera.value,
        pencahayaan: fields.lighting.value,
        kualitas: fields.quality.value,
        komposisi: "produk utama dominan di tengah, informasi pendukung tertata rapi, ruang visual tidak terlalu padat"
      },
      tanda_air: {
        aktif: watermarkOn,
        teks: watermarkOn ? value("watermarkText") : "",
        posisi: watermarkOn ? "pojok kiri bawah" : "tidak digunakan",
        gaya: watermarkOn ? "jelas, rapi, tidak menutupi produk" : ""
      },
      acuan_produk: {
        gunakan_foto_unggahan: true,
        pertahankan: ["bentuk kemasan", "logo", "warna produk", "tulisan pada kemasan"]
      },
      larangan: [
        "jangan mengubah bentuk, logo, warna, atau tulisan pada kemasan",
        "jangan membuat tulisan acak atau salah eja",
        "jangan menambahkan produk lain yang tidak diminta",
        "jangan menutupi produk utama dengan properti atau teks"
      ]
    };
  }

  function sentence(label, content) { return content ? `${label} ${content}.` : ""; }

  function buildPrompt(data) {
    const p = data.produk;
    const s = data.pengaturan_gambar;
    const watermark = data.tanda_air.aktif
      ? `Tambahkan tanda air bertuliskan “${data.tanda_air.teks}” di pojok kiri bawah; tampilkan dengan jelas dan rapi tanpa menutupi produk.`
      : "Jangan tambahkan tanda air.";
    return [
      `Buat gambar iklan produk yang profesional untuk ${p.nama || "produk pada foto acuan"}.`,
      sentence("Subjudul produk:", p.subjudul),
      sentence("Berat:", p.berat),
      sentence("Isi produk:", p.isi),
      sentence("Harga yang ditampilkan:", p.harga),
      `Konsep visual: ${data.konsep_visual || "tampilan produk komersial yang bersih dan menarik"}`,
      `Gunakan komposisi ${s.rasio}, sudut kamera ${s.sudut_kamera}, dengan ${s.pencahayaan}.`,
      `Gaya hasil: ${s.kualitas}. Produk utama harus dominan di tengah dan informasi pendukung tertata rapi.`,
      data.left_strip.length ? `Buat panel informasi vertikal di sebelah kiri produk dengan setiap butir terpisah dan ikon sederhana: ${data.left_strip.join("; ")}.` : "",
      data.right_strip.length ? `Buat panel informasi vertikal di sebelah kanan produk dengan setiap butir terpisah dan ikon sederhana: ${data.right_strip.join("; ")}.` : "",
      p.harga ? `Tampilkan harga “${p.harga}” dalam kotak harga yang jelas di area kanan bawah.` : "",
      watermark,
      "Gunakan foto yang diunggah sebagai acuan utama. Pertahankan secara akurat bentuk kemasan, logo, warna produk, dan seluruh tulisan pada kemasan.",
      "Jangan menghasilkan tulisan acak atau salah eja, jangan menambahkan produk lain, dan jangan menutupi produk utama dengan properti atau teks."
    ].filter(Boolean).join(" ");
  }

  function render() {
    const data = buildData();
    const valid = Boolean(data.produk.nama && data.konsep_visual);
    $("jsonOutput").textContent = JSON.stringify(data, null, 2);
    $("promptOutput").textContent = buildPrompt(data);
    $("previewName").textContent = data.produk.nama || "Nama produk belum diisi";
    $("previewMeta").textContent = [data.produk.subjudul, data.produk.berat, data.produk.harga].filter(Boolean).join(" · ") || "Lengkapi rincian produk";
    $("validBadge").textContent = valid ? "JSON valid" : "Perlu dilengkapi";
    $("validBadge").classList.toggle("invalid", !valid);
    $("watermarkField").classList.toggle("disabled", !data.tanda_air.aktif);
    fields.watermarkText.disabled = !data.tanda_air.aktif;
    $("saveState").innerHTML = `<i></i> ${valid ? "Hasil diperbarui" : "Lengkapi isian wajib"}`;
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    $("toast").textContent = message;
    $("toast").classList.add("show");
    toastTimer = setTimeout(() => $("toast").classList.remove("show"), 2200);
  }

  function switchView(view) {
    activeView = view;
    const isJson = view === "json";
    $("jsonTab").classList.toggle("active", isJson);
    $("promptTab").classList.toggle("active", !isJson);
    $("jsonTab").setAttribute("aria-selected", String(isJson));
    $("promptTab").setAttribute("aria-selected", String(!isJson));
    $("jsonView").hidden = !isJson;
    $("promptView").hidden = isJson;
    $("jsonView").classList.toggle("active", isJson);
    $("promptView").classList.toggle("active", !isJson);
    $("copyLabel").textContent = isJson ? "Salin JSON" : "Salin prompt";
    $("downloadButton").style.display = isJson ? "block" : "none";
  }

  function applyValues(data) {
    Object.keys(fields).forEach((key) => {
      if (!(key in data)) return;
      if (fields[key].type === "checkbox") fields[key].checked = Boolean(data[key]);
      else fields[key].value = Array.isArray(data[key]) ? data[key].join("\n") : data[key];
    });
    render();
  }

  async function copyResult() {
    const content = activeView === "json" ? $("jsonOutput").textContent : $("promptOutput").textContent;
    try {
      await navigator.clipboard.writeText(content);
      $("copyIcon").textContent = "✓";
      showToast(activeView === "json" ? "JSON berhasil disalin" : "Prompt berhasil disalin");
      setTimeout(() => $("copyIcon").textContent = "⧉", 1600);
    } catch (_) {
      showToast("Tidak dapat menyalin otomatis. Pilih teks secara manual.");
    }
  }

  function downloadJson() {
    const data = JSON.stringify(buildData(), null, 2);
    const safeName = (value("productName") || "prompt-produk").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const url = URL.createObjectURL(new Blob([data], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeName || "prompt-produk"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Berkas JSON diunduh");
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    render();
    showToast("Hasil sudah diperbarui");
    if (window.innerWidth < 1000) $("jsonTab").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $("jsonTab").addEventListener("click", () => switchView("json"));
  $("promptTab").addEventListener("click", () => switchView("prompt"));
  $("copyButton").addEventListener("click", copyResult);
  $("downloadButton").addEventListener("click", downloadJson);
  $("exampleButton").addEventListener("click", () => { applyValues(example); showToast("Contoh kopi dimuat"); });
  $("resetButton").addEventListener("click", () => {
    form.reset();
    Object.values(fields).forEach((field) => {
      if (field.tagName === "INPUT" && field.type !== "checkbox") field.value = "";
      if (field.tagName === "TEXTAREA") field.value = "";
    });
    fields.watermarkEnabled.checked = false;
    render();
    showToast("Formulir dikosongkan");
  });

  function registerWebMcp() {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const report = () => {};
    try {
      void Promise.resolve(context.registerTool({
        name: "susun_prompt_produk",
        title: "Susun prompt produk",
        description: "Mengisi formulir produk dan memperbarui JSON serta prompt Flow yang terlihat di halaman.",
        inputSchema: {
          type: "object",
          properties: {
            nama_produk: { type: "string", minLength: 1 },
            subjudul: { type: "string" },
            berat: { type: "string" },
            isi_produk: { type: "string" },
            harga: { type: "string" },
            left_strip: { type: "array", items: { type: "string" } },
            right_strip: { type: "array", items: { type: "string" } },
            konsep_visual: { type: "string", enum: Array.from(fields.visualConcept.options).map((option) => option.value) },
            rasio: { type: "string", enum: ["1:1", "4:5", "9:16", "16:9"] },
            tanda_air: { type: "string" }
          },
          required: ["nama_produk", "konsep_visual"],
          additionalProperties: false
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== "object" || !String(input.nama_produk || "").trim() || !String(input.konsep_visual || "").trim()) {
            throw new Error("Nama produk dan konsep visual wajib diisi.");
          }
          applyValues({
            productName: String(input.nama_produk), subtitle: String(input.subjudul || ""),
            weight: String(input.berat || ""), contents: String(input.isi_produk || ""),
            price: String(input.harga || ""),
            leftStrip: Array.isArray(input.left_strip) ? input.left_strip : [],
            rightStrip: Array.isArray(input.right_strip) ? input.right_strip : [],
            visualConcept: String(input.konsep_visual), ratio: input.rasio || "1:1",
            watermarkEnabled: Boolean(input.tanda_air), watermarkText: String(input.tanda_air || "")
          });
          return { status: "siap", nama_produk: value("productName"), json: buildData(), prompt: buildPrompt(buildData()) };
        }
      }, { signal: controller.signal })).catch(report);
    } catch (_) { report(); }
  }

  render();
  registerWebMcp();
})();
