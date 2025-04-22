$(function () {

  const channels = [
    {
      id: 1,
      name: 'Al Jazeera Arabic',
      src: 'https://live-hls-web-aja.getaj.net/AJA/index.m3u8',
      epg: [
        '06:00 - صباح الجزيرة',
        '12:00 - الأخبار',
        '18:00 - الموجز المسائي'
      ]
    },
    {
      id: 2,
      name: 'Al Jazeera English',
      src: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
      epg: [
        '07:00 - AJ Morning News',
        '13:00 - AJ Newsroom',
        '19:00 - News Hour'
      ]
    },
    {
      id: 3,
      name: 'Al Jazeera Mubasher',
      src: 'https://live-hls-web-ajm.getaj.net/AJM/index.m3u8',
      epg: [
        '00:00–24:00 - بث مباشر'
      ]
    },
    {
      id: 4,
      name: 'Al Jazeera Balkans',
      src: 'https://live-hls-web-ajb.getaj.net/AJB/index.m3u8',
      epg: [
        '06:00 - Dobro jutro Balkane',
        '12:00 - Vijesti',
        '18:00 - Dnevnik'
      ]
    },
    {
      id: 5,
      name: 'Al Jazeera Documentary',
      src: 'https://live-hls-web-ajd.getaj.net/AJD/index.m3u8',
      epg: [
        '08:00 - Documentary World',
        '14:00 - Inside Story Docs',
        '20:00 - AJ Docs Prime'
      ]
    },
    {
      id: 6,
      name: 'BBC News (HD)',
      src: 'https://vs-hls-push-ww-live.akamaized.net/x=4/i=urn:bbc:pips:service:bbc_news_channel_hd/t=3840/v=pv14/b=5070016/main.m3u8',
      epg: [
        '06:00 - BBC Breakfast',
        '13:00 - BBC News at One',
        '18:00 - BBC News at Six'
      ]
    }
  ];

  const muteAllBtn = document.getElementById('muteAllBtn');
  // === Play/Pause All toggle button ===
  const playPauseAllBtn = document.getElementById('playPauseAllBtn');
  const grid = document.getElementById('grid');
  let favorites = JSON.parse(localStorage.getItem('favorites')) || [];


  playPauseAllBtn.addEventListener('click', () => {
    const videos = Array.from(document.querySelectorAll('#grid video'));
    // If any video is paused, we want to play all; otherwise pause all
    const anyPaused = videos.some(video => video.paused);

    videos.forEach(video => {
      if (anyPaused) {
        video.play().catch(() => { /* autoplay might be blocked */ });
      } else {
        video.pause();
      }
    });

    // Update the button icon
    playPauseAllBtn.innerHTML = anyPaused
      ? '<i class="fas fa-pause"></i>'
      : '<i class="fas fa-play"></i>';
  });

  // Mute or unmute all videos in the grid
  muteAllBtn.addEventListener('click', () => {
    const videos = Array.from(document.querySelectorAll('#grid video'));
    const allMuted = videos.every(video => video.muted);

    videos.forEach(video => {
      video.muted = !allMuted;
    });

    // Update the button icon
    muteAllBtn.innerHTML = allMuted
      ? '<i class="fas fa-volume-up"></i>'
      : '<i class="fas fa-volume-mute"></i>';
  });
  // Layout controls
  const layoutBtn = document.getElementById('layoutBtn');
  const layoutMenu = document.getElementById('layoutMenu');
  layoutBtn.addEventListener('click', () => layoutMenu.classList.toggle('active'));
  layoutMenu.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      createGrid(parseInt(li.dataset.value));
      layoutMenu.classList.remove('active');
    });
  });

  function createGrid(count) {
    grid.innerHTML = '';
    const cols = Math.ceil(Math.sqrt(count));
    const rows = Math.ceil(count / cols);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    for (let i = 0; i < count; i++) {
      const frame = document.createElement('div');
      frame.className = 'channel-frame';
      frame.draggable = true;
      frame.dataset.index = i;

      const channel = channels[i % channels.length];
      const video = document.createElement('video');

      // ⬅️ كتم الصوت افتراضيًا
      video.muted = true;
      video.controls = true;
      video.loading = 'lazy';

      // HLS.js adaptive streaming
      if (Hls.isSupported()) {
        const hls = new Hls({ capLevelToPlayerSize: true });
        hls.loadSource(channel.src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play();
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.src;
        video.addEventListener('loadedmetadata', () => video.play());
      } else {
        console.warn('HLS غير مدعوم في هذا المتصفح.');
      }

      // بقية الأوفرلي وأزرار التحكم...
      const overlay = document.createElement('div');
      overlay.className = 'overlay';
      // مثلاً نضيف زر تشغيل/إيقاف كتم خاص بالإطار:
      const volBtn = document.createElement('button');
      volBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
      volBtn.onclick = () => {
        video.muted = !video.muted;
        volBtn.innerHTML = video.muted
          ? '<i class="fas fa-volume-mute"></i>'
          : '<i class="fas fa-volume-up"></i>';
      };
      overlay.appendChild(volBtn);

      // ... أزرار التركيز، EPG، المفضلة، DVR

      frame.appendChild(video);
      frame.appendChild(overlay);
      addDragEvents(frame);
      grid.appendChild(frame);
    }
  }


  function toggleFocus(frame) {
    document.body.classList.toggle('focus-mode');
    if (document.body.classList.contains('focus-mode')) {
      frame.classList.add('focus-frame');
      [...grid.children].forEach(child => { if (child !== frame) child.style.display = 'none'; });
    } else {
      [...grid.children].forEach(child => child.style.display = 'block');
      frame.classList.remove('focus-frame');
    }
  }

  function showEPG(channel) {
    document.getElementById('epgTitle').textContent = `EPG - ${channel.name}`;
    const list = document.getElementById('epgList'); list.innerHTML = '';
    channel.epg.forEach(item => { const li = document.createElement('li'); li.textContent = item; list.appendChild(li); });
    toggleModal('epgModal');
  }

  function toggleModal(id) { document.getElementById(id).classList.toggle('active'); }

  function toggleFav(channel, btn) {
    if (favorites.includes(channel.id)) { favorites = favorites.filter(id => id !== channel.id); btn.innerHTML = '<i class="far fa-star"></i>'; }
    else { favorites.push(channel.id); btn.innerHTML = '<i class="fas fa-star"></i>'; }
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }

  document.getElementById('favoritesBtn').onclick = () => {
    const list = document.getElementById('favList'); list.innerHTML = '';
    favorites.forEach(id => { const ch = channels.find(c => c.id === id); const li = document.createElement('li'); li.textContent = ch.name; list.appendChild(li); });
    toggleModal('favModal');
  };

  document.getElementById('shareBtn').onclick = () => {
    html2canvas(grid).then(canvas => {
      const link = document.createElement('a'); link.download = 'devloscreengrid-snapshot.png'; link.href = canvas.toDataURL(); link.click();
    });
  };

  // Simulated breaking news
  setTimeout(() => {
    document.getElementById('alertText').textContent = 'Major event happening now!';
    document.getElementById('alert-banner').style.display = 'block';
  }, 10000);

// At the top of script.js
let dragSrc = null;

// Replace the old addDragEvents with this:
function addDragEvents(elem) {
  // When drag starts, remember the source element
  elem.addEventListener('dragstart', e => {
    dragSrc = e.currentTarget;
    e.currentTarget.classList.add('dragging');
  });

  // When drag ends, remove dragging style
  elem.addEventListener('dragend', e => {
    e.currentTarget.classList.remove('dragging');
  });

  // Allow dropping
  elem.addEventListener('dragover', e => {
    e.preventDefault();
  });

  // On drop, swap the two frame elements in the DOM
  elem.addEventListener('drop', e => {
    e.preventDefault();
    const dropTarget = e.currentTarget;
    if (!dragSrc || dropTarget === dragSrc) return;

    const parent = dragSrc.parentNode;
    const dragNext = dragSrc.nextSibling;
    const dropNext = dropTarget.nextSibling;

    // Swap positions
    parent.insertBefore(dragSrc, dropNext);
    parent.insertBefore(dropTarget, dragNext);
  });
}


  // Initialize default grid
  createGrid(9);
});
