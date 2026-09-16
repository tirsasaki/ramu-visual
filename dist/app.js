(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("promptForm");
  const fields = {
    productName: $("productName"), subtitle: $("subtitle"),
    weightValue: $("weightValue"), weightUnit: $("weightUnit"),
    contentsValue: $("contentsValue"), contentsUnit: $("contentsUnit"),
    price: $("price"), priceUnit: $("priceUnit"),
    wholesaleEnabled: $("wholesaleEnabled"), wholesaleMinQty: $("wholesaleMinQty"),
    wholesalePrice: $("wholesalePrice"), leftStrip: $("leftStrip"),
    rightStrip: $("rightStrip"), visualConcept: $("visualConcept"), ratio: $("ratio"),
    camera: $("camera"), lighting: $("lighting"), quality: $("quality"),
    watermarkEnabled: $("watermarkEnabled"), watermarkText: $("watermarkText")
  };
  let activeView = "json";
  let toastTimer;

  function value(name) { return fields[name].value.trim(); }
  function lines(name) { return value(name).split(/\n+/).map((item) => item.trim()).filter(Boolean); }
  function amount(valueName, unitName) { return value(valueName) ? `${value(valueName)} ${fields[unitName].value}` : ""; }
  function numberValue(name) { return value(name) === "" ? null : Number(value(name)); }
  function rupiah(number) { return `Rp${Number(number || 0).toLocaleString("id-ID")}`; }

  function buildData() {
    const watermarkOn = fields.watermarkEnabled.checked;
    const wholesaleOn = fields.wholesaleEnabled.checked;
    const basePrice = numberValue("price");
    const wholesaleMin = numberValue("wholesaleMinQty");
    const wholesalePrice = numberValue("wholesalePrice");
    const unit = fields.priceUnit.value;
    const priceRule = wholesaleOn && basePrice != null && wholesaleMin != null && wholesalePrice != null
      ? `1–${Math.max(1, wholesaleMin - 1)} ${unit} ${rupiah(basePrice)}/${unit}; mulai ${wholesaleMin} ${unit} ${rupiah(wholesalePrice)}/${unit}`
      : basePrice != null ? `${rupiah(basePrice)}/${unit}` : "";
    return {
      versi_skema: "1.3",
      jenis_generasi: "gambar_produk_jualan",
      produk: {
        nama: value("productName"),
        subjudul: value("subtitle"),
        berat: amount("weightValue", "weightUnit"),
        isi: amount("contentsValue", "contentsUnit")
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
      footer: {
        harga: {
          mata_uang: "IDR",
          harga_satuan: basePrice,
          satuan: unit,
          grosir: {
            aktif: wholesaleOn,
            minimal_pembelian: wholesaleOn ? wholesaleMin : null,
            harga_per_satuan: wholesaleOn ? wholesalePrice : null
          },
          aturan_tampilan: priceRule
        },
        tanda_air: {
          aktif: watermarkOn,
          teks: watermarkOn ? value("watermarkText") : "",
          posisi: watermarkOn ? "pojok kiri bawah" : "tidak digunakan",
          gaya: watermarkOn ? "jelas, rapi, tidak menutupi produk" : ""
        }
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
    const price = data.footer.harga;
    const watermark = data.footer.tanda_air.aktif
      ? `Tambahkan tanda air bertuliskan “${data.footer.tanda_air.teks}” di pojok kiri bawah; tampilkan dengan jelas dan rapi tanpa menutupi produk.`
      : "Jangan tambahkan tanda air.";
    const pricePrompt = price.harga_satuan == null ? "" : price.grosir.aktif
      ? `Tampilkan kotak harga di kanan bawah dengan aturan: ${price.aturan_tampilan}. Bedakan harga satuan dan harga grosir dengan hierarki teks yang jelas.`
      : `Tampilkan harga ${rupiah(price.harga_satuan)} per ${price.satuan} dalam kotak harga yang jelas di kanan bawah.`;
    return [
      `Buat gambar iklan produk yang profesional untuk ${p.nama || "produk pada foto acuan"}.`,
      sentence("Subjudul produk:", p.subjudul),
      sentence("Berat:", p.berat),
      sentence("Isi produk:", p.isi),
      `Konsep visual: ${data.konsep_visual || "tampilan produk komersial yang bersih dan menarik"}`,
      `Gunakan komposisi ${s.rasio}, sudut kamera ${s.sudut_kamera}, dengan ${s.pencahayaan}.`,
      `Gaya hasil: ${s.kualitas}. Produk utama harus dominan di tengah dan informasi pendukung tertata rapi.`,
      data.left_strip.length ? `Buat panel informasi vertikal di sebelah kiri produk dengan setiap butir terpisah dan ikon sederhana: ${data.left_strip.join("; ")}.` : "",
      data.right_strip.length ? `Buat panel informasi vertikal di sebelah kanan produk dengan setiap butir terpisah dan ikon sederhana: ${data.right_strip.join("; ")}.` : "",
      pricePrompt,
      watermark,
      "Gunakan foto yang diunggah sebagai acuan utama. Pertahankan secara akurat bentuk kemasan, logo, warna produk, dan seluruh tulisan pada kemasan.",
      "Jangan menghasilkan tulisan acak atau salah eja, jangan menambahkan produk lain, dan jangan menutupi produk utama dengan properti atau teks."
    ].filter(Boolean).join(" ");
  }

  function render() {
    const data = buildData();
    const price = data.footer.harga;
    const wholesaleValid = !price.grosir.aktif || (
      Number.isFinite(price.grosir.minimal_pembelian) && price.grosir.minimal_pembelian >= 2 &&
      Number.isFinite(price.grosir.harga_per_satuan) && price.grosir.harga_per_satuan > 0 &&
      Number.isFinite(price.harga_satuan) && price.grosir.harga_per_satuan < price.harga_satuan
    );
    const valid = Boolean(data.produk.nama && data.konsep_visual && wholesaleValid);
    $("jsonOutput").textContent = JSON.stringify(data, null, 2);
    $("promptOutput").textContent = buildPrompt(data);
    $("validBadge").textContent = valid ? "JSON valid" : "Perlu dilengkapi";
    $("validBadge").classList.toggle("invalid", !valid);
    $("watermarkField").classList.toggle("disabled", !data.footer.tanda_air.aktif);
    fields.watermarkText.disabled = !data.footer.tanda_air.aktif;
    $("wholesaleFields").classList.toggle("disabled", !price.grosir.aktif);
    fields.wholesaleMinQty.disabled = !price.grosir.aktif;
    fields.wholesalePrice.disabled = !price.grosir.aktif;
    $("wholesaleUnitLabel").textContent = price.satuan;
    $("priceSummary").textContent = wholesaleValid
      ? (price.aturan_tampilan || "Isi harga untuk menampilkan ringkasan")
      : "Harga grosir harus lebih rendah dari harga satuan dan dimulai dari minimal 2 barang.";
    $("priceSummary").classList.toggle("invalid", !wholesaleValid);
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
  $("resetButton").addEventListener("click", () => {
    form.reset();
    Object.values(fields).forEach((field) => {
      if (field.tagName === "INPUT" && field.type !== "checkbox") field.value = "";
      if (field.tagName === "TEXTAREA") field.value = "";
    });
    fields.watermarkEnabled.checked = false;
    fields.wholesaleEnabled.checked = false;
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
            berat_nilai: { type: "number", minimum: 0 },
            berat_satuan: { type: "string", enum: ["ml", "gr", "kg"] },
            isi_nilai: { type: "number", minimum: 0 },
            isi_satuan: { type: "string", enum: ["pcs", "pack", "sachet"] },
            harga_nilai: { type: "number", minimum: 0 },
            harga_satuan: { type: "string", enum: ["kg", "pcs", "pack", "sachet"] },
            grosir_aktif: { type: "boolean" },
            grosir_minimum: { type: "integer", minimum: 2 },
            grosir_harga: { type: "number", minimum: 0 },
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
            weightValue: input.berat_nilai == null ? "" : String(input.berat_nilai),
            weightUnit: input.berat_satuan || "gr",
            contentsValue: input.isi_nilai == null ? "" : String(input.isi_nilai),
            contentsUnit: input.isi_satuan || "pcs",
            price: input.harga_nilai == null ? "" : String(input.harga_nilai),
            priceUnit: input.harga_satuan || "pcs",
            wholesaleEnabled: Boolean(input.grosir_aktif),
            wholesaleMinQty: input.grosir_minimum == null ? "5" : String(input.grosir_minimum),
            wholesalePrice: input.grosir_harga == null ? "" : String(input.grosir_harga),
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
