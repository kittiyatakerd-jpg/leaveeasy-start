// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องเหตุผล = document.getElementById("reason");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
  var ปุ่มAI = document.getElementById("ปุ่มAIจัดประเภท");
  var กล่องข้อเสนอAI = document.getElementById("ข้อเสนอAI");
  var ผู้ใช้ปัจจุบัน = null;
  var รายการประเภท = [];   // [{id, name}] เก็บไว้ให้ทั้งดรอปดาวน์และ AI ใช้ชุดเดียวกัน

  เมื่อรู้ผู้ใช้(function (ผู้ใช้) {
    ผู้ใช้ปัจจุบัน = ผู้ใช้;

    // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่จริงใน Firestore
    db.collection("leaveTypes").get().then(function (ผลลัพธ์) {
      ผลลัพธ์.docs.forEach(function (เอกสาร) {
        var ประเภท = เอกสาร.data();
        รายการประเภท.push({ id: เอกสาร.id, name: ประเภท.name });
        var ตัวเลือก = document.createElement("option");
        ตัวเลือก.value = เอกสาร.id;
        ตัวเลือก.textContent = ประเภท.name;
        ช่องประเภท.appendChild(ตัวเลือก);
      });
    }).catch(function (err) {
      เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
    });
  });

  ปุ่มAI.addEventListener("click", จัดประเภทด้วยAI);

  async function จัดประเภทด้วยAI() {
    var เหตุผล = ช่องเหตุผล.value.trim();
    กล่องข้อเสนอAI.classList.add("hidden");

    if (!เหตุผล) {
      กล่องข้อเสนอAI.textContent = "⚠️ กรอกเหตุผลการลาก่อน แล้ว AI ถึงจะจัดประเภทให้ได้";
      กล่องข้อเสนอAI.classList.remove("hidden");
      return;
    }
    if (รายการประเภท.length === 0) {
      กล่องข้อเสนอAI.textContent = "⚠️ ยังโหลดรายการประเภทการลาไม่เสร็จ ลองใหม่อีกครั้ง";
      กล่องข้อเสนอAI.classList.remove("hidden");
      return;
    }

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "🤖 กำลังคิด...";

    var ตัวตัดเวลา = new AbortController();
    var ตัวจับเวลา = setTimeout(function () { ตัวตัดเวลา.abort(); }, 15000);

    try {
      var รายชื่อ = รายการประเภท.map(function (t) { return t.name; }).join(", ");
      var res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        signal: ตัวตัดเวลา.signal,
        headers: {
          "Authorization": "Bearer " + OPENROUTER_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{
            role: "user",
            content:
              "นี่คือรายชื่อประเภทการลาที่มีอยู่จริงในระบบเท่านั้น: " + รายชื่อ + "\n" +
              "เหตุผลการลาของพนักงานคือ: \"" + เหตุผล + "\"\n" +
              "เลือกประเภทที่ตรงที่สุดจากรายชื่อด้านบนเท่านั้น ตอบเป็นชื่อประเภทตรงตัวเป๊ะคำเดียว ห้ามอธิบายเพิ่ม " +
              "ถ้าไม่มีประเภทไหนตรงเลย ให้ตอบคำว่า ไม่แน่ใจ"
          }]
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);

      var data = await res.json();
      var คำตอบ = (data.choices[0].message.content || "").trim();
      var ที่ตรงกัน = รายการประเภท.find(function (t) { return t.name === คำตอบ; });

      if (!ที่ตรงกัน) {
        กล่องข้อเสนอAI.textContent = "🤖 AI จัดประเภทให้ไม่ได้ (ตอบว่า \"" + esc(คำตอบ) + "\" ซึ่งไม่ตรงกับประเภทที่มีอยู่จริง) — เลือกเองด้านบนได้เลย";
        กล่องข้อเสนอAI.classList.remove("hidden");
        return;
      }

      ช่องประเภท.value = ที่ตรงกัน.id;
      กล่องข้อเสนอAI.innerHTML =
        '🤖 <strong>ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน:</strong> ' + esc(ที่ตรงกัน.name) +
        ' <span class="hint">(แก้เป็นประเภทอื่นในดรอปดาวน์ด้านบนได้ตามต้องการ)</span>';
      กล่องข้อเสนอAI.classList.remove("hidden");
    } catch (err) {
      var ข้อความ = err.name === "AbortError" ? "AI ตอบช้าเกิน 15 วินาที" : "เรียก AI ไม่สำเร็จ: " + err.message;
      กล่องข้อเสนอAI.textContent = "⚠️ " + ข้อความ + " — เลือกประเภทเองด้านบนแล้วบันทึกได้ตามปกติ";
      กล่องข้อเสนอAI.classList.remove("hidden");
    } finally {
      clearTimeout(ตัวจับเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = "🤖 ให้ AI ช่วยจัดประเภทการลา";
    }
  }

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ชื่อประเภท = ช่องประเภท.options[ช่องประเภท.selectedIndex].textContent;

    ปุ่มบันทึก.disabled = true;

    // requesterId เป็น uid จริงของคนที่ล็อกอินอยู่ (มาจาก auth-guard.js)
    db.collection("leaveRequests").add({
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้ปัจจุบัน.uid,
      requesterName: ผู้ใช้ปัจจุบัน.displayName || ผู้ใช้ปัจจุบัน.email,
      approverId: "", approverName: "",
      leaveTypeId: ค่า.leaveTypeId, leaveTypeName: ชื่อประเภท,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    }).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่มบันทึก.disabled = false;
      เตือน("บันทึกไม่สำเร็จ: " + err.message);
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
