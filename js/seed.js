// ─────────────────────────────────────────────────────────────
// js/seed.js — ใส่ข้อมูลตัวอย่างลง Firestore ครั้งเดียว (สัปดาห์ที่ 6)
// ข้อมูลชุดนี้คัดลอกมาจากหัวข้อ 7 ของ leaveeasy-spec.md
// รันได้จาก seed.html เท่านั้น ไม่ได้เชื่อมกับหน้าจอหลักทั้ง 5 หน้า
// ─────────────────────────────────────────────────────────────

async function seedData(บันทึกสถานะ) {
  var batch = db.batch();

  // 📁 users
  [
    { id: "u001", name: "สมชาย ใจดี",   email: "somchai@example.com", role: "employee" },
    { id: "u002", name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" },
    { id: "u003", name: "สมศรี ตั้งใจ",  email: "somsri@example.com",  role: "hr" }
  ].forEach(function (u) {
    batch.set(db.collection("users").doc(u.id), { name: u.name, email: u.email, role: u.role });
  });

  // 📁 leaveTypes
  [
    { id: "lt001", name: "ลาพักร้อน" },
    { id: "lt002", name: "ลาป่วย" },
    { id: "lt003", name: "ลากิจ" }
  ].forEach(function (t) {
    batch.set(db.collection("leaveTypes").doc(t.id), { name: t.name });
  });

  // 📁 leaveRequests
  var leaveRequests = [
    {
      id: "lr001", title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
      reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
      status: "รอพิจารณา",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002", approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-09-07", endDate: "2026-09-09", createdAt: "2026-09-01 09:15"
    },
    {
      id: "lr002", title: "ลาป่วยไข้หวัดใหญ่",
      reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
      status: "อนุมัติ",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002", approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
      startDate: "2026-08-24", endDate: "2026-08-25", createdAt: "2026-08-24 08:05"
    },
    {
      id: "lr003", title: "ลากิจไปทำบัตรประชาชน",
      reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
      status: "รอพิจารณา",
      requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
      approverId: "", approverName: "",
      leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
      startDate: "2026-09-15", endDate: "2026-09-15", createdAt: "2026-09-10 16:30"
    },
    {
      id: "lr004", title: "ลาพักร้อนช่วงวันหยุดยาว",
      reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
      status: "ไม่อนุมัติ",
      requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
      approverId: "u002", approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
      startDate: "2026-10-12", endDate: "2026-10-16", createdAt: "2026-09-20 11:00"
    },
    {
      id: "lr005", title: "ลาป่วยไปพบแพทย์ตามนัด",
      reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
      status: "รอพิจารณา",
      requesterId: "u001", requesterName: "สมชาย ใจดี",
      approverId: "u002", approverName: "สมหญิง รักงาน",
      leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
      startDate: "2026-09-22", endDate: "2026-09-22", createdAt: "2026-09-18 14:45"
    }
  ];
  leaveRequests.forEach(function (r) {
    var ข้อมูล = Object.assign({}, r);
    delete ข้อมูล.id;
    batch.set(db.collection("leaveRequests").doc(r.id), ข้อมูล);
  });

  // 📁 approvals (โฟลเดอร์ย่อยของแต่ละใบลา — lr003 และ lr005 ไม่มีความเห็น)
  var approvalsByRequest = {
    lr001: [
      { id: "ap001", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ", createdAt: "2026-09-01 13:40" },
      { id: "ap002", authorId: "u003", authorName: "สมศรี ตั้งใจ",
        message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล", createdAt: "2026-09-02 10:05" }
    ],
    lr002: [
      { id: "ap003", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้", createdAt: "2026-08-24 09:20" }
    ],
    lr004: [
      { id: "ap004", authorId: "u002", authorName: "สมหญิง รักงาน",
        message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ", createdAt: "2026-09-20 15:10" }
    ]
  };
  Object.keys(approvalsByRequest).forEach(function (requestId) {
    approvalsByRequest[requestId].forEach(function (a) {
      batch.set(
        db.collection("leaveRequests").doc(requestId).collection("approvals").doc(a.id),
        { authorId: a.authorId, authorName: a.authorName, message: a.message, createdAt: a.createdAt }
      );
    });
  });

  บันทึกสถานะ("กำลังบันทึกลง Firestore…");
  await batch.commit();
  บันทึกสถานะ("✅ ใส่ข้อมูลตัวอย่างสำเร็จ — เปิด Firebase Console เพื่อตรวจสอบได้เลย");
}
