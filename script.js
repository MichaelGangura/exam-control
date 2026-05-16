let config = { t: "", c: "", f: "", name: "", active: false, loadCount: 0 };

// 1. ПЕРЕВІРКА РЕЖИМУ (Викликається відразу для уникнення "миготіння")
function checkMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const tUI = document.getElementById('teacher-ui-main');
    const sUI = document.getElementById('student-ui');

    if (urlParams.has('t')) {
        // РЕЖИМ УЧНЯ
        if (tUI) tUI.style.display = 'none';
        if (sUI) sUI.style.display = 'block';

        // Приховуємо все зайве
        const selectors = ['#instruction', '.video-grid', '#donate', 'nav'];
        selectors.forEach(s => {
            const el = document.querySelector(s);
            if (el) el.style.display = 'none';
        });

        // БЕЗПЕКА: Очищення токенів (RegExp)
        config.t = urlParams.get('t').replace(/[^a-zA-Z0-9:]/g, '');
        config.c = urlParams.get('c').replace(/[^0-9-]/g, '');
        config.f = decodeURIComponent(urlParams.get('f'));
    } else {
        // РЕЖИМ ВЧИТЕЛЯ
        if (tUI) tUI.style.display = 'block';
        if (sUI) sUI.style.display = 'none';
    }
}

// Запуск перевірки миттєво
document.addEventListener('DOMContentLoaded', checkMode);

window.onload = function () {
    const frame = document.getElementById('test-frame');
    if (frame) {
        frame.addEventListener('load', handleFrameLoad);
    }
};

// ПРОСТИЙ І РОБОЧИЙ ФЕТЧ (як у вашому прикладі)
async function tg(msg) {
    if (!config.t || !config.c) return;
    fetch(`https://api.telegram.org/bot${config.t}/sendMessage?chat_id=${config.c}&text=${encodeURIComponent(msg)}`)
        .catch(e => console.error("TG error"));
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
    // Додайте <input type="text" id="h-pot" style="display:none"> в HTML для захисту від ботів
    const hPot = document.getElementById('h-pot');
    if (hPot && hPot.value !== "") return;

    const token = document.getElementById('t-token').value.trim();
    const chatid = document.getElementById('t-chatid').value.trim();
    const form = document.getElementById('t-form').value.trim();

    if (!token || !chatid || !form) return alert("Заповніть усі поля!");

    config.t = token; config.c = chatid;
    const link = `${window.location.origin}${window.location.pathname}?t=${token}&c=${chatid}&f=${encodeURIComponent(form)}`;

    const copyBox = document.getElementById('copy-link');
    if (copyBox) copyBox.innerText = link;

    document.getElementById('qrcode').innerHTML = "";
    new QRCode(document.getElementById("qrcode"), { text: link, width: 180, height: 180 });
    document.getElementById('link-display').style.display = 'block';

    tg(`📢 СЕСІЯ СТВОРЕНА. Чекаємо на учнів.`);
}

// КОПІЮВАННЯ З АЛЕРТОМ
function copyToClipboard() {
    const link = document.getElementById('copy-link').innerText;
    navigator.clipboard.writeText(link).then(() => {
        alert("✅ Посилання скопійовано!");
    });
}

function startExam() {
    const rawName = document.getElementById('s-name').value.trim();
    // БЕЗПЕКА: RegExp (тільки букви, цифри, пробіли)
    config.name = rawName.replace(/[^\w\sа-яА-ЯіїєґІЇЄҐ-]/g, '');

    if (!config.name) return alert("Введіть ім'я!");

    document.getElementById('student-ui').style.display = 'none';
    config.loadCount = 0;

    const frame = document.getElementById('test-frame');
    frame.src = config.f;
    frame.style.display = 'block';

    config.active = true;
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
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

// КОНТРОЛЬ ВИХОДУ
document.addEventListener("visibilitychange", () => {
    if (config.active && config.name) {
        if (document.hidden) {
            document.getElementById('alert-banner').style.display = 'block';
            tg(`🚨 УВАГА! ${config.name} ВИЙШОВ З БРАУЗЕРА!`);
        } else {
            document.getElementById('alert-banner').style.display = 'none';
            tg(`↩️ Учень ${config.name} ПОВЕРНУВСЯ.`);
        }
    }
});

// Дозволяємо меню тільки в інпутах і на посиланні для вчителя
document.oncontextmenu = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.id === 'copy-link') return true;
    e.preventDefault();
};