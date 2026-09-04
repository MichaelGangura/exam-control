let config = { t: "", c: "", f: "", name: "", active: false, loadCount: 0 };

// 1. МИТТЄВА ПЕРЕВІРКА РЕЖИМУ (Вчитель / Учень)
function checkMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const tUI = document.getElementById('teacher-ui-main');
    const sUI = document.getElementById('student-ui');

    if (urlParams.has('t') && urlParams.has('c')) {
        // Режим учня
        if (tUI) tUI.style.display = 'none';
        if (sUI) sUI.style.display = 'block';

        // Зчитуємо параметри без жорсткого видалення символів
        config.t = urlParams.get('t').trim();
        config.c = urlParams.get('c').trim();
        config.f = decodeURIComponent(urlParams.get('f') || '');
    } else {
        // Режим вчителя
        if (tUI) tUI.style.display = 'block';
        if (sUI) sUI.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', checkMode);

window.onload = function () {
    const frame = document.getElementById('test-frame');
    if (frame) {
        frame.addEventListener('load', handleFrameLoad);
    }
};

// 2. НАДІЙНА ВІДПРАВКА ПОВІДОМЛЕНЬ У TELEGRAM
function tg(msg) {
    if (!config.t || !config.c) return;

    const endpoint = `https://api.telegram.org/bot${config.t}/sendMessage?chat_id=${config.c}&text=${encodeURIComponent(msg)}`;

    // Метод 1: Fetch із keepalive (працює при фоновому режимі)
    fetch(endpoint, { keepalive: true, mode: 'no-cors' }).catch(() => {
        // Метод 2: Резервний фолбек через Image-запит (ігнорує CORS та блокування браузера)
        const img = new Image();
        img.src = endpoint;
    });
}

function handleFrameLoad() {
    if (config.active) {
        config.loadCount++;
        if (config.loadCount >= 2) {
            document.getElementById('finish-btn').style.display = 'block';
        }
    }
}

// 3. ГЕНЕРАЦІЯ СЕСІЇ ВЧИТЕЛЕМ
function generateSession() {
    const hPot = document.getElementById('h-pot');
    if (hPot && hPot.value !== "") return;

    const token = document.getElementById('t-token').value.trim();
    const chatid = document.getElementById('t-chatid').value.trim();
    const form = document.getElementById('t-form').value.trim();

    if (!token || !chatid || !form) return alert("Заповніть усі поля!");

    config.t = token;
    config.c = chatid;
    config.f = form;

    const link = `${window.location.origin}${window.location.pathname}?t=${encodeURIComponent(token)}&c=${encodeURIComponent(chatid)}&f=${encodeURIComponent(form)}`;

    const copyBox = document.getElementById('copy-link');
    if (copyBox) copyBox.innerText = link;

    const qrcodeEl = document.getElementById('qrcode');
    if (qrcodeEl) {
        qrcodeEl.innerHTML = "";
        new QRCode(qrcodeEl, { text: link, width: 180, height: 180 });
    }

    document.getElementById('link-display').style.display = 'block';

    tg(`📢 СЕСІЯ СТВОРЕНА. Чекаємо на учнів.`);
}

// 4. КОПІЮВАННЯ ПОСИЛАННЯ
function copyToClipboard() {
    const copyBox = document.getElementById('copy-link');
    if (!copyBox) return;

    const linkText = copyBox.innerText;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(linkText).then(() => {
            alert("✅ Посилання скопійовано!");
        }).catch(() => fallbackCopy(linkText));
    } else {
        fallbackCopy(linkText);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert("✅ Посилання скопійовано!");
}

// 5. СТАРТ ТЕСТУ УЧНЕМ
function startExam() {
    const nameInput = document.getElementById('s-name');
    if (!nameInput) return;

    const rawName = nameInput.value.trim();
    if (!rawName) return alert("Введіть ім'я та прізвище!");

    config.name = rawName;

    document.getElementById('student-ui').style.display = 'none';
    config.loadCount = 0;

    const frame = document.getElementById('test-frame');
    if (frame) {
        frame.src = config.f;
        frame.style.display = 'block';
    }

    config.active = true;

    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }

    tg(`✅ УЧЕНЬ ПРИЄДНАВСЯ: ${config.name}`);
}

// 6. ЗАВЕРШЕННЯ ТЕСТУ
function finishExam() {
    if (confirm("Здати роботу?")) {
        tg(`🏁 УЧЕНЬ ЗАВЕРШИВ: ${config.name}`);
        config.active = false;
        alert("Роботу здано!");
        location.reload();
    }
}

// 7. СТАТУС ВІДСУТНОСТІ (Visibility Change)
document.addEventListener("visibilitychange", () => {
    if (config.active && config.name) {
        if (document.hidden) {
            const banner = document.getElementById('alert-banner');
            if (banner) banner.style.display = 'block';
            tg(`🚨 УВАГА! ${config.name} ВИЙШОВ З БРАУЗЕРА!`);
        } else {
            const banner = document.getElementById('alert-banner');
            if (banner) banner.style.display = 'none';
            tg(`↩️ Учень ${config.name} ПОВЕРНУВСЯ.`);
        }
    }
});

// Контекстне меню
document.oncontextmenu = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.id === 'copy-link') return true;
    e.preventDefault();
};