let config = { t: "", c: "", f: "", name: "", active: false, loadCount: 0 };

window.onload = function () {
    // 1. Налаштовуємо слухач для фрейму (замість атрибута onload в HTML)
    const frame = document.getElementById('test-frame');
    if (frame) {
        frame.addEventListener('load', handleFrameLoad);
    }

    // 2. Перевірка режиму учня
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('t')) {
        document.getElementById('teacher-ui-main').style.display = 'none';
        document.getElementById('student-ui').style.display = 'block';

        config.t = urlParams.get('t');
        config.c = urlParams.get('c');
        config.f = decodeURIComponent(urlParams.get('f'));
    }
};

// НАЙБІЛЬШ НАДІЙНИЙ МЕТОД ВІДПРАВКИ
async function tg(msg) {
    if (!config.t || !config.c) return;
    const url = `https://api.telegram.org/bot${config.t}/sendMessage?chat_id=${config.c}&text=${encodeURIComponent(msg)}`;

    // Використовуємо fetch з режимом no-cors, якщо звичайний блокується, 
    // але для Telegram краще стандартний, щоб бачити успіх.
    fetch(url).catch(err => console.error("TG Send Error:", err));
}

/* function handleFrameLoad() {
    if (config.active) {
        config.loadCount++;
        if (config.loadCount >= 2) {
            document.getElementById('finish-btn').style.display = 'block';
        }
    }
} */

function handleFrameLoad() {
    console.log("Фрейм завантажився, спроба №", config.loadCount + 1);
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

    config.t = token;
    config.c = chatid;

    const link = `${window.location.origin}${window.location.pathname}?t=${token}&c=${chatid}&f=${encodeURIComponent(form)}`;

    document.getElementById('copy-link').textContent = link;
    document.getElementById('qrcode').innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { text: link, width: 180, height: 180 });
    document.getElementById('link-display').style.display = 'block';

    tg(`📢 СЕСІЯ СТВОРЕНА. Очікуємо учнів.`);
}

function copyToClipboard() {
    const text = document.getElementById('copy-link').textContent;
    navigator.clipboard.writeText(text).then(() => alert("Скопійовано!"));
}

function startExam() {
    const nameInput = document.getElementById('s-name').value.trim();
    if (!nameInput) return alert("Введіть ім'я!");

    config.name = nameInput;
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
        tg(`🏁 УЧЕНЬ ЗАВЕРШИВ РОБОТУ: ${config.name}`);
        config.active = false;
        alert("Роботу здано.");
        location.reload();
    }
}

// ВІДСТЕЖЕННЯ ВИХОДУ ТА ПОВЕРНЕННЯ
document.addEventListener("visibilitychange", () => {
    if (config.active && config.name) {
        if (document.hidden) {
            document.getElementById('alert-banner').style.display = 'block';
            tg(`🚨 УВАГА! Учень ${config.name} ВИЙШОВ З БРАУЗЕРА!`);
        } else {
            document.getElementById('alert-banner').style.display = 'none';
            tg(`↩️ Учень ${config.name} повернувся до роботи.`);
        }
    }
});

// Дозволяємо контекстне меню (вставку) в інпутах
document.oncontextmenu = function (e) {
    if (e.target.tagName === 'INPUT') return true;
    e.preventDefault();
    return false;
};