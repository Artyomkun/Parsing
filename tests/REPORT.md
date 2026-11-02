# Отчёт смоук-тестов (автогенерация)

- Дата прогона: 2026-10-15T17:44:37.121Z
- Платформа: win32 x64, Node v26.8.2
- Длительность: 7.0 с
- Итог: **46 PASS**, 0 FAIL, 0 SKIP из 46

## Синтетика (ffmpeg-фикстуры)

| Статус | Тест | Время | Детали |
|---|---|---|---|
| PASS | WAV -> MP3 (магические байты контейнера) | 243 мс |  |
| PASS | WAV -> WAV (roundtrip без перекодирования контейнера) | 127 мс |  |
| PASS | WAV -> OGG (Vorbis) | 146 мс |  |
| PASS | WAV -> AAC/M4A | 351 мс |  |
| PASS | WAV -> FLAC | 129 мс |  |
| PASS | WAV -> MP3: ffprobe подтверждает mp3/codec mp3 | 198 мс |  |
| PASS | Опции: sampleRate=22050, channels=1 применяются | 195 мс |  |
| PASS | Опция bitrate=64k применяется к MP3 | 228 мс |  |
| PASS | "Голый" base64 без JSON-payload тоже работает | 155 мс |  |
| PASS | data: URL во входе распознаётся decodeBase64 | 1 мс |  |
| PASS | audio2json: ffprobe видит wav, дорожку и длительность ~2с | 112 мс |  |
| PASS | video2audio: из mp4 извлекается только звук (видео отброшено) | 212 мс |  |
| PASS | video2audio с format=wav возвращает WAV-контейнер | 122 мс |  |
| PASS | EDGE: видео без аудиодорожки -> понятная ошибка ffmpeg | 80 мс |  |
| PASS | EDGE: мусор вместо аудиофайла -> ошибка, а не зависание/криш | 78 мс |  |
| PASS | EDGE: пустой вход -> NO_CONTENT | 1 мс |  |
| PASS | EDGE: неизвестный тип конвертации -> Unsupported | 0 мс |  |
| PASS | EDGE: битый JSON-payload -> понятная ошибка | 0 мс |  |
| PASS | Все новые типы зарегистрированы в диспетчере | 0 мс |  |
| PASS | EDGE: транскрипция без API-ключа -> понятная ошибка | 2 мс |  |
| PASS | audio2srt: сегменты API превращаются в SRT-таймкоды | 96 мс |  |
| PASS | audio2vtt: VTT-формат таймкодов (точка вместо запятой) | 27 мс |  |
| PASS | EDGE: API без сегментов -> один cue на всю длительность | 125 мс |  |
| PASS | EDGE: API вернул 500 -> ошибка со статусом в сообщении | 16 мс |  |
| PASS | EDGE: API вернул пустой текст -> «Пустой результат транскрипции» | 17 мс |  |
| PASS | pdf2text: текст извлекается из минимального PDF | 225 мс |  |
| PASS | pdf2json: totalPages=1 и текст страницы | 13 мс |  |
| PASS | EDGE: битый PDF -> ошибка, а не криш | 3 мс |  |
| PASS | EDGE: пустой PDF-буфер -> ошибка | 1 мс |  |

## Реальные данные (интернет)

| Статус | Тест | Время | Детали |
|---|---|---|---|
| PASS | Скачивание всех реальных фикстур | 5 мс |  |
| PASS | Реальный MP3 (MDN, roar) -> WAV: RIFF/WAVE + аудиодорожка | 197 мс |  |
| PASS | Реальный MP3 -> FLAC, OGG, AAC(M4A) | 537 мс |  |
| PASS | Реальный WAV (GitHub sample) -> MP3 + метаданные | 371 мс |  |
| PASS | Реальный OGG (Wikimedia) -> MP3 | 266 мс |  |
| PASS | Реальный M4A -> WAV и OGG (m4a-контейнер читается) | 317 мс |  |
| PASS | Реальное видео (Big Buck Bunny) -> MP3 + метаданные дорожки | 576 мс |  |
| PASS | Реальный PDF (pdfobject sample) -> текст через диспетчер convert() | 60 мс |  |
| PASS | Реальный PDF -> JSON: метаданные info + страницы | 38 мс |  |
| PASS | Реальный PDF -> pdfToText (mergePages=false) | 40 мс |  |

## E2E через HTTP (express /convert)

| Статус | Тест | Время | Детали |
|---|---|---|---|
| PASS | GET /convert/types отдаёт все аудио/PDF-типы | 7 мс |  |
| PASS | POST /convert: audio2wav по HTTP возвращает валидный WAV | 172 мс |  |
| PASS | POST /convert: audio2mp3 -> ogg -> flac цепочка по HTTP | 455 мс |  |
| PASS | POST /convert: audio2json по HTTP | 119 мс |  |
| PASS | POST /convert: pdf2text по HTTP | 8 мс |  |
| PASS | EDGE HTTP: неизвестный тип -> 500 + { success: false } | 4 мс |  |
| PASS | EDGE HTTP: нет type/data в теле -> 400 | 3 мс |  |

## Как воспроизвести

```bash
pnpm install
pnpm test:smoke          # все suites + перезапись этого отчёта
pnpm test:smoke:synthetic # только синтетика (без интернета)
pnpm test:smoke:real      # только реальные данные (нужен интернет)
pnpm test:smoke:http      # только e2e через express
```

Реальные файлы кэшируются в `tests/.cache/` (в .gitignore).
