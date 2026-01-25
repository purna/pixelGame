// Ink dialogue renderer for HTML/CSS/JS
// This script dynamically injects dialogue UI + CSS, loads inkjs runtime and renders compiled ink JSON stories.
// Adds: portrait loading, simple HTML sanitiser for Ink content, and sound pack support.
// Usage: window.inkDialogue.startStoryFromPath('assets/dialogue/Story/Chapter_01/The Basket.json')

(function(){
    const INK_RUNTIME_CDN = 'https://unpkg.com/inkjs/dist/ink.js';

    // Inject CSS for the dialogue UI
    const css = `
#ink-dialogue-container { position: fixed; left: 50%; transform: translateX(-50%); bottom: 5%; width: min(1100px, 95%); max-height: 45%; background: rgba(10,10,10,0.95); color: #fff; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.6); display: none; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; z-index: 9999; }
#ink-dialogue-inner { display: flex; gap: 16px; padding: 18px; align-items: flex-start; }
#ink-dialogue-portrait { width: 140px; height: 140px; background: rgba(255,255,255,0.03); border-radius: 8px; overflow: hidden; flex: 0 0 140px; display: flex; align-items: center; justify-content: center; }
#ink-dialogue-portrait img { width: 100%; height: 100%; object-fit: cover; display: block; }
#ink-dialogue-body { flex: 1; display: flex; flex-direction: column; gap: 8px; }
#ink-dialogue-speaker { font-weight: 700; letter-spacing: 0.4px; font-size: 18px; color: #ffdca6; }
#ink-dialogue-text { font-size: 16px; line-height: 1.45; max-height: 10.2em; overflow-y: auto; }
#ink-dialogue-choices { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
.ink-choice-btn { display: block; width: 100%; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); color: #fff; border: 1px solid rgba(255,255,255,0.08); padding: 12px 14px; border-radius: 10px; cursor: pointer; text-align: left; white-space: normal; font-weight: 600; font-size: 15px; transition: transform .12s ease, box-shadow .12s ease, background .12s ease; box-shadow: none; }
.ink-choice-btn:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.5); background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); }
.ink-choice-btn:focus { outline: 2px solid rgba(255,220,166,0.15); outline-offset: 2px; }
/* Small label for choice metadata (if needed) */
.ink-choice-btn .choice-meta { display: block; font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 6px; }

#ink-dialogue-controls { display: flex; gap: 8px; align-items: center; justify-content: space-between; margin-top: 6px; }
#ink-dialogue-progress { display: none; }
#ink-dialogue-next { background: linear-gradient(180deg, #ffdca6, #f2c57a); color: #111; border: none; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-weight: 700; }
#ink-dialogue-next:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
/* Close X in the top-right corner */
#ink-dialogue-x { position: absolute; top: 10px; right: 12px; background: transparent; color: #fff; border: none; padding: 6px 8px; font-size: 20px; line-height: 1; cursor: pointer; border-radius: 6px; }
#ink-dialogue-x:hover { transform: translateY(-2px); }
/* Style choice buttons like the Next button */
.ink-choice-btn { background: linear-gradient(180deg, #ffdca6, #f2c57a); color: #111; border: none; padding: 10px 14px; border-radius: 8px; font-weight: 700; box-shadow: 0 6px 18px rgba(0,0,0,0.15); transition: transform .12s ease, box-shadow .12s ease, background .12s ease; }
.ink-choice-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,0,0,0.25); background: linear-gradient(180deg, #ffdca6, #e6b35a); color: #111; }
.ink-choice-btn:hover .choice-meta { color: rgba(17,17,17,0.9); }
.ink-choice-btn:focus { outline: 2px solid rgba(0,0,0,0.12); outline-offset: 2px; }
`;
    const style = document.createElement('style');
    style.id = 'ink-dialogue-css';
    style.innerText = css;
    document.head.appendChild(style);

    // Create container DOM
    const container = document.createElement('div');
    container.id = 'ink-dialogue-container';
    container.innerHTML = `
<div id="ink-dialogue-inner">
  <div id="ink-dialogue-portrait"><img src="assets/dialogue/Characters/Default/Default.png" alt="portrait" /></div>
  <div id="ink-dialogue-body">
    <div id="ink-dialogue-speaker"></div>
    <div id="ink-dialogue-text" tabindex="0"></div>
    <div id="ink-dialogue-choices"></div>
    <div id="ink-dialogue-controls"><div id="ink-dialogue-progress"></div><div style="display:flex;gap:8px"><button id="ink-dialogue-next">Next</button></div></div>
  </div>
</div>
<button id="ink-dialogue-x" aria-label="Close">×</button>
`;
    document.body.appendChild(container);

    const portraitImg = container.querySelector('#ink-dialogue-portrait img');
    const speakerEl = container.querySelector('#ink-dialogue-speaker');
    const textEl = container.querySelector('#ink-dialogue-text');
    const choicesEl = container.querySelector('#ink-dialogue-choices');
    const nextBtn = container.querySelector('#ink-dialogue-next');
    const closeBtn = container.querySelector('#ink-dialogue-x');
    const progressEl = container.querySelector('#ink-dialogue-progress');

    let inkLoaded = false;
    let storyInstance = null;
    let currentPath = null;
    let lastSpeaker = '';

    // Sound packs cache: name => { files: ["audio1.mp3", ...], volume: 1 }
    const soundPacks = {};

    // Simple sound player - supports packs JSON in assets/dialogue/Sounds/<name>.json
    async function loadSoundPack(nameOrPath) {
        if (!nameOrPath) return null;
        const key = nameOrPath;
        if (soundPacks[key]) return soundPacks[key];

        let path = nameOrPath;
        if (!path.endsWith('.json')) {
            path = `assets/dialogue/Sounds/${nameOrPath}.json`;
        } else {
            path = `assets/dialogue/Sounds/${nameOrPath}`;
        }

        try {
            const resp = await fetch(path);
            if (!resp.ok) throw new Error('Failed to load sound pack ' + path);
            const json = await resp.json();
            // Expecting format: { files: ["path1.mp3", ...], volume: 0.9 }
            const pack = { files: json.files || [], volume: typeof json.volume === 'number' ? json.volume : 1 };
            soundPacks[key] = pack;
            return pack;
        } catch (err) {
            // swallow and cache null so we don't repeatedly try the same missing file
            console.warn('ink-dialogue: could not load sound pack', path, err);
            soundPacks[key] = null;
            return null;
        }
    }

    // Play a random file from pack with small fallback strategy for missing variants
    async function playSoundFromPack(nameOrPath) {
        try {
            let pack = await loadSoundPack(nameOrPath);
            // If pack missing, attempt common variant fallbacks (e.g. _high -> _mid/_low)
            if (!pack || !pack.files || pack.files.length === 0) {
                if (typeof nameOrPath === 'string') {
                    const tried = new Set();
                    const variants = [];
                    if (/_high$/i.test(nameOrPath)) {
                        variants.push(nameOrPath.replace(/_high$/i, '_mid'));
                        variants.push(nameOrPath.replace(/_high$/i, '_low'));
                    } else if (/_mid$/i.test(nameOrPath)) {
                        variants.push(nameOrPath.replace(/_mid$/i, '_low'));
                        variants.push(nameOrPath.replace(/_mid$/i, '_high'));
                    } else if (/_low$/i.test(nameOrPath)) {
                        variants.push(nameOrPath.replace(/_low$/i, '_mid'));
                        variants.push(nameOrPath.replace(/_low$/i, '_high'));
                    } else {
                        variants.push(nameOrPath + '_mid', nameOrPath + '_low');
                    }
                    for (const v of variants) {
                        if (tried.has(v)) continue;
                        tried.add(v);
                        // eslint-disable-next-line no-await-in-loop
                        pack = await loadSoundPack(v);
                        if (pack && pack.files && pack.files.length) break;
                    }
                }
            }

            if (!pack || !pack.files || pack.files.length === 0) return;
            const url = pack.files[Math.floor(Math.random() * pack.files.length)];
            const audio = new Audio(url);
            audio.volume = pack.volume;
            audio.play().catch(err => { /* ignore autoplay errors */ });
            return audio;
        } catch (err) {
            console.warn('ink-dialogue: playSoundFromPack error', err);
        }
    }

    function showContainer() { container.style.display = 'block'; textEl.focus(); }
    function hideContainer() { container.style.display = 'none'; }

    function clearChoices() { choicesEl.innerHTML = ''; }

    function renderProgress() {
        if (!storyInstance) return;
        progressEl.textContent = `Tags: ${storyInstance.currentTags?.join(', ') || 'none'}`;
    }

    // Sanitize HTML allowing only a small whitelist (robust when DOMParser returns no body)
    function sanitizeAllowedHtml(dirty) {
        if (!dirty) return '';
        // Allowed tags and attributes
        const allowedTags = ['b','strong','i','em','br','p','a','ul','ol','li','span'];
        const allowedAttrs = { 'a': ['href','target','rel'], 'span': ['class'] };

        const parser = new DOMParser();
        let doc = parser.parseFromString(dirty, 'text/html');

        // Fallback: if doc or doc.body is null, use a temporary element to parse
        if (!doc || !doc.body) {
            const tmp = document.createElement('div');
            tmp.innerHTML = dirty;
            // We'll operate on tmp instead of doc.body
            function cleanNode(node) {
                if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const tag = node.tagName.toLowerCase();
                    if (!allowedTags.includes(tag)) {
                        const parent = node.parentNode;
                        while (node.firstChild) parent.insertBefore(node.firstChild, node);
                        parent.removeChild(node);
                        return;
                    }
                    const attrs = Array.from(node.attributes || []);
                    for (const attr of attrs) {
                        const name = attr.name.toLowerCase();
                        const allowedForTag = allowedAttrs[tag] || [];
                        if (allowedForTag.includes(name)) {
                            if (tag === 'a' && name === 'href') {
                                const val = node.getAttribute('href') || '';
                                if (/^\s*javascript:/i.test(val) || /^\s*data:/i.test(val)) {
                                    node.removeAttribute('href');
                                } else {
                                    node.setAttribute('rel','noopener');
                                    node.setAttribute('target','_blank');
                                }
                            }
                        } else {
                            node.removeAttribute(attr.name);
                        }
                    }
                }
                let child = node.firstChild;
                while (child) { const next = child.nextSibling; cleanNode(child); child = next; }
            }
            cleanNode(tmp);
            return tmp.innerHTML;
        }

        function cleanNode(node) {
            // Remove comments
            if (node.nodeType === Node.COMMENT_NODE) { node.remove(); return; }

            if (node.nodeType === Node.ELEMENT_NODE) {
                const tag = node.tagName.toLowerCase();
                if (!allowedTags.includes(tag)) {
                    // replace node with its children
                    const parent = node.parentNode;
                    while (node.firstChild) parent.insertBefore(node.firstChild, node);
                    parent.removeChild(node);
                    return; // children already reinserted, they will be cleaned separately
                }

                // Remove attributes not allowed
                const attrs = Array.from(node.attributes || []);
                for (const attr of attrs) {
                    const name = attr.name.toLowerCase();
                    // allow only whitelisted attrs for this tag
                    const allowedForTag = allowedAttrs[tag] || [];
                    if (allowedForTag.includes(name)) {
                        // For href ensure no javascript: or data: schemes
                        if (tag === 'a' && name === 'href') {
                            const val = node.getAttribute('href') || '';
                            if (/^\s*javascript:/i.test(val) || /^\s*data:/i.test(val)) {
                                node.removeAttribute('href');
                            } else {
                                node.setAttribute('rel','noopener');
                                node.setAttribute('target','_blank');
                            }
                        }
                        // otherwise keep
                    } else {
                        node.removeAttribute(attr.name);
                    }
                }
            }

            // Recurse
            let child = node.firstChild;
            while (child) {
                const next = child.nextSibling;
                cleanNode(child);
                child = next;
            }
        }

        cleanNode(doc.body);
        return doc.body ? doc.body.innerHTML : '';
    }

    // Typewriter controls
    let typewriterCancel = false;
    if (typeof window.inkDialogue === 'undefined') window.inkDialogue = {};
    if (typeof window.inkDialogue.typeSpeed === 'undefined') window.inkDialogue.typeSpeed = 24; // ms per character

    function cancelTypewriter() { typewriterCancel = true; }

    // runTypewriter types dialogue while preserving HTML formatting during the reveal.
    // It progressively reveals characters inside text nodes of the sanitized HTML so tags
    // like <b> remain effective during the animation. Accepts an optional target element
    // so we can keep non-typed stage directions outside the typed area.
    async function runTypewriter(plain, safeHtml, speed, targetEl = textEl) {
        typewriterCancel = false;
        speed = typeof speed === 'number' ? speed : (window.inkDialogue && window.inkDialogue.typeSpeed) || 24;

        // If there's no HTML to preserve, fall back to simple text typing
        const looksLikeHtml = typeof safeHtml === 'string' && safeHtml.indexOf('<') >= 0;
        if (!looksLikeHtml) {
            targetEl.textContent = '';
            for (let i = 0; i < (plain || '').length; i++) {
                if (typewriterCancel) { targetEl.textContent = plain; break; }
                targetEl.textContent += plain.charAt(i);
                // eslint-disable-next-line no-await-in-loop
                await new Promise(r => setTimeout(r, speed));
            }
            return;
        }

        // Render the sanitized HTML structure first, then progressively reveal text nodes
        targetEl.innerHTML = safeHtml || '';

        // Collect all text nodes in document order within the target
        const textNodes = [];
        (function walk(node) {
            for (let child = node.firstChild; child; child = child.nextSibling) {
                if (child.nodeType === Node.TEXT_NODE) {
                    textNodes.push(child);
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    walk(child);
                }
            }
        }(targetEl));

        // Store full text for each node and clear current content
        const fullTexts = textNodes.map(n => n.textContent || '');
        for (const n of textNodes) n.textContent = '';

        // Total characters to reveal (across all text nodes)
        const totalChars = fullTexts.reduce((s, t) => s + t.length, 0);

        let nodeIdx = 0;
        let charIdx = 0;

        for (let revealed = 0; revealed < totalChars; revealed++) {
            if (typewriterCancel) {
                // Reveal everything immediately
                for (let i = 0; i < textNodes.length; i++) textNodes[i].textContent = fullTexts[i];
                break;
            }

            const currentText = fullTexts[nodeIdx] || '';
            const nextChar = currentText.charAt(charIdx) || '';
            textNodes[nodeIdx].textContent += nextChar;

            charIdx++;
            if (charIdx >= currentText.length) {
                nodeIdx++;
                charIdx = 0;
            }

            // eslint-disable-next-line no-await-in-loop
            await new Promise(r => setTimeout(r, speed));
        }

        // Safety: ensure final HTML state is the sanitized HTML
        if (!typewriterCancel) {
            targetEl.innerHTML = safeHtml || '';
        }
    }

    async function renderContinue() {
        if (!storyInstance) return;

        // If there are choices already, render them and return
        if (storyInstance.currentChoices && storyInstance.currentChoices.length > 0) {
            renderChoices();
            return;
        }

        // Collect consecutive text chunks into one dialog box when there are no intervening tags
        let combinedText = '';
        let initialTags = storyInstance.currentTags || [];

        try {
            const first = storyInstance.Continue();
            combinedText += first || '';
        } catch (err) {
            console.warn('ink-dialogue: continue error', err);
        }

        // Append additional text while story can continue and produces no tags and no choices
        while (storyInstance && storyInstance.canContinue && (!storyInstance.currentChoices || storyInstance.currentChoices.length === 0) && (!storyInstance.currentTags || storyInstance.currentTags.length === 0)) {
            try {
                const more = storyInstance.Continue();
                if (!more) break;
                // ensure separation between chunks
                combinedText += (combinedText ? '\n' : '') + more;
            } catch (err) {
                console.warn('ink-dialogue: continue loop error', err);
                break;
            }
        }

        // Debug: show what we collected
        if (typeof console !== 'undefined' && console.debug) {
            console.debug('ink-dialogue: combined continue ->', combinedText);
            try {
                const choicesSnapshot = (storyInstance.currentChoices || []).map(c => ({ text: (c && (c.text || c.choiceText || c.content)) || String(c) }));
                console.debug('ink-dialogue: currentChoices after continue ->', choicesSnapshot);
            } catch (e) {
                console.debug('ink-dialogue: currentChoices after continue -> (unserializable)', e);
            }
        }

        const tags = initialTags || [];

        // Handle tags: speaker:Name, audio:packname, sound:packname, portrait:Name_or_file
        let speaker = '';
        let portraitOverride = null;
        let audioTag = null;
        for (const t of tags) {
            const idx = t.indexOf(':');
            const key = idx >= 0 ? t.slice(0, idx).trim().toLowerCase() : t.trim().toLowerCase();
            const rawVal = idx >= 0 ? t.slice(idx + 1).trim() : '';

            if (key === 'speaker') {
                speaker = rawVal;
            } else if (key === 'audio' || key === 'sound' || key === 'sfx' || key === 'play' || key === 'voice') {
                audioTag = rawVal;
            } else if (key === 'portrait') {
                portraitOverride = rawVal;
            }
        }

        // Ensure a speaker name is always shown: prefer current tag, otherwise fall back to lastSpeaker, then 'Narrator'
        if (speaker) {
            lastSpeaker = speaker;
        } else {
            speaker = lastSpeaker || 'Narrator';
        }

        speakerEl.textContent = speaker;

        // Layout handling (left/right)
        let layout = 'left';
        for (const t of tags) {
            const key = t.indexOf(':') >= 0 ? t.slice(0, t.indexOf(':')).trim().toLowerCase() : t.trim().toLowerCase();
            const rawVal = t.indexOf(':') >= 0 ? t.slice(t.indexOf(':')+1).trim() : '';
            if (key === 'layout') {
                if (rawVal === 'right') layout = 'right';
                else layout = 'left';
            }
        }

        function applyLayout(l) {
            const inner = document.getElementById('ink-dialogue-inner');
            if (!inner) return;
            if (l === 'right') {
                inner.style.flexDirection = 'row-reverse';
                portraitImg.style.order = 2;
            } else {
                inner.style.flexDirection = 'row';
                portraitImg.style.order = 0;
            }
        }

        applyLayout(layout);

        if (portraitOverride) {
            const v = portraitOverride;
            if (/\/.+/.test(v) || /\.(png|jpg|jpeg|webp|gif)$/i.test(v)) {
                const maybePath = v.startsWith('assets/') ? v : `assets/dialogue/Characters/${v}`;
                portraitImg.src = maybePath;
            } else if (v.includes('_')) {
                const [base, variant] = v.split('_');
                const candidate = `assets/dialogue/Characters/${base}/${base}_${variant}.png`;
                const ok = await new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = candidate;
                });
                if (ok) portraitImg.src = candidate; else await loadPortraitForSpeaker(base);
            } else {
                await loadPortraitForSpeaker(portraitOverride);
            }
        } else if (speaker) {
            await loadPortraitForSpeaker(speaker);
        }

        // Simpler, safer approach: always concatenate consecutive text chunks into one dialogue box
        // and strip out stray ink control tokens while preserving parenthetical stage directions.
        function stripInkMarkers(s) {
            if (!s) return '';
            const rawLines = s.split(/\r?\n/);
            const out = [];
            for (let line of rawLines) {
                let l = (line || '').trim();
                // Drop control-only lines
                if (l === '#' || l === '/#') continue;
                // If line starts with a caret used by compiled ink, remove it but keep the content
                if (l.startsWith('^')) l = l.slice(1).trim();
                // If a line begins with a stray '#', remove it
                if (l.startsWith('#')) l = l.slice(1).trim();
                if (l) out.push(l);
            }
            return out.join('\n');
        }

        const cleaned = stripInkMarkers(combinedText);

        // Split out stage-direction parentheticals which we render immediately (no typing)
        const lines = (cleaned || '').split(/\n/).map(l => l.trim()).filter(Boolean);
        const prefixLines = [];
        const restLines = [];
        for (const ln of lines) {
            if (/^\(.+\)$/.test(ln)) prefixLines.push(ln);
            else restLines.push(ln);
        }

        const prefixHtml = prefixLines.map(l => sanitizeAllowedHtml(l)).join('<br>');
        const restText = restLines.join('\n');

        // Render prefix immediately and keep it as static content
        textEl.innerHTML = prefixHtml || '';

        // Create a container for the typed content so prefix remains static and not typed
        const typedContainer = document.createElement('div');
        typedContainer.style.display = 'block';
        // ensure small spacing
        typedContainer.style.marginTop = prefixHtml ? '6px' : '0';
        textEl.appendChild(typedContainer);

        // Prepare sanitized HTML for the typed portion
        const safe = sanitizeAllowedHtml(restText);
        const tmpForPlain = document.createElement('div');
        tmpForPlain.innerHTML = restText || '';
        const plain = tmpForPlain.textContent || tmpForPlain.innerText || '';

        // Play audio (looping) while typing if an audio tag is present
        let typingAudio = null;
        if (audioTag) {
            try {
                typingAudio = await playSoundFromPack(audioTag);
                if (typingAudio) typingAudio.loop = true;
            } catch (e) { console.warn('ink-dialogue: failed to start typing audio', e); }
        }

        // Use the typewriter to render the rest (skip typing for prefix)
        if (!safe && restText) {
            await runTypewriter(plain, null, window.inkDialogue.typeSpeed, typedContainer);
        } else {
            await runTypewriter(plain, safe || '', window.inkDialogue.typeSpeed, typedContainer);
        }

        // Stop looping audio when typing finished
        if (typingAudio) {
            try { typingAudio.loop = false; typingAudio.pause(); } catch (e) { /* ignore */ }
        }

        // Ensure the next button is visible by default when there are no choices
        if (nextBtn) nextBtn.style.display = 'inline-block';

        // If story has more choices after this text, render them
        if (storyInstance.currentChoices && storyInstance.currentChoices.length > 0) {
            renderChoices();
        }

        // Log progress to console instead of showing in UI
        if (storyInstance && console && typeof console.log === 'function') {
            console.log('ink-dialogue: tags =', storyInstance.currentTags || []);
        }

    }

    function renderChoices() {
        clearChoices();
        const choices = storyInstance.currentChoices || [];

        // Hide the explicit next button while choices are visible — choices serve as the continuation triggers
        if (nextBtn) nextBtn.style.display = 'none';

        choices.forEach((choice, idx) => {
            const btn = document.createElement('button');
            btn.className = 'ink-choice-btn';
            // Allow some basic HTML in choice text
            // Also support small meta line separated by '|' (internal only)
            const rawLabel = (function(){ try { return (choice && (choice.text || choice.choiceText || choice.content || String(choice))); } catch(e) { return String(choice); } })();
            const parts = (rawLabel || '').split('|').map(s => s.trim());
            const main = sanitizeAllowedHtml(parts[0]) || '';

            if (main && main.trim()) {
                btn.innerHTML = main;
            } else {
                const plain = (parts[0] || '').replace(/^\uFEFF/, '').replace(/<[^>]*>/g, '').trim();
                btn.textContent = plain || '...';
            }

            if (parts[1]) {
                const meta = document.createElement('span');
                meta.className = 'choice-meta';
                meta.textContent = parts[1];
                btn.appendChild(meta);
            }

            // Use the inkjs-provided choice.index when available (more robust),
            // and guard against the story changing before click.
            btn.addEventListener('click', async () => {
                try {
                    if (!storyInstance) {
                        console.warn('ink-dialogue: click but no storyInstance');
                        return;
                    }
                    const choicesNow = storyInstance.currentChoices;
                    if (!choicesNow || choicesNow.length === 0) {
                        console.warn('ink-dialogue: click but no currentChoices');
                        return;
                    }

                    // Prefer explicit choice.index if present, otherwise fall back to captured idx
                    let choiceIndex = (typeof choice.index === 'number') ? choice.index : idx;

                    // If the index is out of range (story may have advanced or choices reordered), try to find a matching choice by text
                    if (choiceIndex < 0 || choiceIndex >= choicesNow.length) {
                        const normalized = (t) => (t || '').trim();
                        const targetText = normalized(rawLabel);
                        const found = choicesNow.findIndex(c => normalized((c && (c.text || c.choiceText || c.content || String(c))) || '') === targetText);
                        if (found >= 0) choiceIndex = found;
                    }

                    if (choiceIndex < 0 || choiceIndex >= choicesNow.length) {
                        console.warn('ink-dialogue: choice index out of range after re-eval', choiceIndex, 'available', choicesNow.length, { originalIdx: idx, choiceObjIndex: choice.index });
                        return;
                    }

                    // Prevent double clicks and immediately hide choice buttons to avoid UI flicker
                    btn.disabled = true;
                    clearChoices();

                    // Final safety: call ChooseChoiceIndex guarded in try/catch since inkjs may still throw
                    try {
                        storyInstance.ChooseChoiceIndex(choiceIndex);
                    } catch (err) {
                        console.error('ink-dialogue: inkjs ChooseChoiceIndex threw', err, { choiceIndex, available: choicesNow.length });
                        return;
                    }

                    // After selecting, continue rendering
                    await renderContinue();
                } catch (err) {
                    console.error('ink-dialogue: failed to choose choice', err);
                } finally {
                    btn.disabled = false;
                }
            });
            choicesEl.appendChild(btn);
        });
    }

    // Normalize filename casing by attempting variants (original, lowercase, uppercase)
    function tryLoadImageVariants(basePath, filename) {
        const candidates = [filename, filename.toLowerCase(), filename.toUpperCase()];
        return candidates;
    }

    async function loadPortraitForSpeaker(name) {
        if (!name) { portraitImg.src = 'assets/dialogue/Characters/Default/Default.png'; return; }
        // Name might include variant like "Miriam_Happy" or just "Miriam"
        let person = name;
        let variant = null;
        if (name.includes('_')) {
            [person, variant] = name.split('_');
        }
        const folder = `assets/dialogue/Characters/${person}/`;

        const filenames = [];
        if (variant) {
            filenames.push(`${person}_${variant}.png`);
        }
        // Common order
        filenames.push(`${person}_Neutral.png`, `${person}_Happy.png`, `${person}_Sad.png`, `${person}.png`);

        portraitImg.src = '';
        for (const fname of filenames) {
            const variants = tryLoadImageVariants(folder, fname);
            for (const candidate of variants) {
                const p = folder + candidate;
                // eslint-disable-next-line no-await-in-loop
                const ok = await new Promise(resolve => {
                    const img = new Image();
                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);
                    img.src = p;
                });
                if (ok) { portraitImg.src = p; return; }
            }
        }
        // Not found - fallback to default portrait
        portraitImg.src = 'assets/dialogue/Characters/Default/Default.png';
    }

    function closeStory() {
        storyInstance = null;
        currentPath = null;
        hideContainer();
        clearChoices();
        textEl.innerHTML = '';
        // reset lastSpeaker so next story starts fresh
        lastSpeaker = '';
        speakerEl.textContent = '';
        portraitImg.src = 'assets/dialogue/Characters/Default/Default.png';
    }

    // Load ink runtime script (prefer local vendor 'plugins/ink.js', fall back to CDN)
    function loadInkRuntime() {
        if (window.inkjs && inkLoaded) return Promise.resolve();
        return new Promise((resolve, reject) => {
            if (document.querySelector('script[data-ink-runtime]')) {
                const check = setInterval(() => {
                    if (window.inkjs) { clearInterval(check); inkLoaded = true; resolve(); }
                }, 50);
                setTimeout(() => { clearInterval(check); reject(new Error('ink runtime load timeout')); }, 8000);
                return;
            }

            const localSrc = 'plugins/ink.js';

            // Try to load local vendor first, then fall back to CDN if local not available
            const tryLocal = () => {
                const s = document.createElement('script');
                s.src = localSrc;
                s.defer = true;
                s.setAttribute('data-ink-runtime', '1');
                s.onload = () => { inkLoaded = true; resolve(); };
                s.onerror = () => {
                    // Local failed — try CDN
                    console.warn('ink-dialogue: local ink.js not found, falling back to CDN');
                    const s2 = document.createElement('script');
                    s2.src = INK_RUNTIME_CDN;
                    s2.defer = true;
                    s2.setAttribute('data-ink-runtime', '1');
                    s2.onload = () => { inkLoaded = true; resolve(); };
                    s2.onerror = () => reject(new Error('Failed to load ink runtime from CDN'));
                    document.head.appendChild(s2);
                };
                document.head.appendChild(s);
            };

            tryLocal();
        });
    }

    async function loadStoryJSON(path) {
        const resp = await fetch(path);
        if (!resp.ok) throw new Error('Failed to load story JSON: ' + path);
        const json = await resp.json();
        return new window.inkjs.Story(json);
    }

    // Public API: start story by JSON path
    async function startStoryFromPath(path, opts) {
        try {
            // allow caller to set allowRepeat per invocation (stored on the exposed API)
            if (opts && typeof opts.allowRepeat !== 'undefined') window.inkDialogue = window.inkDialogue || {} , window.inkDialogue.allowRepeat = !!opts.allowRepeat;
            await loadInkRuntime();
            storyInstance = await loadStoryJSON(path);
            currentPath = path;
            showContainer();
            // initial render
            await renderContinue();
        } catch (err) {
            console.error('ink-dialogue error starting story:', err);
        }
    }

    // Controls
    nextBtn.addEventListener('click', async () => {
        // If a typewriter is running, signal it to complete immediately
        typewriterCancel = true;
        if (!storyInstance) return;
        if (storyInstance.currentChoices && storyInstance.currentChoices.length > 0) return;
        if (storyInstance.canContinue) {
            await renderContinue();
        } else {
            closeStory();
        }
    });

    closeBtn.addEventListener('click', () => closeStory());

    // Keyboard handling: Enter/Space to advance, Esc to close
    document.addEventListener('keydown', async (e) => {
        if (container.style.display === 'none') return;
        if (e.key === 'Escape') {
            closeStory();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (storyInstance && storyInstance.currentChoices && storyInstance.currentChoices.length > 0) {
                const firstBtn = choicesEl.querySelector('.ink-choice-btn');
                if (firstBtn) firstBtn.focus();
                return;
            }
            if (storyInstance) {
                if (storyInstance.canContinue) await renderContinue();
                else closeStory();
            }
        }
    });

    // Expose API
    window.inkDialogue = window.inkDialogue || {};
    window.inkDialogue.startStoryFromPath = startStoryFromPath;
    window.inkDialogue.playSoundFromPack = playSoundFromPack; // expose for debug/other usage
    window.inkDialogue.loadSoundPack = loadSoundPack;
    // allowRepeat: if true, callers (e.g. game) can opt to let NPCs be triggered repeatedly
    if (typeof window.inkDialogue.allowRepeat === 'undefined') window.inkDialogue.allowRepeat = false;
    window.inkDialogue.setAllowRepeat = function(v) { window.inkDialogue.allowRepeat = !!v; };

})();
