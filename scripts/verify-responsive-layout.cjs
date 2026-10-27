const { app, BrowserWindow } = require("electron");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const entryFile = path.join(projectRoot, "dist", "index.html");
const scales = [0.25, 0.3, 0.36, 0.5, 0.75, 1, 1.5];

function roundedRect(rect) {
  return Object.fromEntries(
    ["top", "right", "bottom", "left", "width", "height"].map((key) => [
      key,
      Math.round(rect[key] * 100) / 100,
    ]),
  );
}

async function inspectScale(window, scale) {
  window.setContentSize(
    Math.round(520 * scale),
    Math.round(460 * scale),
  );
  await window.webContents.executeJavaScript(
    `new Promise((resolve, reject) => {
      let attempts = 0;
      const waitForScale = () => {
        const applied = Number(document.querySelector('.cat-window')?.dataset.panelScale);
        if (Math.abs(applied - ${scale}) <= 0.005) {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
          return;
        }
        attempts += 1;
        if (attempts > 120) {
          reject(new Error('Timed out waiting for panel scale ${scale}; applied=' + applied));
          return;
        }
        requestAnimationFrame(waitForScale);
      };
      waitForScale();
    })`,
  );

  return window.webContents.executeJavaScript(`(() => {
    const panel = document.querySelector('.quota-panel, .compact-quota-panel');
    const footer = document.querySelector('.status-footer, .compact-footer');
    const resetCount = document.querySelector('.reset-count, .compact-reset-count');
    const catFace = document.querySelector('.compact-content .cat-face');
    const compactBrand = document.querySelector('.compact-content .compact-brand');
    const quotaSections = [...document.querySelectorAll('.quota-meter, .compact-quota')];
    const rect = (element) => element ? element.getBoundingClientRect() : null;
    const panelRect = rect(panel);
    const footerRect = rect(footer);
    const resetRect = rect(resetCount);
    const catFaceRect = rect(catFace);
    const compactBrandRect = rect(compactBrand);
    const quotaRects = quotaSections.map(rect);
    const failures = [];

    if (!panelRect || !footerRect || !resetRect || quotaRects.length !== 2) {
      failures.push('missing required two-quota layout elements');
    } else {
      if (resetRect.bottom > panelRect.bottom + 0.5) {
        failures.push('available reset count extends below quota panel');
      }
      if (resetRect.bottom > footerRect.top - 0.5) {
        failures.push('available reset count overlaps footer');
      }
      if (panelRect.bottom > footerRect.top - 0.5) {
        failures.push('quota panel overlaps footer');
      }
      for (let index = 1; index < quotaRects.length; index += 1) {
        if (quotaRects[index - 1].bottom > quotaRects[index].top + 0.5) {
          failures.push('quota sections overlap each other');
        }
      }
      if (document.querySelector('.cat-window')?.dataset.layout === 'compact') {
        const catFaceStyle = catFace && getComputedStyle(catFace);
        const catFaceVisible =
          catFaceRect &&
          catFaceRect.width > 1 &&
          catFaceRect.height > 1 &&
          catFaceStyle?.display !== 'none' &&
          catFaceStyle?.visibility !== 'hidden';
        if (!catFaceVisible) {
          failures.push('blinking cat eyes are hidden in compact layout');
        } else {
          const overlaps = (first, second) =>
            first.left < second.right - 0.5 &&
            first.right > second.left + 0.5 &&
            first.top < second.bottom - 0.5 &&
            first.bottom > second.top + 0.5;
          if (compactBrandRect && overlaps(catFaceRect, compactBrandRect)) {
            failures.push('compact cat face overlaps membership header');
          }
          if (quotaRects[0] && overlaps(catFaceRect, quotaRects[0])) {
            failures.push('compact cat face overlaps first quota');
          }
        }
      }
    }

    return {
      layout: document.querySelector('.cat-window')?.dataset.layout,
      appliedScale: Number(document.querySelector('.cat-window')?.dataset.panelScale),
      viewport: { width: window.innerWidth, height: window.innerHeight },
      failures,
      panel: panelRect && ${roundedRect.toString()}(panelRect),
      footer: footerRect && ${roundedRect.toString()}(footerRect),
      resetCount: resetRect && ${roundedRect.toString()}(resetRect),
      catFace: catFaceRect && ${roundedRect.toString()}(catFaceRect),
      compactBrand: compactBrandRect && ${roundedRect.toString()}(compactBrandRect),
      quotas: quotaRects.map(${roundedRect.toString()}),
    };
  })()`);
}

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    width: 520,
    height: 460,
    useContentSize: true,
    show: false,
    frame: false,
    backgroundColor: "#0d1117",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      offscreen: true,
    },
  });

  const results = [];
  try {
    await window.loadFile(entryFile, { query: { "with-5h": "1" } });
    await window.webContents.executeJavaScript(
      "document.fonts.ready.then(() => new Promise((resolve) => setTimeout(resolve, 100)))",
    );

    for (const scale of scales) {
      results.push({ scale, ...(await inspectScale(window, scale)) });
    }

    const failed = results.filter((result) => result.failures.length > 0);
    if (process.argv.includes("--verbose")) {
      process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
    } else {
      for (const result of results) {
        process.stdout.write(
          `${Math.round(result.scale * 100)}% ${result.layout} ` +
            `${result.failures.length === 0 ? "PASS" : result.failures.join("; ")}\n`,
        );
      }
    }
    if (failed.length > 0) {
      throw new Error(
        `Responsive layout failed at: ${failed.map((item) => `${item.scale * 100}%`).join(", ")}`,
      );
    }
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    window.destroy();
    app.exit(process.exitCode ?? 0);
  }
});
