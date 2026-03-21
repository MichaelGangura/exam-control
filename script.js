let config = { t: "", c: "", f: "", name: "", active: false, loadCount: 0 };

// 1. МИТТЄВА ПЕРЕВІРКА РЕЖИМУ
function checkMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherUI = document.getElementById('teacher-ui-main');
    const studentUI = document.getElementById('student-ui');

    if (urlParams.has('t')) {
        if (studentUI) studentUI.style.display = 'block';
        if (teacherUI) teacherUI.remove();

        config.t = urlParams.get('t').replace(/[^a-zA-Z0-9:]/g, '');
        config.c = urlParams.get('c').replace(/[^0-9-]/g, '');
        config.f = decodeURIComponent(urlParams.get('f'));

        ['instruction', '.video-grid', 'donate', 'nav'].forEach(el => {
            const found = document.querySelector(el) || document.getElementById(el);
            if (found) found.style.display = 'none';
        });
    } else {
        if (teacherUI) teacherUI.style.display = 'block';
        if (studentUI) studentUI.remove();
    }
}

document.addEventListener('DOMContentLoaded', checkMode);

window.onload = function () {
    const frame = document.getElementById('test-frame');
    if (frame) { frame.addEventListener('load', handleFrameLoad); }
};

// 2. ВДОСКОНАЛЕНЕ КОПІЮВАННЯ
async function copyToClipboard() {
    const linkDisplay = document.getElementById('copy-link');
    const textToCopy = linkDisplay.textContent || linkDisplay.innerText;
    if (!textToCopy) return;
    try {
        await navigator.clipboard.writeText(textToCopy);
        alert("✅ Посилання успішно скопійовано!");
    } catch (err) {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        alert("✅ Посилання скопійовано!");
        document.body.removeChild(textArea);
    }
}

// 3. МИТТЄВА ВІДПРАВКА (Удосконалено mode: 'no-cors' для обходу блокувань)
async function tg(msg) {
    if (!config.t || !config.c) return;
    const url = `https://api.telegram.org/bot${config.t}/sendMessage?chat_id=${config.c}&text=${encodeURIComponent(msg)}`;

    // keepalive дозволяє відправити повідомлення навіть при закритті вкладки
    // mode: 'no-cors' дозволяє запиту пройти без суворих перевірок безпеки браузера
    fetch(url, {
        method: 'GET',
        mode: 'no-cors',
        keepalive: true
    }).catch(e => console.log("TG Sync..."));
}

function handleFrameLoad() {
    if (config.active) {
        config.loadCount++;
        if (config.loadCount >= 2) {
            document.getElementById('finish-btn').style.display = 'block';
        }
    }
}

function generateSession() {
    if (document.getElementById('h-pot').value !== "") return;
    const token = document.getElementById('t-token').value.trim();
    const chatid = document.getElementById('t-chatid').value.trim();
    const form = document.getElementById('t-form').value.trim();

    if (!token || !chatid || !form) return alert("Заповніть усі поля!");

    config.t = token; config.c = chatid;
    const link = `${window.location.origin}${window.location.pathname}?t=${token}&c=${chatid}&f=${encodeURIComponent(form)}`;

    document.getElementById('copy-link').textContent = link;
    document.getElementById('qrcode').innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { text: link, width: 180, height: 180 });
    document.getElementById('link-display').style.display = 'block';

    tg(`📢 СЕСІЯ СТВОРЕНА.`);
}

function startExam() {
    const nameInput = document.getElementById('s-name').value.trim();
    if (!nameInput) return alert("Введіть ім'я!");
    config.name = nameInput.replace(/[^\w\sа-яА-ЯіїєґІЇЄҐ-]/g, '');

    document.getElementById('student-ui').style.display = 'none';
    config.loadCount = 0;
    config.active = true;

    const frame = document.getElementById('test-frame');
    frame.src = config.f;
    frame.style.display = 'block';

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
    }
    tg(`✅ УЧЕНЬ ПРИЄДНАВСЯ: ${config.name}`);
}

function finishExam() {
    if (confirm("Здати роботу?")) {
        tg(`🏁 УЧЕНЬ ЗАВЕРШИВ: ${config.name}`);
        config.active = false;
        alert("Роботу здано!");
        location.reload();
    }
}

// 4. КОНТРОЛЬ ПОВЕДІНКИ
document.addEventListener("visibilitychange", () => {
    if (config.active && config.name) {
        if (document.hidden) {
            document.getElementById('alert-banner').style.display = 'block';
            tg(`🚨 УВАГА! Учень ${config.name} ЗГОРНУВ БРАУЗЕР!`);
        } else {
            document.getElementById('alert-banner').style.display = 'none';
            tg(`↩️ Учень ${config.name} ПОВЕРНУВСЯ.`);
        }
    }
});

window.addEventListener("pagehide", () => {
    if (config.active && config.name) {
        tg(`⚠️ Учень ${config.name} ЗАКРИВ вкладку.`);
    }
});

// 5. РОЗУМНЕ БЛОКУВАННЯ
document.oncontextmenu = function (e) {
    if (e.target.tagName === 'INPUT' || e.target.id === 'copy-link') {
        return true;
    }
    e.preventDefault();
    return false;
};