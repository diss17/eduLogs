/**
 * Tests de infraestructura — eduLogs Frontend
 *
 * Validan que el entorno de desarrollo esté correctamente configurado:
 *   - Test 1: npm install resuelve todas las dependencias
 *   - Test 2: npm run dev inicia el servidor de Vite
 *   - Test 3: npm run build compila sin errores TypeScript
 * Cómo ejecutar:
 *   npx vitest run frontend.infra.test.ts --reporter=verbose
 * Requisitos:
 *   - Node.js >= 18
 *   - Ejecutar desde la raíz del proyecto (donde está /frontend)
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { describe, test, expect, beforeAll, afterAll } from 'vitest';

// Ruta absoluta a la carpeta frontend
const FRONTEND_DIR = resolve(__dirname, '../frontend');

// Timeout alto para operaciones de red / compilación
const INSTALL_TIMEOUT = 120_000; // 2 min
const BUILD_TIMEOUT = 60_000;  // 1 min
const DEV_TIMEOUT = 30_000;  // 30 s

// TEST 1 — npm install


describe('Test 1 — Inicializar proyecto frontend con React y Vite', () => {
    beforeAll(() => {
        // Se ejecuta npm install de forma síncrona antes de todos los asserts
        execSync('npm install', {
            cwd: FRONTEND_DIR,
            stdio: 'pipe',
            timeout: INSTALL_TIMEOUT,
        });
    }, INSTALL_TIMEOUT);

    test('se genera la carpeta node_modules/', () => {
        expect(existsSync(resolve(FRONTEND_DIR, 'node_modules'))).toBe(true);
    });

    test('react está instalado', () => {
        expect(
            existsSync(resolve(FRONTEND_DIR, 'node_modules/react'))
        ).toBe(true);
    });

    test('react-dom está instalado', () => {
        expect(
            existsSync(resolve(FRONTEND_DIR, 'node_modules/react-dom'))
        ).toBe(true);
    });

    test('vite está instalado', () => {
        expect(
            existsSync(resolve(FRONTEND_DIR, 'node_modules/vite'))
        ).toBe(true);
    });

    test('typescript está instalado', () => {
        expect(
            existsSync(resolve(FRONTEND_DIR, 'node_modules/typescript'))
        ).toBe(true);
    });

    test('@vitejs/plugin-react está instalado', () => {
        expect(
            existsSync(resolve(FRONTEND_DIR, 'node_modules/@vitejs/plugin-react'))
        ).toBe(true);
    });

    test('node_modules contiene más de 10 paquetes', () => {
        const packages = readdirSync(resolve(FRONTEND_DIR, 'node_modules'));
        expect(packages.length).toBeGreaterThan(10);
    });
});


// TEST 2 — npm run dev

describe('Test 2 — Servidor de desarrollo inicia correctamente', () => {
    let devProcess: ReturnType<typeof spawn> | null = null;
    let serverUrl = '';
    let serverOutput = '';

    beforeAll(async () => {
        await new Promise<void>((resolve, reject) => {
            devProcess = spawn('npm', ['run', 'dev', '--', '--open=false'], {
                cwd: FRONTEND_DIR,
                shell: true,
                // No abrimos el navegador automáticamente durante el test
                env: { ...process.env, BROWSER: 'none' },
            });

            const timeout = setTimeout(() => {
                reject(new Error('Timeout: el servidor no inició en 30 segundos'));
            }, DEV_TIMEOUT);

            devProcess.stdout?.on('data', (data: Buffer) => {
                const chunk = data.toString();
                serverOutput += chunk;

                // Vite imprime la URL cuando está listo
                const match = chunk.match(/Local:\s+(http:\/\/localhost:\d+)/);
                if (match) {
                    serverUrl = match[1];
                    clearTimeout(timeout);
                    resolve();
                }
            });

            devProcess.stderr?.on('data', (data: Buffer) => {
                serverOutput += data.toString();
            });

            devProcess.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }, DEV_TIMEOUT);

    afterAll(() => {
        // Matamos el proceso de Vite al terminar los tests
        if (devProcess) {
            devProcess.kill('SIGTERM');
        }
    });

    test('el servidor imprime una URL de localhost', () => {
        expect(serverUrl).toMatch(/^http:\/\/localhost:\d+$/);
    });

    test('el puerto asignado es un número válido (> 1024)', () => {
        const port = parseInt(serverUrl.split(':')[2], 10);
        expect(port).toBeGreaterThan(1024);
    });

    test('la salida del servidor contiene "ready" o "Local"', () => {
        expect(serverOutput.toLowerCase()).toMatch(/ready|local/);
    });

    test('el servidor responde HTTP 200 en la URL reportada', async () => {
        const response = await fetch(serverUrl);
        expect(response.status).toBe(200);
    });

    test('la respuesta contiene un documento HTML', async () => {
        const response = await fetch(serverUrl);
        const contentType = response.headers.get('content-type') ?? '';
        expect(contentType).toContain('text/html');
    });
});

// TEST 3 — npm run build

describe('Test 3 — Build de producción genera correctamente', () => {
    let buildOutput = '';
    let buildError = '';
    let buildExitCode = 0;

    beforeAll(() => {
        try {
            const result = execSync('npm run build 2>&1', {
                cwd: FRONTEND_DIR,
                encoding: 'utf-8',
                timeout: BUILD_TIMEOUT,
            });
            buildOutput = result;
        } catch (err: any) {
            buildError = err.stdout ?? err.message;
            buildExitCode = err.status ?? 1;
        }
    }, BUILD_TIMEOUT);

    test('el build termina sin errores (exit code 0)', () => {
        expect(buildExitCode).toBe(0);
    });

    test('no hay errores de TypeScript en la salida', () => {
        // tsc reporta errores con "error TS" seguido de un código numérico
        expect(buildOutput + buildError).not.toMatch(/error TS\d+/);
    });

    test('se genera la carpeta dist/', () => {
        expect(existsSync(resolve(FRONTEND_DIR, 'dist'))).toBe(true);
    });

    test('dist/ contiene el archivo index.html', () => {
        expect(existsSync(resolve(FRONTEND_DIR, 'dist/index.html'))).toBe(true);
    });

    test('dist/assets/ existe con los bundles JS y CSS', () => {
        const assetsDir = resolve(FRONTEND_DIR, 'dist/assets');
        expect(existsSync(assetsDir)).toBe(true);

        const files = readdirSync(assetsDir);
        const hasJS = files.some(f => f.endsWith('.js'));
        const hasCSS = files.some(f => f.endsWith('.css'));

        expect(hasJS).toBe(true);
        expect(hasCSS).toBe(true);
    });

    test('la salida del build reporta el tamaño de los bundles generados', () => {
        // Vite imprime "kB" o "KB" al listar los archivos generados
        expect(buildOutput.toLowerCase()).toMatch(/kb/);
    });
});