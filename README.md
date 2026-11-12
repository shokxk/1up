# 1UP — Персональный трекер привычек (Telegram Mini App)

Минималистичное приложение для ежедневной дисциплины на 365 дней в стиле **Apple Health / Apple Fitness**, созданное специально для Telegram Mini Apps (`@oneup365bot`).

---

## ✨ Возможности

1. **Главный экран «Сегодня»**
   - Логотип **1UP**, текущая дата, счётчик `День X из 365`, индикатор серии (`🔥 X дней`).
   - Круговой индикатор прогресса дня (`4/6`) и статус темпа.
   - 6 ежедневных привычек:
     1. **Тренировка** — 5 минут (с поддержкой режима «Восстановление»).
     2. **Бег** — 10 минут (с поддержкой режима «Восстановление»).
     3. **Турник** — 5 минут (с поддержкой режима «Восстановление»).
     4. **Права (Обучение на водительские права)** — 10 минут.
     5. **Намаз / изучение** — 10 минут + отдельные отметки 5 обязательных молитв (*Фаджр, Зухр, Аср, Магриб, Иша*) без ограничения таймером.
     6. **Чтение книги** — 5 минут.
   - Полноэкранный таймер привычки с возможностью изменить фактически потраченное время.
   - Ежедневная мотивационная фраза без агрессивной геймификации (пропуск дня не обнуляет общий 365-дневный прогресс).

2. **Раздел «Календарь»**
   - Месячный календарь в стиле Apple Calendar.
   - Программа: **9 ноября 2026 года — 8 ноября 2027 года (365 дней)**.
   - Цветовая индикация:
     - 🟢 **Зелёный** — все привычки выполнены.
     - 🟢 **Светло-зелёный** — выполнены частично.
     - ⚪ **Серый** — ничего не выполнено.
     - Будущие дни — нейтральные.
   - При нажатии на любой день открывается карточка выполненных привычек и потраченного времени с возможностью редактирования.

3. **Раздел «Прогресс» и «Достижения»**
   - Переключатель **Неделя / Месяц / Год** с графиком выполнения по дням недели.
   - Реальная статистика из базы SQLite: дней подряд, общее время развития, пройдено дней из 365, общий прогресс и процент по каждой привычке.
   - 5 уровней достижений: **Первый день**, **7 дней подряд**, **30 дней**, **100 дней**, **365 дней**.

4. **Telegram-бот (`@oneup365bot`)**
   - Кнопка запуска Mini App **«🚀 Открыть 1UP»**.
   - Команды: `/start`, `/today`, `/stats`, `/settings`.
   - Автоматические уведомления по часовому поясу **Asia/Tashkent**:
     - `07:00` — утреннее напоминание с планом на день.
     - `22:00` — вечерний отчёт о выполнении.

---

## 🚀 Быстрый запуск локально

### 1. Установка зависимостей Backend (Python + FastAPI + aiogram)

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
```

### 2. Установка и сборка Frontend (React + TypeScript + Tailwind CSS)

```powershell
npm install
npm run build
```

### 3. Настройка `.env`

Проверьте файл `.env` в корне проекта:

```env
BOT_TOKEN=9195942921:AAGFRfh2l3CjXx8DDbmyr0G3ncQ9-xF61Dc
BOT_USERNAME=oneup365bot
ALLOWED_TELEGRAM_ID=
DEV_MODE=true
WEBAPP_URL=http://localhost:8000
TIMEZONE=Asia/Tashkent
PROGRAM_START_DATE=2026-11-09
PROGRAM_DAYS=365
```

- При `DEV_MODE=true` вы можете открыть интерфейс прямо в браузере по адресу `http://localhost:8000` (или `http://localhost:5173` при запуске `npm run dev`) — все отметки реально сохраняются в базу SQLite `backend/oneup.db`.
- В продакшене установите `DEV_MODE=false` и укажите ваш личный Telegram ID в `ALLOWED_TELEGRAM_ID`. Сервер будет строго проверять криптографическую подпись `Telegram.WebApp.initData` (HMAC-SHA256).

### 4. Запуск сервера и бота

```powershell
.\.venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

После запуска:
- Веб-интерфейс и API доступны на `http://localhost:8000`
- Telegram-бот `@oneup365bot` автоматически запускается в том же процессе и отвечает на команды `/start`, `/today`, `/stats`, `/settings`.

---

## 🤖 Настройка в @BotFather и размещение на HTTPS-сервере

Telegram требует **HTTPS** для открытия Mini App внутри мессенджера.

### Вариант А: Быстрый запуск через Cloudflare Tunnel / ngrok
1. Запустите локальный сервер на порту `8000`.
2. Создайте HTTPS-туннель:
   ```powershell
   ngrok http 8000
   ```
3. Скопируйте полученный `https://xxxx.ngrok-free.app` в `.env` → `WEBAPP_URL=https://xxxx.ngrok-free.app` и перезапустите сервер.

### Вариант Б: Размещение на VPS (Ubuntu + Nginx + Certbot)
1. Скопируйте проект на сервер в `/opt/1up`, выполните `npm ci && npm run build`, создайте `.venv` и установите `requirements.txt`.
2. В `.env` установите `DEV_MODE=false`, `ALLOWED_TELEGRAM_ID=<ваш_telegram_id>` и `WEBAPP_URL=https:// ваш-домен.ru`.
3. Создайте systemd-сервис `/etc/systemd/system/1up.service`:
   ```ini
   [Unit]
   Description=1UP Telegram Mini App & Bot
   After=network.target

   [Service]
   WorkingDirectory=/opt/1up
   ExecStart=/opt/1up/.venv/bin/uvicorn backend.main:app --host 127.0.0.1 --port 8000
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
4. Настройте Nginx с SSL-сертификатом Let's Encrypt (`certbot --nginx -d ваш-домен.ru`) с `proxy_pass http://127.0.0.1:8000;`.

### Подключение Mini App в @BotFather
1. Откройте `@BotFather` в Telegram.
2. Отправьте команду `/mybots` → выберите `@oneup365bot`.
3. Перейдите в **Bot Settings** → **Menu Button** → **Configure menu button**.
4. Отправьте ваш `HTTPS` URL и название кнопки: `Открыть 1UP`.
