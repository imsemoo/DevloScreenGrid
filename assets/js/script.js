$(function () {
  // -----------------------
  // 1. Channel definitions
  // -----------------------
  const channels = [
    { id: 1, name: 'Al Jazeera Arabic', src: 'https://live-hls-web-aja.getaj.net/AJA/index.m3u8', epg: ['06:00 - صباح الجزيرة', '12:00 - الأخبار', '18:00 - الموجز المسائي'] },
    { id: 2, name: 'Al Jazeera English', src: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8', epg: ['07:00 - AJ Morning News', '13:00 - AJ Newsroom', '19:00 - News Hour'] },
    { id: 3, name: 'Al Jazeera Mubasher', src: 'https://live-hls-web-ajm.getaj.net/AJM/index.m3u8', epg: ['00:00–24:00 - Live'] },
    { id: 4, name: 'Al Jazeera Balkans', src: 'https://live-hls-web-ajb.getaj.net/AJB/index.m3u8', epg: ['06:00 - Dobro jutro Balkane', '12:00 - Vijesti', '18:00 - Dnevnik'] },
    { id: 5, name: 'Al Jazeera Documentary', src: 'https://live-hls-web-ajd.getaj.net/AJD/index.m3u8', epg: ['08:00 - Documentary World', '14:00 - Inside Story Docs', '20:00 - AJ Docs Prime'] },
    { id: 6, name: 'BBC News (HD)', src: 'https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/t=3840/v=pv14/b=5070016/main.m3u8', epg: ['06:00 - BBC Breakfast', '13:00 - News at One', '18:00 - News at Six'] }
  ];

  // ------------------------------
  // 2. Global DOM element pointers
  // ------------------------------
  const grid = document.getElementById('grid');
  const playPauseAllBtn = document.getElementById('playPauseAllBtn');
  const muteAllBtn = document.getElementById('muteAllBtn');
  const layoutBtn = document.getElementById('layoutBtn');
  const layoutMenu = document.getElementById('layoutMenu');
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
  let dragSrc = null;  // for drag‑and‑drop source reference

  // -----------------------------------
  // 3. Play/Pause All toggle listener
  // -----------------------------------
  playPauseAllBtn.addEventListener('click', () => {
    const videos = Array.from(grid.querySelectorAll('video'));
    const anyPaused = videos.some(v => v.paused);

    videos.forEach(v => {
      if (anyPaused) v.play().catch(() => { });  // ignore autoplay block
      else v.pause();
    });

    // swap button icon
    playPauseAllBtn.innerHTML = anyPaused
      ? '<i class="fas fa-pause"></i>'
      : '<i class="fas fa-play"></i>';
  });

  // -----------------------------------
  // 4. Mute/Unmute All listener
  // -----------------------------------
  muteAllBtn.addEventListener('click', () => {
    const videos = Array.from(grid.querySelectorAll('video'));
    const allMuted = videos.every(v => v.muted);

    videos.forEach(v => v.muted = !allMuted);

    // swap button icon
    muteAllBtn.innerHTML = allMuted
      ? '<i class="fas fa-volume-up"></i>'
      : '<i class="fas fa-volume-mute"></i>';
  });

  // --------------------------
  // 5. Layout menu listeners
  // --------------------------
  layoutBtn.addEventListener('click', () => {
    layoutMenu.classList.toggle('active');
  });

  layoutMenu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      createGrid(parseInt(li.dataset.value));
      layoutMenu.classList.remove('active');
    });
  });

  // -------------------------
  // 6. Grid creation function
  // -------------------------
  function createGrid(count) {
    grid.innerHTML = '';

    // Build assignment: real channels or null for empty slots
    const assignment = Array.from({ length: count }, (_, i) => channels[i] || null);

    // Calculate rows/cols
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Render each slot
    assignment.forEach((channel, idx) => {
      const frame = document.createElement('div');
      frame.draggable = true;
      frame.dataset.index = idx;

      if (channel) {
        // ——— Channel frame ———
        frame.className = 'channel-frame';

        // Create video element
        const video = document.createElement('video');
        video.muted = true;      // start muted
        video.controls = true;
        video.loading = 'lazy';

        // Attach HLS stream if supported
        if (Hls.isSupported()) {
          const hls = new Hls({ capLevelToPlayerSize: true });
          hls.loadSource(channel.src);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => video.play());
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          // Native HLS support (Safari/iOS)
          video.src = channel.src;
          video.addEventListener('loadedmetadata', () => video.play());
        }

        // Build overlay buttons
        const overlay = document.createElement('div');
        overlay.className = 'overlay';

        // Focus (expand) button
        const focusBtn = document.createElement('button');
        focusBtn.innerHTML = '<i class="fas fa-expand"></i>';
        focusBtn.title = 'Focus view';
        focusBtn.addEventListener('click', () => toggleFocus(frame));
        overlay.appendChild(focusBtn);

        // EPG (guide) button
        const epgBtn = document.createElement('button');
        epgBtn.innerHTML = '<i class="far fa-calendar-alt"></i>';
        epgBtn.title = 'Show EPG';
        epgBtn.addEventListener('click', () => showEPG(channel));
        overlay.appendChild(epgBtn);

        // Favorite toggle button
        const favBtn = document.createElement('button');
        favBtn.innerHTML = favorites.includes(channel.id)
          ? '<i class="fas fa-star"></i>'
          : '<i class="far fa-star"></i>';
        favBtn.title = 'Toggle Favorite';
        favBtn.addEventListener('click', () => toggleFav(channel, favBtn));
        overlay.appendChild(favBtn);

        // DVR play/pause button
        const dvrBtn = document.createElement('button');
        dvrBtn.innerHTML = '<i class="fas fa-play"></i>';
        dvrBtn.title = 'Play/Pause';
        dvrBtn.addEventListener('click', () => {
          if (video.paused) {
            video.play();
            dvrBtn.innerHTML = '<i class="fas fa-pause"></i>';
          } else {
            video.pause();
            dvrBtn.innerHTML = '<i class="fas fa-play"></i>';
          }
        });
        overlay.appendChild(dvrBtn);

        frame.appendChild(video);
        frame.appendChild(overlay);

      } else {
        // ——— Placeholder for empty slot ———
        frame.className = 'empty-frame';
        const addBtn = document.createElement('button');
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBtn.title = 'Add channel to this slot';
        addBtn.addEventListener('click', () => {
          console.log('Open channel picker for slot', idx);
          // TODO: wire up your channel-picker UI here
        });
        frame.appendChild(addBtn);
      }

      // Enable drag & drop on this frame
      addDragEvents(frame);
      grid.appendChild(frame);
    });
  }

  // --------------------------------------------
  // 7. Focus mode: expand one frame to full view
  // --------------------------------------------
  function toggleFocus(frame) {
    document.body.classList.toggle('focus-mode');
    if (document.body.classList.contains('focus-mode')) {
      frame.classList.add('focus-frame');
      // hide all others
      [...grid.children].forEach(ch => {
        if (ch !== frame) ch.style.display = 'none';
      });
    } else {
      // restore all
      [...grid.children].forEach(ch => ch.style.display = 'block');
      frame.classList.remove('focus-frame');
    }
  }

  // -------------------------------------------------
  // 8. Show EPG modal for selected channel’s schedule
  // -------------------------------------------------
  function showEPG(channel) {
    $('#epgTitle').text(`EPG - ${channel.name}`);
    const $list = $('#epgList').empty();
    channel.epg.forEach(item => {
      $('<li>').text(item).appendTo($list);
    });
    toggleModal('epgModal');
  }

  // --------------------------
  // 9. Simple modal toggler
  // --------------------------
  function toggleModal(id) {
    $(`#${id}`).toggleClass('active');
  }

  // --------------------------------------------
  // 10. Toggle favorite state and persist in LS
  // --------------------------------------------
  function toggleFav(channel, btn) {
    if (favorites.includes(channel.id)) {
      favorites = favorites.filter(id => id !== channel.id);
      btn.innerHTML = '<i class="far fa-star"></i>';
    } else {
      favorites.push(channel.id);
      btn.innerHTML = '<i class="fas fa-star"></i>';
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  // --------------------------------------
  // 11. Show favorites list in modal
  // --------------------------------------
  $('#favoritesBtn').on('click', () => {
    const $favList = $('#favList').empty();
    favorites.forEach(id => {
      const ch = channels.find(c => c.id === id);
      $('<li>').text(ch.name).appendTo($favList);
    });
    toggleModal('favModal');
  });

  // --------------------------------------
  // 12. Share snapshot via html2canvas
  // --------------------------------------

  $('#shareBtn').on('click', () => {
    // now html2canvas is guaranteed to exist
    html2canvas($('#grid')[0])
      .then(canvas => {
        const link = document.createElement('a');
        link.download = 'snapshot.png';
        link.href = canvas.toDataURL();
        link.click();
      })
      .catch(err => console.error('html2canvas failed:', err));
  });
  // --------------------------------------
  // 13. Simulate breaking news alert banner
  // --------------------------------------
  setTimeout(() => {
    $('#alertText').text('Major event happening now!');
    $('#alert-banner').show();
  }, 10000);

  // ------------------------------
  // 14. Drag & Drop functionality
  // ------------------------------
  function addDragEvents(elem) {
    elem.addEventListener('dragstart', e => {
      dragSrc = e.currentTarget;
      elem.classList.add('dragging');
    });
    elem.addEventListener('dragend', e => {
      elem.classList.remove('dragging');
    });
    elem.addEventListener('dragover', e => e.preventDefault());
    elem.addEventListener('drop', e => {
      e.preventDefault();
      const target = e.currentTarget;
      if (!dragSrc || target === dragSrc) return;

      const parent = dragSrc.parentNode;
      const nextDrag = dragSrc.nextSibling;
      const nextTgt = target.nextSibling;

      // swap frame elements to preserve all listeners
      parent.insertBefore(dragSrc, nextTgt);
      parent.insertBefore(target, nextDrag);
    });
  }

  // -------------------------
  // Initialize with 3×3 grid
  // -------------------------
  createGrid(9);
  [
    { id: 'epgModal', closeBtn: '.epg-close' },
    { id: 'favModal', closeBtn: '.fav-close' }
  ].forEach(({ id, closeBtn }) => {
    const modal = document.getElementById(id);

    // Close when clicking the backdrop (only if target is the overlay)
    modal.addEventListener('click', e => {
      if (e.target === modal) toggleModal(id);
    });

    // Close when clicking the header “×” button
    modal.querySelector(closeBtn)
      .addEventListener('click', () => toggleModal(id));
  });
  // Open modal
  document.getElementById('loginBtn').onclick = () => openAuth('login');
  document.getElementById('signupBtn').onclick = () => openAuth('signup');
  document.querySelector('.modal-close').onclick = closeAuth;
  document.getElementById('authModal').onclick = e => {
    if (e.target.id === 'authModal') closeAuth();
  };

  function openAuth(tab) {
    document.getElementById('authModal').classList.add('active');
    switchTab(tab);
  }
  function closeAuth() {
    document.getElementById('authModal').classList.remove('active');
  }
  function switchTab(tab) {
    document.querySelectorAll('.auth-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.toggle('active', f.id === tab + 'Form'));
  }
  document.querySelectorAll('.auth-tabs button')
    .forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

  // ====== Video Recording via Offscreen Canvas ======
  const recordBtn = document.getElementById('recordBtn');
  let mediaRecorder, recordedChunks = [], drawInterval, canvasRec, ctx;

  recordBtn.addEventListener('click', () => {
    // If not recording yet → start
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      // 1) Create a hidden canvas matching #grid size
      const rect = grid.getBoundingClientRect();
      canvasRec = document.createElement('canvas');
      canvasRec.width = rect.width;
      canvasRec.height = rect.height;
      ctx = canvasRec.getContext('2d');

      // 2) Capture its stream at 30fps
      const stream = canvasRec.captureStream(30);

      // 3) Set up MediaRecorder
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
      mediaRecorder.ondataavailable = e => {
        if (e.data.size) recordedChunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        clearInterval(drawInterval);       // stop drawing loop
        // build blob & trigger download
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grid-${Date.now()}.webm`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      };

      mediaRecorder.start();
      recordBtn.classList.add('recording');
      recordBtn.innerHTML = '<i class="fas fa-stop"></i>';

      // 4) Draw loop: every frame, copy each video into the canvas
      drawInterval = setInterval(() => {
        // clear previous frame
        ctx.clearRect(0, 0, canvasRec.width, canvasRec.height);

        // for each <video> in the grid...
        grid.querySelectorAll('video').forEach(video => {
          const vRect = video.getBoundingClientRect();
          // compute its position relative to the grid:
          const x = vRect.left - rect.left;
          const y = vRect.top - rect.top;
          // draw the current frame
          try {
            ctx.drawImage(video, x, y, vRect.width, vRect.height);
          } catch (err) {
            // sometimes drawImage() can throw if video not ready — ignore
          }
        });
      }, 1000 / 30); // 30fps

    }
    // Otherwise → stop recording
    else {
      mediaRecorder.stop();
      recordBtn.classList.remove('recording');
      recordBtn.innerHTML = '<i class="fas fa-circle"></i>';
    }
  });

});
