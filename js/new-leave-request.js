// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่จริงใน Firestore
  db.collection("leaveTypes").get().then(function (ผลลัพธ์) {
    ผลลัพธ์.docs.forEach(function (เอกสาร) {
      var ประเภท = เอกสาร.data();
      var ตัวเลือก = document.createElement("option");
      ตัวเลือก.value = เอกสาร.id;
      ตัวเลือก.textContent = ประเภท.name;
      ช่องประเภท.appendChild(ตัวเลือก);
    });
  }).catch(function (err) {
    เตือน("โหลดประเภทการลาไม่สำเร็จ: " + err.message);
  });

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

    // สัปดาห์ที่ 7 ยังไม่ต่อ Authentication (มาในส่วน C) จึงสมมติว่าผู้ขอลาคือ สมชาย ใจดี ไปก่อน
    db.collection("leaveRequests").add({
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: "u001", requesterName: "สมชาย ใจดี",
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
