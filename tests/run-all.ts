import fs from 'node:fs';
import path from 'node:path';
import type { TestResult } from './helpers';
import { runSyntheticSuite } from './synthetic.test';
import { runRealWorldSuite } from './real-world.test';
import { runHttpSuite } from './http-e2e.test';

const main = async (): Promise<void> => {
    const startedAt = new Date();
    const results: TestResult[] = [];

    console.log('=== SUITE 1/3: синтетика ===');
    results.push(...(await runSyntheticSuite()));

    console.log('\n=== SUITE 2/3: реальные данные из интернета ===');
    results.push(...(await runRealWorldSuite()));

    console.log('\n=== SUITE 3/3: e2e через HTTP (express) ===');
    results.push(...(await runHttpSuite()));

    const passed = results.filter((r) => r.status === 'PASS');
    const failed = results.filter((r) => r.status === 'FAIL');
    const skipped = results.filter((r) => r.status === 'SKIP');
    const durationMs = Date.now() - startedAt.getTime();

    const icon = (status: TestResult['status']): string => {
        if (status === 'PASS') { return '[PASS]'; }
        if (status === 'FAIL') { return '[FAIL]'; }
        return '[SKIP]';
    };
    for (const result of results) {
        const detail = result.detail ? ` — ${result.detail}` : '';
        console.log(`${icon(result.status)} ${result.suite} :: ${result.name}${detail}`);
    }
    console.log(
        `\nИТОГО: ${passed.length} PASS, ${failed.length} FAIL, ${skipped.length} SKIP из ${results.length} (${(durationMs / 1000).toFixed(1)}с)`,
    );

    const suites = [...new Set(results.map((r) => r.suite))];
    const lines: string[] = [
        '# Отчёт смоук-тестов (автогенерация)',
        '',
        `- Дата прогона: ${startedAt.toISOString()}`,
        `- Платформа: ${process.platform} ${process.arch}, Node ${process.version}`,
        `- Длительность: ${(durationMs / 1000).toFixed(1)} с`,
        `- Итог: **${passed.length} PASS**, ${failed.length} FAIL, ${skipped.length} SKIP из ${results.length}`,
        '',
    ];
    for (const suite of suites) {
        lines.push(`## ${suite}`, '', '| Статус | Тест | Время | Детали |', '|---|---|---|---|');
        for (const result of results.filter((r) => r.suite === suite)) {
            const ms = result.status === 'SKIP' ? '—' : `${result.ms} мс`;
            const detail = result.detail ?? '';
            const escapedDetail = detail.replaceAll('|', String.raw`\|`).slice(0, 300);
            lines.push(
                `| ${result.status} | ${result.name} | ${ms} | ${escapedDetail} |`,
            );

        }
        lines.push('');
    }
    lines.push(
        '## Как воспроизвести',
        '',
        '```bash',
        'pnpm install',
        'pnpm test:smoke          # все suites + перезапись этого отчёта',
        'pnpm test:smoke:synthetic # только синтетика (без интернета)',
        'pnpm test:smoke:real      # только реальные данные (нужен интернет)',
        'pnpm test:smoke:http      # только e2e через express',
        '```',
        '',
        'Реальные файлы кэшируются в `tests/.cache/` (в .gitignore).',
        '',
    );
    const reportPath = path.join(import.meta.dirname, 'REPORT.md');
    fs.writeFileSync(reportPath, lines.join('\n'), 'utf-8');
    console.log(`Отчёт: ${reportPath}`);
    process.exit(failed.length ? 1 : 0);
};

void main().catch((error) => {
    console.error('Критическая ошибка раннера:', error);
    process.exit(1);
});
