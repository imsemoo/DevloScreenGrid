document.addEventListener('DOMContentLoaded', () => {
  const sidebar         = document.getElementById('sidebar');
  const toggleBtn       = document.getElementById('toggleSidebar');
  const groupListEl     = document.getElementById('groupList');
  const addGroupBtn     = document.getElementById('addGroupBtn');
  const groupPanel      = document.getElementById('groupPanel');
  const panelTitle      = document.getElementById('panelTitle');
  const groupForm       = document.getElementById('groupForm');
  const groupNameInput  = document.getElementById('groupNameInput');
  const channelNameInput= document.getElementById('channelNameInput');
  const channelUrlInput = document.getElementById('channelUrlInput');
  const addChannelBtn   = document.getElementById('addChannelBtn');
  const channelListEl   = document.getElementById('channelList');
  const cancelBtn       = document.getElementById('cancelGroupBtn');

  let groups = JSON.parse(localStorage.getItem('devloGroups')) || [];
  let editingIndex = null;
  let tempChannels = [];

  function save() {
    localStorage.setItem('devloGroups', JSON.stringify(groups));
  }

  function renderGroups() {
    groupListEl.innerHTML = '';
    groups.forEach((g, i) => {
      const li = document.createElement('li');
      if (i === editingIndex) li.classList.add('active');

      // Group name
      const nameSpan = document.createElement('span');
      nameSpan.className = 'group-name';
      nameSpan.textContent = g.name;
      li.appendChild(nameSpan);

      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener('click', e => {
        e.stopPropagation();
        editingIndex = i;
        openPanel(true);
      });
      li.appendChild(editBtn);

      // Select group
      li.addEventListener('click', () => selectGroup(i));
      groupListEl.appendChild(li);
    });
  }

  function selectGroup(i) {
    editingIndex = i;
    renderGroups();
    populateGrid(groups[i].channels);
    closePanel();
  }

  function populateGrid(channels) {
    const grid = document.getElementById('grid');
    grid.innerHTML = '';
    const n = channels.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    channels.forEach(ch => {
      const frame = document.createElement('div');
      frame.className = 'channel-frame';

      const iframe = document.createElement('iframe');
      let id = '';
      try {
        const urlObj = new URL(ch.url.includes('http') ? ch.url : 'https://' + ch.url);
        id = urlObj.searchParams.get('v') || urlObj.pathname.split('/').pop();
      } catch {
        id = ch.url;
      }
      iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&enablejsapi=1`;
      iframe.allow = 'autoplay; encrypted-media';
      iframe.allowFullscreen = true;
      frame.appendChild(iframe);

      const label = document.createElement('div');
      label.className = 'channel-label';
      label.textContent = ch.name;
      frame.appendChild(label);

      grid.appendChild(frame);
    });
  }

  function openPanel(isEdit) {
    groupPanel.classList.remove('hidden');
    setTimeout(() => groupPanel.classList.add('open'), 10);
    panelTitle.textContent = isEdit ? 'Edit Group' : 'Add New Group';
    if (isEdit) {
      groupNameInput.value  = groups[editingIndex].name;
      tempChannels          = [...groups[editingIndex].channels];
    } else {
      groupForm.reset();
      tempChannels = [];
    }
    renderChannelList();
  }

  function closePanel() {
    groupPanel.classList.remove('open');
    setTimeout(() => groupPanel.classList.add('hidden'), 300);
  }

  toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
  addGroupBtn.addEventListener('click', () => { editingIndex = null; openPanel(false); });
  cancelBtn.addEventListener('click', closePanel);

  addChannelBtn.addEventListener('click', () => {
    const name = channelNameInput.value.trim();
    const url  = channelUrlInput.value.trim();
    if (!name || !url) return;
    tempChannels.push({ name, url });
    channelNameInput.value = '';
    channelUrlInput.value  = '';
    renderChannelList();
  });

  function renderChannelList() {
    channelListEl.innerHTML = '';
    tempChannels.forEach((ch, idx) => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.index = idx;
      li.innerHTML = `<span>${ch.name}</span><button class="remove-btn" aria-label="Remove">×</button>`;

      // Remove channel
      li.querySelector('.remove-btn').addEventListener('click', () => {
        tempChannels.splice(idx, 1);
        renderChannelList();
      });

      // Drag & Drop
      li.addEventListener('dragstart', e => {
        e.dataTransfer.setData('text/plain', idx);
        li.classList.add('dragging');
      });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', e => e.preventDefault());
      li.addEventListener('drop', e => {
        e.preventDefault();
        const src = +e.dataTransfer.getData('text/plain');
        const tgt = +li.dataset.index;
        const [moved] = tempChannels.splice(src, 1);
        tempChannels.splice(tgt, 0, moved);
        renderChannelList();
      });

      channelListEl.appendChild(li);
    });
  }

  groupForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = groupNameInput.value.trim();
    if (!name || tempChannels.length === 0) return;
    const grp = { name, channels: [...tempChannels] };
    if (editingIndex === null) groups.push(grp);
    else groups[editingIndex] = grp;
    save(); renderGroups(); closePanel();
  });

  // Initial render
  renderGroups();
});