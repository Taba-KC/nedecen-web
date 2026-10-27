/* Optional Playwright regression. All roles use intercepted fixtures, never real account data. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve('.next/responsive-library-screenshots'); fs.mkdirSync(shots, { recursive: true });
const concept = { id: 1, lessonConceptId: 101, name: 'Resolve vectors into horizontal and vertical components', chapterName: 'Vectors', topicName: 'Components', prerequisites: ['Identify the sides of a right-angled triangle.'], learningOutcomes: ['Can you calculate a horizontal component?'], answers: [null], taught: true };
const learnerSubject = { id: 91, subjectId: 3, subjectName: 'Physical Sciences', syllabus: [concept], lessons: [{ id: 46, lessonNumber: 2, date: '2026-10-10', status: 'confirmed', canRespond: true, concepts: [concept] }, { id: 47, lessonNumber: 3, date: '2026-10-26', status: 'planned', canRespond: false, concepts: [concept] }], homework: [] };
const profile = { firstName: 'Naledi', surname: 'Mokoena', number: 'L001', username: 'naledi', schoolName: 'Nedecen Secondary', className: '11B', gradeNumber: 11 };
const data = { profile, subjects: [learnerSubject] };
const teacherData = { profile: { ...profile, title: 'Ms', number: 'T001' }, subjects: [{ ...learnerSubject, classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 1, taughtConcepts: 1, currentChapter: { name: 'Vectors' }, curriculum: [], lessons: [] }], needsYou: [], comingUp: [] };

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  let lastPage;
  try {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await context.addInitScript(() => {
      const role = location.pathname.split('/')[2];
      localStorage.setItem('accessToken', 'responsive-fixture'); localStorage.setItem('schoolId', '1');
      localStorage.setItem('accountType', role === 'learner' ? 'learner' : 'person');
      if (role !== 'learner') localStorage.setItem('role', role === 'principal' ? 'principal' : 'teacher');
    });
    await context.route('http://localhost:3000/**', async route => {
        if (new URL(route.request().url()).pathname === '/staff/me/access') return route.fulfill({ json: { isPrincipal: true, canTeach: true, capabilities: ['grades','streams','staff','learners','curriculum'], schoolId: 1 } });
        if (new URL(route.request().url()).pathname === '/learners/me/learning-setup') return route.fulfill({ json: { status: 'ready' } });
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/workspace') || url.pathname.endsWith('/dashboard')) await new Promise(resolve => setTimeout(resolve, 400));
      if (url.pathname === '/learners/me/workspace') return route.fulfill({ json: data });
      if (url.pathname === '/staff/me/dashboard') return route.fulfill({ json: teacherData });
      return route.fulfill({ status: 404, json: { error: 'Unexpected fixture endpoint: ' + url.pathname } });
    });
    const page = await context.newPage(), errors = []; lastPage = page;
    page.on('pageerror', error => errors.push(error.message));
    async function mode(expected) { await page.locator(`[data-library-mode="${expected}"]`).waitFor(); }
    async function noOverflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); }
    async function screenshot(name) { await page.screenshot({ path: path.join(shots, name + '.png'), fullPage: true }); }
    for (const role of ['principal', 'staff', 'learner']) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`${base}/dashboard/${role}`); await mode('phone');
      await page.getByRole('heading', { name: 'Your library', exact: true }).waitFor();
      assert.equal(await page.locator('[data-library-workspace]').isVisible(), false, role + ': phone starts at library');
      const firstBook = role === 'learner' ? 'Lessons' : 'Announcements';
      await page.getByRole('button', { name: 'Open ' + firstBook, exact: true }).click();
      await page.locator('[data-book-open="true"]').waitFor();
      const contents = page.locator('[data-library-contents]');
      await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
      await contents.locator('nav button').first().waitFor();
      assert.equal(await page.locator('[data-drawer="contents"]').count(), 1, role + ': opening a book introduces its pages and stays open after data loads');
      await page.locator('[data-library-workspace] h1').filter({ hasText: role === 'learner' ? 'Physical Sciences lessons' : 'Still under development' }).waitFor();
      const phonePaper = await page.locator('[data-library-workspace] > div').boundingBox();
      assert.equal(phonePaper.x, 0, role + ': mobile paper starts at the left edge');
      assert.equal(phonePaper.width, 390, role + ': mobile paper uses the full viewport width');
      assert.equal(await page.locator('[data-library-shelf]').getAttribute('aria-hidden'), 'true');
      await noOverflow();
      await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
      const left = await contents.boundingBox();
      assert.equal(left.x, 0); assert.ok(left.width < 390 && left.width >= 350, 'Phone contents leaves a small opposite strip');
      assert.equal(await page.locator('[data-library-workspace]').evaluate(node => node.inert), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await contents.evaluate(node => node.contains(document.activeElement)), true, 'Focus stays in drawer');
      await screenshot(role + '-phone-pages');
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('button', { name: 'Open pages menu', exact: true }).evaluate(node => node === document.activeElement), true, 'Closing restores the trigger focus');
      await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
      await contents.locator('nav button').first().click();
      assert.equal(await page.locator('[data-drawer="none"]').count(), 1, 'Choosing even the current page dismisses phone contents');
      await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
      await page.mouse.click(384, 300);
      assert.equal(await page.locator('[data-drawer="none"]').count(), 1, 'Dimmed strip closes contents');
      await page.getByRole('button', { name: 'Open library', exact: true }).click();
      const shelf = page.locator('[data-library-shelf]');
      await page.getByRole('dialog', { name: 'Bookshelf' }).waitFor();
      const right = await shelf.boundingBox(); assert.ok(right.x > 0); assert.equal(Math.round(right.x + right.width), 390);
      assert.equal(await shelf.locator('[data-book-cover]').first().isVisible(), true, 'The library retains real book covers');
      await screenshot(role + '-phone-library');
      await page.mouse.click(8, 300); assert.equal(await page.locator('[data-drawer="none"]').count(), 1);
      await page.getByRole('button', { name: 'Open library', exact: true }).click();
      await shelf.getByRole('button', { name: 'Open ' + firstBook, exact: true }).click();
      await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
      assert.equal(await shelf.getAttribute('aria-hidden'), 'true', 'Selecting a book replaces the shelf with its contents');
      await contents.locator('nav button').first().click();
      if (role === 'learner') {
        await page.getByRole('button', { name: 'Open library', exact: true }).click();
        await shelf.getByRole('button', { name: 'Open Homework', exact: true }).click();
        await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
        await contents.getByRole('button', { name: /Physical Sciences homework/ }).click();
        await page.getByRole('heading', { name: 'Physical Sciences homework', exact: true }).waitFor();
        assert.equal(await page.locator('[data-drawer="none"]').count(), 1, 'A selected page stays visible after navigation');
      }
      await screenshot(role + '-phone-workspace');
      const close = page.getByRole('button', { name: 'Close book', exact: true });
      assert.equal(await close.count(), 0);
      assert.equal(await page.getByRole('button', { name: 'Refresh page', exact: true }).count(), 0);
      await page.goto(`${base}/dashboard/${role}`);
      await page.getByRole('heading', { name: 'Your library', exact: true }).waitFor();
      await screenshot(role + '-phone-login');
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(`${base}/dashboard/${role}?book=${firstBook.toLowerCase()}`); await mode('portrait');
      await page.locator('[data-library-workspace] h1').filter({ hasText: role === 'learner' ? 'Physical Sciences lessons' : 'Still under development' }).waitFor();
      await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
      const rolePaper = page.locator('[data-library-workspace]'), behindContents = await rolePaper.boundingBox();
      const contentsBox = await contents.boundingBox();
      assert.equal(contentsBox.x, 16);
      assert.equal(contentsBox.y, 16);
      assert.equal(contentsBox.y + contentsBox.height, 1008, role + ': tablet contents floats clear of screen edges');
      assert.equal(await contents.evaluate(node => getComputedStyle(node).borderTopLeftRadius), '18px');
      assert.notEqual(await contents.evaluate(node => getComputedStyle(node).boxShadow), 'none');
      assert.equal(contentsBox.width, 360, role + ': portrait contents is sized for its navigation');
      assert.equal(await rolePaper.evaluate(node => node.inert), true);
      await screenshot(role + '-tablet-portrait-pages');
      await page.keyboard.press('Escape');
      const centred = await rolePaper.boundingBox();
      assert.deepEqual(centred, behindContents, role + ': contents overlays without shifting or resizing the paper');
      assert.ok(centred.width > 768 * .85 && centred.width < 768, role + ': paper uses most of the tablet width with margins');
      assert.ok(Math.abs(centred.x + centred.width / 2 - 384) < 1, role + ': paper stays centred');
      assert.equal(await rolePaper.locator('[data-page-spine]').isVisible(), true, role + ': binder rings remain visible');
      assert.equal(await contents.getAttribute('aria-hidden'), 'true');
      await page.getByRole('button', { name: 'Open library', exact: true }).click();
      await page.getByRole('dialog', { name: 'Bookshelf' }).waitFor();
      const shelfBox = await shelf.boundingBox();
      assert.equal(shelfBox.width, 400); assert.equal(shelfBox.x + shelfBox.width, 752);
      assert.equal(shelfBox.y, 16); assert.equal(shelfBox.y + shelfBox.height, 1008);
      assert.equal(await shelf.evaluate(node => getComputedStyle(node).borderTopRightRadius), '18px');
      assert.deepEqual(await rolePaper.boundingBox(), centred, role + ': portrait shelf only overlays');
      await screenshot(role + '-tablet-portrait-library');
      await shelf.getByRole('button', { name: 'Open ' + firstBook, exact: true }).click();
      await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
      await contents.locator('nav button').first().click();
      assert.equal(await page.locator('[data-drawer="none"]').count(), 1, role + ': choosing a page closes tablet contents');
      await screenshot(role + '-tablet-portrait-workspace');
      await noOverflow();
      await page.setViewportSize({ width: 1024, height: 768 }); await mode('desktop');
      for (const region of ['contents', 'workspace', 'shelf']) assert.equal(await page.locator(`[data-library-${region}]`).isVisible(), true, role + ': landscape retains desktop navigation');
    }
    // A real lesson surface in both tablet orientations and on desktop.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${base}/dashboard/learner?book=lessons&page=upcoming-91`); await mode('portrait');
    await page.locator('[data-library-workspace] h1').filter({ hasText: 'Physical Sciences lessons' }).waitFor();
    const workspace = page.locator('[data-library-workspace]');
    await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
    await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
    for (const viewport of [{ width: 601, height: 960 }, { width: 768, height: 1024 }, { width: 834, height: 1194 }, { width: 1024, height: 1366 }]) {
      await page.setViewportSize(viewport); await mode('portrait');
      const centred = await workspace.boundingBox();
      assert.ok(Math.abs(centred.x + centred.width / 2 - viewport.width / 2) < 1, 'Portrait paper stays centred at every tablet width');
      assert.ok(centred.width > viewport.width * .85 && centred.width < viewport.width, 'Portrait paper uses most of the viewport');
      const paper = workspace.locator(':scope > div');
      assert.equal(await paper.evaluate(node => getComputedStyle(node).borderTopStyle), 'solid');
      assert.notEqual(await workspace.evaluate(node => getComputedStyle(node, '::before').display), 'none', 'Layered binder trim remains visible');
      const scroller = page.locator('[data-page-scroll]');
      await scroller.evaluate(node => { node.scrollTop = 30; });
      const scrollBefore = await scroller.evaluate(node => node.scrollTop);
      await screenshot('tablet-portrait-centred-' + viewport.width);
      await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
      const contents = page.getByRole('dialog', { name: 'Chapters and headings' }); await contents.waitFor();
      assert.deepEqual(await workspace.boundingBox(), centred, 'Left drawer does not move the page');
      assert.equal(await workspace.evaluate(node => node.inert), true);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await contents.evaluate(node => node.contains(document.activeElement)), true, 'Tablet drawer contains keyboard focus');
      await screenshot('tablet-portrait-contents-' + viewport.width);
      await page.mouse.click(viewport.width - 10, 300);
      assert.equal(await page.locator('[data-drawer="none"]').count(), 1, 'Tablet backdrop dismisses contents');
      assert.equal(await page.getByRole('button', { name: 'Open pages menu', exact: true }).evaluate(node => node === document.activeElement), true);
      assert.equal(await scroller.evaluate(node => node.scrollTop), scrollBefore, 'Opening and closing contents retains the page scroll');
      await page.getByRole('button', { name: 'Open library', exact: true }).click();
      await page.getByRole('dialog', { name: 'Bookshelf' }).waitFor();
      assert.deepEqual(await workspace.boundingBox(), centred, 'Right drawer does not move the page');
      assert.equal(await page.locator('[data-library-contents]').evaluate(node => node.inert), true);
      await screenshot('tablet-portrait-library-' + viewport.width);
      await page.getByRole('button', { name: 'Close library menu', exact: true }).click();
      assert.equal(await workspace.evaluate(node => node.inert), false);
      await noOverflow();
    }
    for (const viewport of [{ width: 1024, height: 768 }, { width: 1600, height: 1000 }, { width: 820, height: 614 }]) {
      await page.setViewportSize(viewport); await mode('desktop');
      for (const region of ['contents', 'workspace', 'shelf']) assert.equal(await page.locator(`[data-library-${region}]`).isVisible(), true);
      const a = await page.locator('[data-library-contents]').boundingBox(), b = await workspace.boundingBox(), c = await page.locator('[data-library-shelf]').boundingBox();
      assert.ok(a.x + a.width <= b.x && b.x + b.width <= c.x, 'Landscape/desktop keeps the three columns');
      await noOverflow(); await screenshot(`landscape-${viewport.width}`);
    }
    await page.setViewportSize({ width: 844, height: 390 }); await mode('phone'); await noOverflow();
    await screenshot('phone-landscape');
    await page.setViewportSize({ width: 320, height: 568 }); await mode('phone'); await noOverflow();
    const info = page.getByRole('button', { name: 'Info', exact: true });
    assert.deepEqual(await info.evaluate(node => ({ weight: getComputedStyle(node).fontWeight, border: getComputedStyle(node).borderTopStyle })), { weight: '400', border: 'solid' });
    await info.hover();
    assert.equal(await info.evaluate(node => getComputedStyle(node).fontWeight), '400', 'Concept button labels remain regular weight on hover');
    const infoBox = await info.boundingBox(), goalsBox = await page.getByRole('button', { name: 'Learning goals', exact: true }).boundingBox();
    const statementBox = await page.locator('[role="tabpanel"] ol > li h3 > span:last-child').first().boundingBox();
    assert.ok(Math.abs(infoBox.x - statementBox.x) < 1, 'Concept actions align with the statement rather than the number');
    assert.ok(goalsBox.x + goalsBox.width <= 320, 'Buttons wrap within the narrow workspace');
    await screenshot('phone-full-width-concept-buttons');
    await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
    assert.equal(Math.round((await page.locator('[data-library-contents]').boundingBox()).width), 292);
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 }); await mode('phone');
    await page.getByRole('button', { name: 'Open library', exact: true }).click();
    await page.setViewportSize({ width: 1024, height: 768 }); await mode('desktop');
    assert.equal(await page.locator('[data-library-workspace]').evaluate(node => node.inert), false, 'Rotation restores interactive desktop content');
    // Check real sliding transitions as well as the reduced-motion screenshot layouts.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }]) {
      await page.setViewportSize(viewport); await mode(viewport.width === 390 ? 'phone' : 'portrait');
      for (const [trigger, region, close] of [['Open library', 'shelf', 'Close library menu'], ['Open pages menu', 'contents', 'Close pages menu']]) {
        await page.getByRole('button', { name: trigger, exact: true }).click();
        const panel = page.locator(`[data-library-${region}]`);
        assert.match(await panel.evaluate(node => getComputedStyle(node).transitionProperty), /transform/);
        assert.ok(await panel.evaluate(node => parseFloat(getComputedStyle(node).transitionDuration) > 0));
        await page.waitForFunction(region => {
          const panel = document.querySelector(`[data-library-${region}]`);
          const bounds = panel.getBoundingClientRect(), style = getComputedStyle(panel);
          const inset = parseFloat(region === 'shelf' ? style.right : style.left);
          return Math.abs(region === 'shelf' ? bounds.right - (innerWidth - inset) : bounds.left - inset) < 1;
        }, region);
        await page.getByRole('button', { name: close, exact: true }).click();
        await page.waitForFunction(region => getComputedStyle(document.querySelector(`[data-library-${region}]`)).visibility === 'hidden', region);
        assert.equal(await page.locator('[data-library-workspace]').evaluate(node => node.inert), false);
      }
    }
    assert.deepEqual(errors, []);
    console.log('Responsive checks passed for all three roles: phone library-first, automatic book contents, delayed data loading, book switching, both drawers, focus/Escape/backdrop, centred portrait paper and overlay menus, landscape columns, rotation and overflow. Screenshots: ' + shots);
    await context.close();
  } catch (error) {
    if (lastPage && !lastPage.isClosed()) { await lastPage.screenshot({ path: path.join(shots, 'failure.png'), fullPage: true }); console.error(await lastPage.evaluate(() => ({ url: location.href, mode: document.querySelector('[data-library-mode]')?.getAttribute('data-library-mode'), drawer: document.querySelector('[data-drawer]')?.getAttribute('data-drawer'), shelf: document.querySelector('[data-library-shelf]')?.outerHTML.slice(0, 400) }))); }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
