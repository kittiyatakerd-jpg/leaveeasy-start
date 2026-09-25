// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: ต้องล็อกอินก่อน แล้วอ่าน/แก้/ลบ Firestore จริง
// ─────────────────────────────────────────────────────────────

(function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  var กล่องสรุปAI = document.getElementById("กล่องสรุปAI");
  var เนื้อหาสรุปAI = document.getElementById("เนื้อหาสรุปAI");
  var ปุ่มสรุปAI = document.getElementById("ปุ่มสรุปAI");
  var เอกสารใบลา = db.collection("leaveRequests").doc(รหัสใบลา);

  var ผู้ใช้ปัจจุบัน = null;
  var ใบ = null;
  var ความเห็น = [];

  เมื่อรู้ผู้ใช้(function (ผู้ใช้) {
    ผู้ใช้ปัจจุบัน = ผู้ใช้;
    โหลดข้อมูล();
  });

  function โหลดข้อมูล() {
    Promise.all([
      เอกสารใบลา.get(),
      เอกสารใบลา.collection("approvals").get()
    ]).then(function (ผลลัพธ์) {
      var เอกสาร = ผลลัพธ์[0];
      if (!เอกสาร.exists) {
        กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
        return;
      }
      ใบ = Object.assign({ id: เอกสาร.id }, เอกสาร.data());
      ความเห็น = ผลลัพธ์[1].docs.map(function (c) { return Object.assign({ id: c.id }, c.data()); });

      วาดใบลา();
      วาดความเห็น();
      วาดสรุปAI();
      กล่องความเห็น.classList.remove("hidden");
      กล่องสรุปAI.classList.remove("hidden");
      document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
      ปุ่มสรุปAI.addEventListener("click", ให้AIสรุป);
    }).catch(function (err) {
      กล่องใบลา.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
    });
  }

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ / ลบ ขึ้นเฉพาะใบที่ยังรอพิจารณา
    // (สัปดาห์นี้ยังไม่แยกสิทธิ์ตาม role — ใครล็อกอินอยู่ก็เห็นปุ่มเหมือนกันหมด จะแยกจริงสัปดาห์ที่ 8)
    if (ใบ.status === "รอพิจารณา") {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        '<button type="button" class="btn-ghost" id="ปุ่มลบ">ลบใบลานี้</button>' +
        "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะหรือลบต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── วาดกล่องสรุป AI (ถ้าเคยสรุปไว้แล้วให้โชว์เลยโดยไม่ต้องกดใหม่) ──
  function วาดสรุปAI() {
    if (ใบ.aiSuggestion) {
      เนื้อหาสรุปAI.innerHTML = '<div class="alert alert-ai">' + esc(ใบ.aiSuggestion) + "</div>";
      ปุ่มสรุปAI.textContent = "ให้ AI สรุปใหม่อีกครั้ง";
    } else {
      เนื้อหาสรุปAI.innerHTML = '<p class="hint">ยังไม่มีสรุปจาก AI — กดปุ่มด้านล่างเพื่อให้ AI อ่านใบลานี้แล้วสรุปให้</p>';
    }
  }

  // ── ให้ AI อ่านใบลา + ความเห็นทั้งหมด แล้วสรุปให้หัวหน้าอ่านก่อนตัดสินใจ ──
  // AI แค่สรุปให้อ่าน ไม่ตัดสินใจแทน — สถานะจริงเปลี่ยนเฉพาะตอนคนกดปุ่มอนุมัติ/ไม่อนุมัติเท่านั้น
  async function ให้AIสรุป() {
    ปุ่มสรุปAI.disabled = true;
    ปุ่มสรุปAI.textContent = "🤖 กำลังสรุป...";

    var รายการความเห็นข้อความ = ความเห็น.length === 0
      ? "ยังไม่มีความเห็นจากผู้อนุมัติ"
      : ความเห็น.map(function (c) { return "- " + c.authorName + ": " + c.message; }).join("\n");

    var คำถาม =
      "นี่คือใบขอลาที่รอการพิจารณา ช่วยสรุปสั้นๆ ไม่เกิน 3 ประโยคให้หัวหน้าอ่านก่อนตัดสินใจ " +
      "ห้ามแนะนำว่าควรอนุมัติหรือไม่อนุมัติ แค่สรุปสาระสำคัญให้อ่านง่ายเท่านั้น\n\n" +
      "ผู้ขอลา: " + ใบ.requesterName + "\n" +
      "ประเภทการลา: " + ใบ.leaveTypeName + "\n" +
      "วันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate + "\n" +
      "หัวข้อ: " + ใบ.title + "\n" +
      "เหตุผล: " + ใบ.reason + "\n" +
      "ความเห็นที่มีอยู่แล้ว:\n" + รายการความเห็นข้อความ;

    var ตัวตัดเวลา = new AbortController();
    var ตัวจับเวลา = setTimeout(function () { ตัวตัดเวลา.abort(); }, 15000);

    try {
      var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ตัวตัดเวลา.signal,
        headers: {
          "Authorization": "Bearer " + OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: คำถาม }]
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);

      var data = await res.json();
      var คำตอบ = (data.choices[0].message.content || "").trim();
      var เวลา = เวลาตอนนี้();

      // เขียนผลสรุปกลับลงเอกสารใบลา (แก้เฉพาะช่อง aiSuggestion) + เก็บ log ไว้ในโฟลเดอร์ย่อย aiLog
      await เอกสารใบลา.update({ aiSuggestion: คำตอบ });
      await เอกสารใบลา.collection("aiLog").add({ input: คำถาม, output: คำตอบ, createdAt: เวลา });

      ใบ.aiSuggestion = คำตอบ;
      วาดสรุปAI();
    } catch (err) {
      var ข้อความ = err.name === "AbortError" ? "AI ตอบช้าเกิน 15 วินาที" : "เรียก AI ไม่สำเร็จ: " + err.message;
      เนื้อหาสรุปAI.innerHTML = '<div class="alert alert-error">⚠️ ' + esc(ข้อความ) + "</div>";
    } finally {
      clearTimeout(ตัวจับเวลา);
      ปุ่มสรุปAI.disabled = false;
      if (!ปุ่มสรุปAI.textContent.includes("สรุปใหม่")) ปุ่มสรุปAI.textContent = "ให้ AI สรุปใบลานี้ให้หัวหน้าอ่าน";
    }
  }

  // ── เปลี่ยนสถานะจริงใน Firestore ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }
    // แก้เฉพาะช่อง status เท่านั้น ห้ามเขียนทับช่องอื่น
    เอกสารใบลา.update({ status: สถานะใหม่ }).then(function () {
      ใบ.status = สถานะใหม่;
      วาดใบลา();
    }).catch(function (err) {
      alert("เปลี่ยนสถานะไม่สำเร็จ: " + err.message);
    });
  }

  // ── ลบใบลา (เฉพาะสถานะ รอพิจารณา) ──
  function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;
    เอกสารใบลา.delete().then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      alert("ลบไม่สำเร็จ: " + err.message);
    });
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ลง Firestore ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    // ผู้เขียนความเห็น = คนที่ล็อกอินอยู่จริง
    var ความเห็นใหม่ = {
      authorId: ผู้ใช้ปัจจุบัน.uid,
      authorName: ผู้ใช้ปัจจุบัน.displayName || ผู้ใช้ปัจจุบัน.email,
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    เอกสารใบลา.collection("approvals").add(ความเห็นใหม่).then(function (เอกสารที่สร้าง) {
      ความเห็น.push(Object.assign({ id: เอกสารที่สร้าง.id }, ความเห็นใหม่));
      ช่อง.value = "";
      วาดความเห็น();
    }).catch(function (err) {
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
      เตือน.classList.remove("hidden");
    });
  }
})();
