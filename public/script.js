// Utilities
const $ = (sel) => document.querySelector(sel);

function getToken(){ return localStorage.getItem('token'); }
function setToken(t){ localStorage.setItem('token', t); }
function clearToken(){ localStorage.removeItem('token'); }

function showSpinner(show){ const el=$('#global-spinner'); if(!el) return; el.classList.toggle('hidden', !show); }
function notify(message, type){
  const root = $('#notify-root'); if(!root) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type||''}`;
  toast.textContent = message;
  root.appendChild(toast);
  setTimeout(()=>{ toast.remove(); }, 3000);
}

async function api(path, options){
  const headers = { 'Content-Type':'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const opts = Object.assign({ method:'GET', headers }, options||{});
  if (opts.body && typeof opts.body !== 'string') opts.body = JSON.stringify(opts.body);
  showSpinner(true);
  try {
    const res = await fetch(path, opts);
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } finally { showSpinner(false); }
}

// Auth page logic
function setupAuthPage(){
  const loginTab = $('#tab-login');
  const registerTab = $('#tab-register');
  const loginForm = $('#login-form');
  const registerForm = $('#register-form');
  if (!loginTab || !registerTab) return;
  loginTab.addEventListener('click', ()=>{
    loginTab.classList.add('active'); registerTab.classList.remove('active');
    loginForm.classList.add('active'); registerForm.classList.remove('active');
  });
  registerTab.addEventListener('click', ()=>{
    registerTab.classList.add('active'); loginTab.classList.remove('active');
    registerForm.classList.add('active'); loginForm.classList.remove('active');
  });

  const loginSubmit = $('#login-submit');
  loginSubmit && loginSubmit.addEventListener('click', async ()=>{
    const email = $('#login-email').value.trim();
    const password = $('#login-password').value;
    if(!email || !password) return notify('Please enter email and password','error');
    try{
      const { token } = await api('/api/auth/login', { method:'POST', body:{ email, password } });
      setToken(token);
      location.href = '/dashboard.html';
    }catch(e){ notify(e.message,'error'); }
  });

  const regSubmit = $('#register-submit');
  regSubmit && regSubmit.addEventListener('click', async ()=>{
    const name = $('#reg-name').value.trim();
    const email = $('#reg-email').value.trim();
    const phone_no = $('#reg-phone').value.trim();
    const address = $('#reg-address').value.trim();
    const password = $('#reg-password').value;
    if(!name || !email || !phone_no || !password) return notify('Fill required fields','error');
    try{
      const { token } = await api('/api/auth/register', { method:'POST', body:{ name, email, phone_no, address, password } });
      setToken(token);
      location.href = '/dashboard.html';
    }catch(e){ notify(e.message,'error'); }
  });
}

// Dashboard logic
async function ensureAuth(){
  const token = getToken();
  if(!token){ location.replace('/'); return false; }
  return true;
}

function buildInput(labelText, value, id){
  const wrapper = document.createElement('div');
  const label = document.createElement('label'); label.textContent = labelText;
  const input = document.createElement('input'); input.value = value||''; if (id) input.id = id;
  wrapper.appendChild(label); wrapper.appendChild(input);
  return { wrapper, input };
}

async function loadProfile(){
  const data = await api('/api/customer/profile');
  const content = $('#profile-content'); content.innerHTML='';
  const nameRow = buildInput('Name', data.name, 'profile-name');
  const phoneRow = buildInput('Phone', data.phone_no, 'profile-phone');
  const addrWrap = document.createElement('div');
  const l = document.createElement('label'); l.textContent='Address';
  const t = document.createElement('textarea'); t.id='profile-address'; t.value = data.address||'';
  addrWrap.appendChild(l); addrWrap.appendChild(t);
  const emailInfo = document.createElement('div'); emailInfo.className='row'; emailInfo.textContent = 'Email: ' + data.email;
  content.appendChild(emailInfo);
  content.appendChild(nameRow.wrapper);
  content.appendChild(phoneRow.wrapper);
  content.appendChild(addrWrap);

  const actions = $('#profile-actions'); actions.innerHTML='';
  const editBtn = document.createElement('button'); editBtn.textContent='Edit';
  const saveBtn = document.createElement('button'); saveBtn.textContent='Save'; saveBtn.className='secondary'; saveBtn.style.display='none';
  const cancelBtn = document.createElement('button'); cancelBtn.textContent='Cancel'; cancelBtn.className='ghost'; cancelBtn.style.display='none';
  actions.appendChild(editBtn); actions.appendChild(saveBtn); actions.appendChild(cancelBtn);

  const setDisabled = (disabled)=>{
    nameRow.input.disabled = disabled; phoneRow.input.disabled = disabled; t.disabled = disabled;
  };
  setDisabled(true);

  editBtn.addEventListener('click', ()=>{ setDisabled(false); saveBtn.style.display=''; cancelBtn.style.display=''; editBtn.style.display='none'; });
  cancelBtn.addEventListener('click', ()=>{ setDisabled(true); saveBtn.style.display='none'; cancelBtn.style.display='none'; editBtn.style.display=''; loadProfile(); });
  saveBtn.addEventListener('click', async ()=>{
    try{
      const updated = await api('/api/customer/profile', { method:'PUT', body:{ name:nameRow.input.value.trim(), phone_no:phoneRow.input.value.trim(), address:t.value.trim() } });
      notify('Profile updated','success');
      setDisabled(true); saveBtn.style.display='none'; cancelBtn.style.display='none'; editBtn.style.display='';
    }catch(e){ notify(e.message,'error'); }
  });
}

async function loadVehicles(){
  const list = await api('/api/vehicles');
  const root = $('#vehicles-list'); root.innerHTML='';
  list.forEach(v => {
    const card = document.createElement('div'); card.className='vehicle-card';
    const title = document.createElement('div'); title.textContent = `${v.brand||''} ${v.model||''}`.trim() || 'Vehicle';
    const license = document.createElement('div'); license.className='row'; license.textContent = 'License: ' + v.license_no;
    const actions = document.createElement('div'); actions.className='row gap';
    const view = document.createElement('button'); view.textContent='View History';
    const addService = document.createElement('button'); addService.textContent='Add Service';
    const edit = document.createElement('button'); edit.className='secondary'; edit.textContent='Edit';
    const del = document.createElement('button'); del.className='danger'; del.textContent='Delete';
    actions.appendChild(view); actions.appendChild(addService); actions.appendChild(edit); actions.appendChild(del);
    card.appendChild(title); card.appendChild(license); card.appendChild(actions);
    root.appendChild(card);

    view.addEventListener('click', ()=> loadServiceHistory(v.vehicle_id));
    edit.addEventListener('click', ()=> openVehicleModal('Edit Vehicle', v, async (payload)=>{
      await api('/api/vehicles/'+v.vehicle_id, { method:'PUT', body: payload });
      notify('Vehicle updated','success');
      await loadVehicles();
    }));
    addService.addEventListener('click', ()=> openServiceModal(v.vehicle_id));
    del.addEventListener('click', async ()=>{
      if(!confirm('Delete this vehicle?')) return; // Confirm dialog needed, acceptable
      try{ await api('/api/vehicles/'+v.vehicle_id, { method:'DELETE' }); notify('Vehicle deleted','success'); await loadVehicles(); $('#service-history').innerHTML=''; }catch(e){ notify(e.message,'error'); }
    });
  });
}

async function loadServiceHistory(vehicleId){
  const list = await api('/api/services/vehicle/'+vehicleId);
  const root = $('#service-history'); root.innerHTML='';
  if(!list.length){ const em=document.createElement('div'); em.textContent='No records'; root.appendChild(em); return; }
  list.forEach(s=>{
    const row = document.createElement('div'); row.className='vehicle-card';
    const d1 = document.createElement('div'); d1.textContent = new Date(s.service_date).toDateString();
    const d2 = document.createElement('div'); d2.textContent = s.description;
    const d3 = document.createElement('div'); d3.textContent = 'Status: ' + s.status;
    row.appendChild(d1); row.appendChild(d2); row.appendChild(d3);
    root.appendChild(row);
  });
}

function openVehicleModal(titleText, vehicle, onSubmit){
  const root = $('#modal-root'); root.classList.remove('hidden'); root.innerHTML='';
  const modal = document.createElement('div'); modal.className='modal';
  const header = document.createElement('div'); header.className='modal-header';
  const title = document.createElement('div'); title.textContent = titleText;
  const close = document.createElement('button'); close.className='ghost'; close.textContent='Close';
  header.appendChild(title); header.appendChild(close);
  const body = document.createElement('div');
  const type = buildInput('Type', vehicle?.vehicle_type||'');
  const license = buildInput('License No', vehicle?.license_no||'');
  const year = buildInput('Year', vehicle?.year||'');
  const brand = buildInput('Brand', vehicle?.brand||'');
  const model = buildInput('Model', vehicle?.model||'');
  [type.wrapper, license.wrapper, year.wrapper, brand.wrapper, model.wrapper].forEach(el=> body.appendChild(el));
  const actions = document.createElement('div'); actions.className='modal-actions';
  const save = document.createElement('button'); save.textContent='Save';
  actions.appendChild(save);
  modal.appendChild(header); modal.appendChild(body); modal.appendChild(actions);
  root.appendChild(modal);

  const hide = ()=>{ root.classList.add('hidden'); root.innerHTML=''; };
  close.addEventListener('click', hide);
  root.addEventListener('click', (e)=>{ if(e.target===root) hide(); });
  save.addEventListener('click', async ()=>{
    const payload = { vehicle_type: type.input.value.trim(), license_no: license.input.value.trim(), year: Number(year.input.value)||null, brand: brand.input.value.trim(), model: model.input.value.trim() };
    if(!payload.license_no) { notify('License No is required','error'); return; }
    try{ await onSubmit(payload); hide(); }catch(e){ notify(e.message,'error'); }
  });
}

function openServiceModal(vehicleId){
  const root = $('#modal-root'); root.classList.remove('hidden'); root.innerHTML='';
  const modal = document.createElement('div'); modal.className='modal';
  const header = document.createElement('div'); header.className='modal-header';
  const title = document.createElement('div'); title.textContent = 'Add Service Record';
  const close = document.createElement('button'); close.className='ghost'; close.textContent='Close';
  header.appendChild(title); header.appendChild(close);
  const body = document.createElement('div');
  const dateWrap = buildInput('Service Date (YYYY-MM-DD)', '');
  const descWrap = document.createElement('div'); const dl = document.createElement('label'); dl.textContent='Description'; const dt = document.createElement('textarea'); descWrap.appendChild(dl); descWrap.appendChild(dt);
  const statusWrap = buildInput('Status', 'Scheduled');
  body.appendChild(dateWrap.wrapper); body.appendChild(descWrap); body.appendChild(statusWrap.wrapper);
  const actions = document.createElement('div'); actions.className='modal-actions'; const save = document.createElement('button'); save.textContent='Save'; actions.appendChild(save);
  modal.appendChild(header); modal.appendChild(body); modal.appendChild(actions); root.appendChild(modal);
  const hide = ()=>{ root.classList.add('hidden'); root.innerHTML=''; };
  close.addEventListener('click', hide); root.addEventListener('click', (e)=>{ if(e.target===root) hide(); });
  save.addEventListener('click', async ()=>{
    const payload = { service_date: dateWrap.input.value.trim(), description: dt.value.trim(), status: statusWrap.input.value.trim() };
    if(!payload.service_date || !payload.description) return notify('Provide date and description','error');
    try{ await api('/api/services/vehicle/'+vehicleId, { method:'POST', body: payload }); notify('Service added','success'); hide(); await loadServiceHistory(vehicleId); }catch(e){ notify(e.message,'error'); }
  });
}

async function setupDashboard(){
  if(!(await ensureAuth())) return;
  $('#logout-btn')?.addEventListener('click', ()=>{ clearToken(); location.replace('/'); });
  $('#add-vehicle-btn')?.addEventListener('click', ()=> openVehicleModal('Add Vehicle', null, async (payload)=>{
    const created = await api('/api/vehicles', { method:'POST', body: payload });
    notify('Vehicle added','success');
    await loadVehicles();
    // prompt to add service
    const addFirst = confirm('Add a service record now?');
    if(addFirst) openServiceModal(created.vehicle_id);
  }));
  await loadProfile();
  await loadVehicles();
}

// Entry
document.addEventListener('DOMContentLoaded', ()=>{
  if (location.pathname.endsWith('/dashboard.html')) {
    setupDashboard();
  } else {
    setupAuthPage();
  }
});


