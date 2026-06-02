import { useState } from 'react';
import { uid } from '../utils/tracking.js';

function ClientModal({ client, onClose, onSave }) {
  const isNew = !client?.id;
  const [form, setForm] = useState({
    name: client?.name || '',
    email: client?.email || '',
    cnpj: client?.cnpj || '',
    phone: client?.phone || '',
    address: client?.address || '',
    notes: client?.notes || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const field = (label, key, props = {}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
      <input value={form[key]} onChange={e => set(key, e.target.value)}
        {...props}
        style={{ fontFamily: 'var(--font-sans)', fontSize: 13.5, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '8px 11px', outline: 'none', ...(props.style || {}) }}
      />
    </div>
  );

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'absolute', inset: 0, zIndex: 80, background: 'rgba(20,20,19,0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 120ms ease-out' }}>
      <div className="card" style={{ width: 'min(92vw, 520px)', boxShadow: 'var(--shadow-3)', borderRadius: 'var(--r-lg)', animation: 'popIn 140ms ease-out' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 14px', borderBottom: '1px solid var(--line-1)' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--fg-1)' }}>
            {isNew ? 'Novo cliente' : 'Editar cliente'}
          </h2>
          <button className="btn-icon" onClick={onClose}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="scroll" style={{ overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {field('Nome *', 'name', { autoFocus: true, placeholder: 'Ex: Incorporadora Vega' })}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('E-mail', 'email', { placeholder: 'contato@empresa.com.br', type: 'email' })}
            {field('Telefone', 'phone', { placeholder: '(11) 99999-9999' })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {field('CNPJ / CPF', 'cnpj', { placeholder: '00.000.000/0001-00' })}
          </div>
          {field('Endereço', 'address', { placeholder: 'Rua, número, cidade' })}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Observações</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-1)', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 'var(--r-sm)', padding: '8px 11px', outline: 'none', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--line-1)' }}>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!form.name.trim()}
            onClick={() => { onSave({ id: client?.id || uid(), ...form, name: form.name.trim() }); onClose(); }}>
            {isNew ? 'Criar cliente' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientCard({ client, projectCount, onEdit, onDelete }) {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--r-md)', background: 'var(--bg-sunken)',
        display: 'grid', placeItems: 'center', flex: 'none',
        fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--fg-2)',
      }}>
        {client.name.slice(0, 2).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-1)' }}>{client.name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--fg-3)', marginTop: 2 }}>
          {[client.email, client.cnpj, client.phone].filter(Boolean).join(' · ') || 'Sem contato'}
        </div>
      </div>
      {projectCount > 0 && (
        <span style={{ fontSize: 11.5, color: 'var(--fg-3)', flex: 'none' }}>
          {projectCount} {projectCount === 1 ? 'projeto' : 'projetos'}
        </span>
      )}
      <button className="btn btn-ghost btn-sm" onClick={onEdit} style={{ flex: 'none' }}>Editar</button>
      <button className="btn-icon" onClick={onDelete} title="Excluir" style={{ flex: 'none', color: 'var(--obj-danger)', opacity: 0.6 }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.6}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  );
}

export function Clients({ clients, setClients, projects }) {
  const [modal, setModal] = useState(null); // null | 'new' | client obj

  const save = (client) => {
    setClients(cs => {
      const idx = cs.findIndex(c => c.id === client.id);
      return idx >= 0 ? cs.map(c => c.id === client.id ? client : c) : [...cs, client];
    });
  };

  const del = (id) => {
    if (!window.confirm('Excluir este cliente?')) return;
    setClients(cs => cs.filter(c => c.id !== id));
  };

  const projectCount = (clientId) => projects.filter(p => p.clientId === clientId).length;

  return (
    <div className="scroll" style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <div className="screen-inner" style={{ maxWidth: 680, margin: '0 auto', padding: '24px 26px 56px' }}>
        <div className="eyebrow">Cadastro</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 className="disp" style={{ fontSize: 40, margin: '4px 0 0' }}>Clientes</h1>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>+ Novo cliente</button>
        </div>

        {clients.length === 0 ? (
          <div className="card" style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🏢</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--fg-2)', marginBottom: 6 }}>Nenhum cliente ainda</div>
            <div style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 20 }}>
              Cadastre clientes para associar a projetos e gerar relatórios por cliente.
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('new')}>+ Criar primeiro cliente</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clients.map(c => (
              <ClientCard
                key={c.id} client={c}
                projectCount={projectCount(c.id)}
                onEdit={() => setModal(c)}
                onDelete={() => del(c.id)}
              />
            ))}
          </div>
        )}
      </div>

      {modal && (
        <ClientModal
          client={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={save}
        />
      )}
    </div>
  );
}
