// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ/สมัครสมาชิก (สัปดาห์ที่ 7)
// หน้านี้ไม่ผ่าน auth-guard (ไม่งั้นจะเด้งเข้าตัวเองวนซ้ำ)
// ─────────────────────────────────────────────────────────────

(function () {
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ฟอร์มเข้าสู่ระบบ = document.getElementById("ฟอร์มเข้าสู่ระบบ");
  var ฟอร์มสมัครสมาชิก = document.getElementById("ฟอร์มสมัครสมาชิก");
  var แท็บเข้าสู่ระบบ = document.getElementById("แท็บเข้าสู่ระบบ");
  var แท็บสมัครสมาชิก = document.getElementById("แท็บสมัครสมาชิก");

  // ถ้าล็อกอินอยู่แล้ว ไม่ต้องมาหน้านี้ซ้ำ
  auth.onAuthStateChanged(function (ผู้ใช้) {
    if (ผู้ใช้) ไปหน้าที่ตั้งใจ();
  });

  แท็บเข้าสู่ระบบ.addEventListener("click", function () { สลับแท็บ(true); });
  แท็บสมัครสมาชิก.addEventListener("click", function () { สลับแท็บ(false); });

  function สลับแท็บ(เป็นเข้าสู่ระบบ) {
    ฟอร์มเข้าสู่ระบบ.classList.toggle("hidden", !เป็นเข้าสู่ระบบ);
    ฟอร์มสมัครสมาชิก.classList.toggle("hidden", เป็นเข้าสู่ระบบ);
    แท็บเข้าสู่ระบบ.className = เป็นเข้าสู่ระบบ ? "btn" : "btn-ghost";
    แท็บสมัครสมาชิก.className = เป็นเข้าสู่ระบบ ? "btn-ghost" : "btn";
    ซ่อนเตือน();
  }

  ฟอร์มเข้าสู่ระบบ.addEventListener("submit", function (e) {
    e.preventDefault();
    ซ่อนเตือน();
    var อีเมล = document.getElementById("loginEmail").value.trim();
    var รหัสผ่าน = document.getElementById("loginPassword").value;
    if (!อีเมล || !รหัสผ่าน) { แสดงเตือน("กรอกอีเมลและรหัสผ่านก่อน"); return; }

    auth.signInWithEmailAndPassword(อีเมล, รหัสผ่าน).then(function () {
      ไปหน้าที่ตั้งใจ();
    }).catch(function (err) {
      แสดงเตือน("เข้าสู่ระบบไม่สำเร็จ: " + err.message);
    });
  });

  ฟอร์มสมัครสมาชิก.addEventListener("submit", function (e) {
    e.preventDefault();
    ซ่อนเตือน();
    var ชื่อ = document.getElementById("signupName").value.trim();
    var อีเมล = document.getElementById("signupEmail").value.trim();
    var รหัสผ่าน = document.getElementById("signupPassword").value;
    if (!ชื่อ || !อีเมล || !รหัสผ่าน) { แสดงเตือน("กรอกให้ครบทุกช่องก่อน"); return; }

    auth.createUserWithEmailAndPassword(อีเมล, รหัสผ่าน).then(function (ผลลัพธ์) {
      var ผู้ใช้ = ผลลัพธ์.user;
      return ผู้ใช้.updateProfile({ displayName: ชื่อ }).then(function () {
        // สมัครสำเร็จแล้วสร้างไฟล์ใหม่ในโฟลเดอร์ users พร้อม role เริ่มต้นเป็น employee
        return db.collection("users").doc(ผู้ใช้.uid).set({
          name: ชื่อ, email: อีเมล, role: "employee"
        });
      });
    }).then(function () {
      ไปหน้าที่ตั้งใจ();
    }).catch(function (err) {
      แสดงเตือน("สมัครสมาชิกไม่สำเร็จ: " + err.message);
    });
  });

  function ไปหน้าที่ตั้งใจ() {
    var ปลายทาง = new URLSearchParams(location.search).get("redirect") || "leave-requests.html";
    location.href = ปลายทาง;
  }

  function แสดงเตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
  function ซ่อนเตือน() {
    กล่องเตือน.classList.add("hidden");
  }
})();
