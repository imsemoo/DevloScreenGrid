// assets/js/groups.js
(function () {

  const channels = [
    { id: 1, type: 'youtube', name: 'AlJazeera', src: 'bNyUyrR0PHo', lang: 'ar' },
    { id: 2, type: 'youtube', name: 'AlJazeeraMubasher', src: 'Lwbp9WfLslc', lang: 'ar' },
    { id: 3, type: 'youtube', name: 'AlArabiya', src: 'n7eQejkXbnM', lang: 'ar' },
    { id: 4, type: 'youtube', name: 'AlHadath', src: 'zq6ohxTDNZY', lang: 'ar' },
    { id: 5, type: 'youtube', name: 'Alaraby', src: 'e2RgSa1Wt5o', lang: 'ar' },
    { id: 6, type: 'youtube', name: 'AlMayadeen', src: 'TwDlQ71TNmk', lang: 'ar' },
    { id: 7, type: 'youtube', name: 'SkyNewsArabia', src: 'oY976rzO-EI', lang: 'ar' },
    { id: 8, type: 'youtube', name: 'TRTarabic', src: '01uyBBN5TVc', lang: 'ar' },
    { id: 9, type: 'youtube', name: 'AlHiwar', src: 'qZDWVJ7LlQM', lang: 'ar' },
    { id: 10, type: 'youtube', name: 'FRANCE 24', src: 'VuYzy8IuT0Y', lang: 'ar' },
    { id: 11, type: 'youtube', name: 'BBCarabic', src: 'hC9fwQXSUCk', lang: 'ar' },
    { id: 12, type: 'youtube', name: 'Alhurra', src: 'AiUw_MeP-xo', lang: 'ar' },
    { id: 13, type: 'youtube', name: 'Alghad', src: 'BpcESs5YRDo', lang: 'ar' },
    { id: 14, type: 'youtube', name: 'DW', src: 'AGkp2AL8e7o', lang: 'ar' },
    { id: 15, type: 'youtube', name: 'AlikhbariahSyria', src: 'BxlYdwIqZ5w', lang: 'ar' },
    { id: 16, type: 'youtube', name: 'SyriaTV', src: 'OLWU0rKOQ6o', lang: 'ar' },
    { id: 17, type: 'youtube', name: 'RoyaNews', src: 'k8NkcKVCk5w', lang: 'ar' },
    { id: 18, type: 'website', name: 'Almanar', src: 'https://www.almanar.com.lb/live/', lang: 'ar' },
    { id: 19, type: 'website', name: 'Palestine', src: 'https://www.pbc.ps/live/', lang: 'ar' },
    { id: 20, type: 'website', name: 'Alalam', src: 'https://www.alalam.ir/live', lang: 'ar' }
  ];


  // ---------------------------------------
  // 2. YouTube API players map
  // ---------------------------------------
  const ytPlayers = {};

  // ---------------------------------------
  // 3. Global DOM & state pointers
  // ---------------------------------------
  const grid = document.getElementById('grid');
  const playPauseAllBtn = document.getElementById('playPauseAllBtn');
  const muteAllBtn = document.getElementById('muteAllBtn');
  const layoutBtn = document.getElementById('layoutBtn');
  const layoutMenu = document.getElementById('layoutMenu');
  let dragSrc = null;

  // ---------------------------------------
  // 4. Bulk Play/Pause All toggle listener
  // ---------------------------------------
  // ---------------------------------------
  // Bulk Play/Pause All toggle listener
  // ---------------------------------------
  let allPlaying = false; // tracks current state

  playPauseAllBtn.addEventListener('click', () => {
    // 1) Gather native <video> elements
    const videos = Array.from(grid.querySelectorAll('video'));
    // 2) Gather YouTube iframes
    const iframes = Array.from(grid.querySelectorAll('iframe.youtube-frame'));

    if (!allPlaying) {
      // —— Currently paused/stopped ⇒ play everything ——
      videos.forEach(v => v.play().catch(() => { })); // ignore autoplay blocks
      iframes.forEach(iframe => {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'playVideo',
          args: []
        }), '*');
      });
      // Update button to “Pause All” icon
      playPauseAllBtn.innerHTML = '<i class="fas fa-pause"></i>';
      allPlaying = true;

    } else {
      // —— Currently playing ⇒ pause everything ——
      videos.forEach(v => v.pause());
      iframes.forEach(iframe => {
        iframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'pauseVideo',
          args: []
        }), '*');
      });
      // Update button to “Play All” icon
      playPauseAllBtn.innerHTML = '<i class="fas fa-play"></i>';
      allPlaying = false;
    }
  });

  // ---------------------------------------
  // 5. Bulk Mute/Unmute All toggle listener
  // ---------------------------------------
  // -----------------------------------
  // Mute/Unmute All listener
  // -----------------------------------
  muteAllBtn.addEventListener('click', () => {
    // collect all HLS <video> elements
    const videos = Array.from(grid.querySelectorAll('video'));
    // true if every video is currently muted (or none exist)
    const videoAllMuted = videos.length === 0 || videos.every(v => v.muted);

    // collect all YouTube player instances
    const ytList = Object.values(ytPlayers);
    // true if every YouTube player is currently muted (or none exist)
    const ytAllMuted = ytList.length === 0 || ytList.every(p => p.isMuted());

    // if both sets are muted, treat as “everything muted”
    const allMuted = videoAllMuted && ytAllMuted;

    if (allMuted) {
      // —— currently all muted, so unmute everything ——
      videos.forEach(v => v.muted = false);
      ytList.forEach(p => p.unMute());
      // update icon to “sound on”
      muteAllBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
    } else {
      // —— otherwise, mute everything ——
      videos.forEach(v => v.muted = true);
      ytList.forEach(p => p.mute());
      // update icon to “muted”
      muteAllBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  });

  // 0. Drag Mode toggle
  // 0. Drag Mode toggle (updated)
  let dragEnabled = false;
  const dragModeBtn = document.getElementById('dragModeBtn');

  dragModeBtn.addEventListener('click', () => {
    dragEnabled = !dragEnabled;
    dragModeBtn.classList.toggle('active', dragEnabled);

    // For every slot (channel or placeholder)…
    document.querySelectorAll('.channel-frame, .empty-frame').forEach(frame => {
      // 1) Enable/disable dragging
      frame.draggable = dragEnabled;

      // 2) If it contains a YouTube iframe, toggle its pointer-events
      const yt = frame.querySelector('iframe.youtube-frame');
      if (yt) yt.style.pointerEvents = dragEnabled ? 'none' : 'auto';

      // 3) Change the cursor on hover to show “move” when active
      frame.style.cursor = dragEnabled ? 'move' : 'default';
    });
  });

  // ---------------------------------------
  // 6. Layout menu listeners
  // ---------------------------------------
  layoutBtn.addEventListener('click', () => layoutMenu.classList.toggle('active'));
  layoutMenu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      createGrid(parseInt(li.dataset.value));
      layoutMenu.classList.remove('active');
    });
  });

  // ---------------------------------------
  // 7. createGrid: render frames
  // ---------------------------------------
  function createGrid(count) {
    grid.innerHTML = '';
    const assignment = Array.from({ length: count }, (_, i) => channels[i] || null);
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    assignment.forEach((channel, idx) => {
      const frame = document.createElement('div');
      frame.className = channel ? 'channel-frame' : 'empty-frame';
      frame.draggable = dragEnabled;
      let allPlaying = true;
      frame.dataset.index = idx;

      if (channel) {
        // YouTube embed
        const base = `https://www.youtube.com/embed/${channel.src}`;
        const sep = base.includes('?') ? '&' : '?';
        const iframe = document.createElement('iframe');
        iframe.id = 'yt-' + channel.id;
        iframe.src = base + sep + 'autoplay=1&mute=1&enablejsapi=1';
        iframe.allow = 'autoplay; encrypted-media';
        iframe.allowFullscreen = true;
        iframe.className = 'youtube-frame';
        frame.appendChild(iframe);

        // Overlay: focus only
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        const focusBtn = document.createElement('button');
        focusBtn.innerHTML = '<i class="fas fa-expand"></i>';
        focusBtn.title = 'Focus view';
        focusBtn.addEventListener('click', () => toggleFocus(frame));
        overlay.appendChild(focusBtn);
        frame.appendChild(overlay);
      } else {
        // placeholder
        const addBtn = document.createElement('button');
        addBtn.innerHTML = '<i class="fas fa-plus"></i>';
        addBtn.title = 'Add channel here';
        addBtn.addEventListener('click', () => console.log('Add slot', idx));
        frame.appendChild(addBtn);
      }

      addDragEvents(frame);
      grid.appendChild(frame);
    });

    initYouTubePlayers();
  }

  // ---------------------------------------
  // 8. Initialize YouTube players
  // ---------------------------------------
  function initYouTubePlayers() {
    Object.keys(ytPlayers).forEach(k => delete ytPlayers[k]);
    document.querySelectorAll('iframe.youtube-frame').forEach(iframe => {
      ytPlayers[iframe.id] = new YT.Player(iframe.id);
    });
  }
  window.onYouTubeIframeAPIReady = initYouTubePlayers;

  // ---------------------------------------
  // 9. Focus mode
  // ---------------------------------------
  function toggleFocus(frame) {
    document.body.classList.toggle('focus-mode');
    if (document.body.classList.contains('focus-mode')) {
      frame.classList.add('focus-frame');
      [...grid.children].forEach(ch => { if (ch !== frame) ch.style.display = 'none'; });
    } else {
      [...grid.children].forEach(ch => ch.style.display = 'block');
      frame.classList.remove('focus-frame');
    }
  }

  // ---------------------------------------
  // 10. Login Modal
  // ---------------------------------------

  const loginBtn = document.getElementById('loginBtn');
  const loginModal = document.getElementById('loginModal');
  const loginClose = loginModal.querySelector('.modal-close');

  // Open login modal
  loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
  });

  // Close when clicking X or outside the box
  loginClose.addEventListener('click', () => {
    loginModal.classList.remove('active');
  });
  loginModal.addEventListener('click', e => {
    if (e.target === loginModal) {
      loginModal.classList.remove('active');
    }
  });

  // ---------------------------------------
  // 11. Share snapshot
  // ---------------------------------------
  $('#shareBtn').on('click', () => {
    html2canvas($('#grid')[0]).then(canvas => {
      const link = document.createElement('a');
      link.download = 'snapshot.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  });



  // ---------------------------------------
  // 13. Drag & Drop
  // ---------------------------------------
  /**
  * Attaches drag/drop listeners to a frame.
  * Prevents child elements from hijacking drag events,
  * and only works when dragEnabled is true.
  */
  function addDragEvents(frame) {
    // 1) Children must not be draggable themselves
    frame.querySelectorAll('*').forEach(child => {
      child.draggable = false;
    });

    // 2) dragstart — only if allowed
    frame.addEventListener('dragstart', e => {
      if (!dragEnabled) {
        e.preventDefault();
        return;
      }
      dragSrc = frame;
      frame.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    // 3) dragend — tidy up
    frame.addEventListener('dragend', () => {
      frame.classList.remove('dragging');
    });

    // 4) dragover — must call preventDefault to allow drop
    frame.addEventListener('dragover', e => {
      if (!dragEnabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    // 5) drop — swap the two frames
    frame.addEventListener('drop', e => {
      if (!dragEnabled) return;
      e.preventDefault();
      const target = frame;
      if (!dragSrc || target === dragSrc) return;

      const parent = dragSrc.parentNode;
      const dragNext = dragSrc.nextSibling;
      const targetNext = target.nextSibling;

      // swap their positions in the DOM
      parent.insertBefore(dragSrc, targetNext);
      parent.insertBefore(target, dragNext);
    });
  }

  // ---------------------------------------
  // 14. Video Recording (offscreen canvas)
  // ---------------------------------------
  const recordBtn = document.getElementById('recordBtn');
  let mediaRecorder, recordedChunks = [], drawInterval, canvasRec, ctx;

  recordBtn.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      const rect = grid.getBoundingClientRect();
      canvasRec = document.createElement('canvas');
      canvasRec.width = rect.width;
      canvasRec.height = rect.height;
      ctx = canvasRec.getContext('2d');

      const stream = canvasRec.captureStream(30);
      recordedChunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      mediaRecorder.ondataavailable = e => { if (e.data.size) recordedChunks.push(e.data); };
      mediaRecorder.onstop = () => {
        clearInterval(drawInterval);
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `grid-${Date.now()}.webm`;
        document.body.appendChild(a); a.click();
        URL.revokeObjectURL(url); document.body.removeChild(a);
      };

      mediaRecorder.start();
      recordBtn.classList.add('recording');
      recordBtn.innerHTML = '<i class="fas fa-stop"></i>';

      drawInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvasRec.width, canvasRec.height);
        grid.querySelectorAll('video').forEach(video => {
          const v = video.getBoundingClientRect();
          try { ctx.drawImage(video, v.left - rect.left, v.top - rect.top, v.width, v.height); } catch { }
        });
      }, 1000 / 30);

    } else {
      mediaRecorder.stop();
      recordBtn.classList.remove('recording');
      recordBtn.innerHTML = '<i class="fas fa-circle"></i>';
    }
  });

  // ---------------------------------------
  // 15. Initialize with 3×3 grid
  // ---------------------------------------
  createGrid(9);
})();
