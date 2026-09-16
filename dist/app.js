(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("promptForm");
  const fields = {
    productName: $("productName"), subtitle: $("subtitle"), productCategory: $("productCategory"),
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
    const wholesaleTotal = wholesaleMin != null && wholesalePrice != null
      ? wholesaleMin * wholesalePrice
      : null;
    const unit = fields.priceUnit.value;
    const weight = amount("weightValue", "weightUnit");
    const contents = amount("contentsValue", "contentsUnit");
    const leftInfo = [...new Set([...(weight ? [`Weight: ${weight}`] : []), ...lines("leftStrip")])];
    const rightInfo = [...new Set([...(contents ? [`Contents: ${contents}`] : []), ...lines("rightStrip")])];
    const priceRule = wholesaleOn && basePrice != null && wholesaleMin != null && wholesalePrice != null
      ? `Baris 1: ${rupiah(basePrice)}/${unit} · Baris 2: ${wholesaleMin} ${unit} ${rupiah(wholesaleTotal)}`
      : basePrice != null ? `Baris 1: ${rupiah(basePrice)}/${unit}` : "";
    return {
      versi_skema: "1.9",
      jenis_generasi: "gambar_produk_jualan",
      produk: {
        nama: value("productName"),
        subjudul: value("subtitle"),
        subjudul_tampilan: value("subtitle") ? `✦ ${value("subtitle")} ✦` : "",
        kategori: fields.productCategory.value,
        berat: weight,
        isi: contents
      },
      konsep_visual: value("visualConcept"),
      informasi_kiri: leftInfo,
      informasi_kanan: rightInfo,
      pengaturan_gambar: {
        rasio: fields.ratio.value,
        sudut_kamera: fields.camera.value,
        pencahayaan: fields.lighting.value,
        kualitas: fields.quality.value,
        komposisi: "produk utama dominan di tengah, judul dan subjudul berada di area atas, panel informasi horizontal terbaca jelas, ruang visual tidak terlalu padat",
        bahasa_informasi: "English",
        sajian_produk: ["makanan", "minuman"].includes(fields.productCategory.value)
          ? "wajib menampilkan sajian siap konsumsi yang sesuai di dekat kemasan"
          : "tidak wajib"
      },
      footer: {
        harga: {
          mata_uang: "IDR",
          harga_satuan: basePrice,
          satuan: unit,
          grosir: {
            aktif: wholesaleOn,
            minimal_pembelian: wholesaleOn ? wholesaleMin : null,
            harga_per_satuan: wholesaleOn ? wholesalePrice : null,
            total_harga: wholesaleOn ? wholesaleTotal : null
          },
          aturan_tampilan: priceRule,
          format_ringkas_grosir: wholesaleOn && wholesaleMin != null && wholesalePrice != null
            ? `${wholesaleMin} ${unit} · ${rupiah(wholesaleTotal)}`
            : "",
          posisi: "pojok kanan bawah",
          latar: "persegi panjang besar dengan warna gelap dari keluarga warna utama produk, ujung kiri bawah membentuk lancip seperti ekor label harga",
          warna_teks: "putih atau sangat terang dengan kontras tinggi",
          line_1: basePrice != null ? {
            jenis: "harga_normal",
            teks: `IDR ${Number(basePrice).toLocaleString("en-US")}/${unit}`,
            gaya: "lebih besar, tebal, paling dominan"
          } : null,
          line_2: wholesaleOn && wholesaleMin != null && wholesaleTotal != null ? {
            jenis: "total_grosir",
            teks: `${wholesaleMin} ${unit} · IDR ${Number(wholesaleTotal).toLocaleString("en-US")}`,
            gaya: "lebih kecil dari line_1, berada tepat di bawah line_1"
          } : null
        },
        tanda_air: {
          aktif: watermarkOn,
          teks: watermarkOn ? value("watermarkText") : "",
          posisi: watermarkOn ? "pojok kiri bawah" : "tidak digunakan",
          ikon: watermarkOn ? "ikon warung atau etalase toko sederhana di sebelah kiri teks" : "",
          latar: watermarkOn ? "persegi panjang mendatar berwarna terang, panjang sedang mengikuti ikon dan teks dengan padding proporsional" : "",
          warna_teks: watermarkOn ? "hitam" : "",
          gaya: watermarkOn ? "label ringkas, jelas, rapi, tidak menutupi produk; salin teks persis tanpa terjemahan atau perubahan urutan" : ""
        },
        sistem_visual: {
          motif: "sepasang label dagang modern yang serasi",
          palet: "warna terang untuk tanda air dan warna gelap dari keluarga warna yang sama untuk harga",
          konsistensi: "radius sudut, bayangan lembut, ketebalan visual, dan jarak dari tepi dibuat seragam",
          skala: "kartu harga sekitar 35–50 persen lebih besar daripada label tanda air",
          larangan: "jangan menyambungkan kedua label dan jangan membuat salah satunya selebar penuh gambar"
        }
      },
      aturan_teks: {
        judul: "wajib tampil besar dan terbaca di bagian atas gambar, salin nama produk persis, gunakan efek cahaya lembut pada tepi huruf",
        subjudul: "wajib tampil tepat di bawah judul dalam format ✦ Subjudul ✦, gunakan efek cahaya lembut pada tepi huruf",
        panel_informasi: "gunakan kartu informasi dengan bagian ikon di atas dan teks di bawah; area ikon memakai warna gelap, area informasi memakai warna sedikit lebih cerah dari keluarga warna yang sama; jangan putar teks",
        bahasa: "gunakan bahasa Inggris yang alami untuk semua informasi tambahan; nama produk, subjudul, merek, sertifikasi, angka, satuan, dan tanda air/alamat tetap persis"
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
      ? `Di POJOK KIRI BAWAH, buat label tanda air berbentuk PERSEGI PANJANG MENDATAR berwarna terang. Di dalamnya, tempatkan ikon garis warung/etalase toko yang kecil dan berwarna hitam, lalu teks literal “${data.footer.tanda_air.teks}” berwarna hitam tepat di sebelah kanannya. Lebar label harus sedang dan mengikuti lebar ikon plus teks, dengan padding horizontal sekitar 20–30% dari tinggi huruf; jangan membuatnya terlalu panjang atau selebar gambar. Gunakan sudut membulat halus dan bayangan tipis. Pertahankan setiap kata, urutan, kapitalisasi, angka, tanda baca, dan spasi pada teks. Jangan terjemahkan, jangan susun ulang, dan jangan menormalkan alamat tersebut.`
      : "Jangan tambahkan tanda air.";
    const pricePrompt = price.harga_satuan == null ? "" : (price.grosir.aktif && price.line_2)
      ? `Tempatkan kartu harga hanya di POJOK KANAN BAWAH. Kartu berupa persegi panjang berwarna gelap, sekitar 35–50% lebih besar daripada label tanda air, dengan UJUNG LANCIP berbentuk ekor label harga pada SUDUT KIRI BAWAH. Sudut lainnya membulat halus. Gunakan teks putih atau sangat terang dan bayangan tipis. Susun isi sebagai dua baris vertikal yang benar-benar terpisah, bukan satu kalimat dan bukan satu baris mendatar.\nLINE 1 — HARGA NORMAL: “${price.line_1.teks}”. Jadikan LINE 1 lebih besar, tebal, dan dominan.\nLINE 2 — HARGA GROSIR: “${price.line_2.teks}”. Letakkan LINE 2 tepat di bawah LINE 1 dengan jeda vertikal yang jelas dan ukuran sedikit lebih kecil. LINE 2 hanya boleh memuat jumlah barang dan TOTAL harga paket grosir; jangan tampilkan harga grosir per satuan, tanda /${price.satuan}, rentang jumlah, kata “starting from”, atau kalimat tambahan. DILARANG menggabungkan LINE 1 dan LINE 2 pada baseline atau baris yang sama.`
      : `Di POJOK KANAN BAWAH, tampilkan “${price.line_1.teks}” di dalam kartu persegi panjang gelap yang cukup besar, dengan ujung lancip seperti ekor label harga pada sudut kiri bawah. Gunakan teks terang yang besar, tebal, dan jelas.`;
    const footerStyle = "Buat tanda air dan kartu harga sebagai satu SISTEM VISUAL FOOTER yang konsisten: gunakan keluarga warna yang sama, radius sudut yang serasi, bayangan lembut yang sama, ketebalan visual seimbang, jarak aman dari tepi yang setara, dan garis dasar yang rapi. Tanda air tetap lebih ringkas di kiri bawah; kartu harga lebih besar dan dominan di kanan bawah. Jangan menyambungkan kedua elemen dan jangan membuatnya menjadi bilah selebar penuh gambar.";
    const titleRule = p.nama
      ? `WAJIB tampilkan judul “${p.nama}” sebagai teks besar, tebal, dan mudah dibaca di bagian atas gambar. Tambahkan efek cahaya lembut yang tipis pada tepi huruf—seperti halo halus, bukan neon kuat—agar judul terasa lebih hidup tanpa mengurangi ketajaman teks.`
      : "";
    const subtitleRule = p.subjudul
      ? `WAJIB tampilkan subjudul tepat sebagai “${p.subjudul_tampilan}” di bawah judul, dengan satu simbol ✦ di awal dan satu simbol ✦ di akhir. Gunakan ukuran lebih kecil dari judul dan efek cahaya lembut yang tipis pada tepi huruf. Pastikan simbol bintang, teks, spasi, dan urutannya terlihat jelas.`
      : "";
    const servingRule = ["makanan", "minuman"].includes(p.kategori)
      ? `Karena ini produk ${p.kategori}, WAJIB tampilkan sajian siap konsumsi yang sesuai di dekat kemasan—terlihat lezat dan realistis, tidak mengganti kemasan, serta tidak menutupi logo atau informasi utama.`
      : "";
    const horizontalPanelRule = "Semua panel informasi harus berupa kartu yang proporsional dan mudah dibaca. Di dalam setiap kartu, tempatkan ikon sederhana pada BAGIAN ATAS dan teks informasi mendatar pada BAGIAN BAWAH. Area ikon memakai warna gelap; area teks memakai warna sedikit lebih cerah dari keluarga warna yang sama agar kombinasinya harmonis. Gunakan sudut membulat, kontras teks yang kuat, ukuran yang menyesuaikan panjang informasi, dan jarak yang lega. Jangan meletakkan ikon di samping teks, jangan menggunakan tulisan vertikal, dan jangan memutar teks.";
    const languageRule = "Gunakan bahasa Inggris yang alami dan ringkas untuk seluruh informasi tambahan pada panel. Terjemahkan manfaat atau klaim ke bahasa Inggris, tetapi pertahankan persis nama produk, teks inti subjudul, nama merek, BPOM/sertifikasi, angka, satuan, serta tanda air atau alamat yang diberikan pengguna. Hanya subjudul yang boleh diberi simbol dekoratif ✦ di awal dan akhir sesuai aturan.";
    return [
      `Buat gambar iklan produk profesional untuk ${p.nama || "produk pada foto acuan"}.`,
      titleRule,
      subtitleRule,
      sentence("Berat:", p.berat),
      sentence("Isi produk:", p.isi),
      `Konsep visual: ${data.konsep_visual || "tampilan produk komersial yang bersih dan menarik"}`,
      `Gunakan komposisi ${s.rasio}, sudut kamera ${s.sudut_kamera}, dengan ${s.pencahayaan}.`,
      `Gaya hasil: ${s.kualitas}. Produk utama harus dominan di tengah; sisakan ruang atas khusus untuk judul dan subjudul.`,
      servingRule,
      horizontalPanelRule,
      languageRule,
      data.informasi_kiri.length ? `Tempatkan kelompok kartu informasi di sisi kiri atau kiri-bawah dengan isi: ${data.informasi_kiri.join("; ")}.` : "",
      data.informasi_kanan.length ? `Tempatkan kelompok kartu informasi di sisi kanan atau kanan-bawah dengan isi: ${data.informasi_kanan.join("; ")}.` : "",
      footerStyle,
      pricePrompt,
      watermark,
      "Gunakan foto yang diunggah sebagai acuan utama. Pertahankan secara akurat bentuk kemasan, logo, warna produk, dan seluruh tulisan pada kemasan.",
      "Pastikan judul dan subjudul benar-benar terlihat di hasil akhir. Jangan menghasilkan tulisan acak atau salah eja, jangan menambahkan produk lain, dan jangan menutupi produk utama dengan properti atau teks."
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
        description: "Mengisi formulir produk dan memperbarui JSON serta prompt gambar yang terlihat di halaman.",
        inputSchema: {
          type: "object",
          properties: {
            nama_produk: { type: "string", minLength: 1 },
            subjudul: { type: "string" },
            jenis_produk: { type: "string", enum: ["makanan", "minuman", "perawatan_diri", "produk_lain"] },
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
            productCategory: input.jenis_produk || "produk_lain",
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
