import { useState, useEffect } from 'react';
import { Plus, Search, Users, Trash2, Upload, Download, Loader2 } from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

export default function Contacts() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNewList, setShowNewList] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newContact, setNewContact] = useState({ email: '', firstName: '', lastName: '', phone: '' });

  useEffect(() => {
    fetchLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchContacts(selectedList.id);
    }
  }, [selectedList]);

  const fetchLists = async () => {
    try {
      const response = await api.get('/contacts/lists');
      setLists(response.data);
      if (response.data.length > 0 && !selectedList) {
        setSelectedList(response.data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async (listId) => {
    try {
      const response = await api.get(`/contacts/lists/${listId}/contacts`);
      setContacts(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const createList = async () => {
    if (!newListName.trim()) return;
    try {
      const response = await api.post('/contacts/lists', { name: newListName });
      setLists([...lists, response.data]);
      setSelectedList(response.data);
      setNewListName('');
      setShowNewList(false);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteList = async (listId) => {
    if (!confirm('¿Eliminar esta lista y todos sus contactos?')) return;
    try {
      await api.delete(`/contacts/lists/${listId}`);
      setLists(lists.filter(l => l.id !== listId));
      if (selectedList?.id === listId) {
        setSelectedList(lists[0] || null);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createContact = async () => {
    if (!selectedList || !newContact.email) return;
    try {
      const response = await api.post(`/contacts/lists/${selectedList.id}/contacts`, newContact);
      setContacts([...contacts, response.data]);
      setNewContact({ email: '', firstName: '', lastName: '', phone: '' });
      setShowNewContact(false);
      // Update list count
      setLists(lists.map(l => 
        l.id === selectedList.id ? { ...l, contactCount: l.contactCount + 1 } : l
      ));
    } catch (error) {
      alert(error.response?.data?.message || 'Error al crear contacto');
    }
  };

  const deleteContact = async (contactId) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    try {
      await api.delete(`/contacts/${contactId}`);
      setContacts(contacts.filter(c => c.id !== contactId));
      setLists(lists.map(l => 
        l.id === selectedList.id ? { ...l, contactCount: Math.max(0, l.contactCount - 1) } : l
      ));
    } catch (error) {
      console.error(error);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.firstName?.toLowerCase().includes(search.toLowerCase()) ||
    c.lastName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Contactos</h1>
          <p className="text-white/60">Gestiona tus listas de contactos</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Lists sidebar */}
        <div className="card lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white">Listas</h3>
            <button 
              onClick={() => setShowNewList(true)}
              className="p-1 hover:bg-white/10 rounded-lg"
            >
              <Plus className="w-5 h-5 text-primary-400" />
            </button>
          </div>

          {showNewList && (
            <div className="mb-4 p-3 rounded-lg bg-white/5">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                className="input mb-2"
                placeholder="Nombre de la lista"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={createList} className="btn-primary text-sm flex-1">Crear</button>
                <button onClick={() => setShowNewList(false)} className="btn-secondary text-sm">Cancelar</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {lists.map((list) => (
              <div
                key={list.id}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
                  selectedList?.id === list.id ? 'bg-primary-500/20 border border-primary-500/30' : 'hover:bg-white/5'
                )}
                onClick={() => setSelectedList(list)}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/50" />
                  <span className="text-white">{list.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/50">{list.contactCount}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                    className="p-1 hover:bg-red-500/20 rounded text-white/30 hover:text-red-400"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {lists.length === 0 && (
              <p className="text-center text-white/50 py-4">No hay listas</p>
            )}
          </div>
        </div>

        {/* Contacts */}
        <div className="lg:col-span-3">
          {selectedList ? (
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="font-semibold text-white">{selectedList.name}</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="input pl-10 py-2"
                      placeholder="Buscar..."
                    />
                  </div>
                  <button
                    onClick={() => setShowNewContact(true)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>
              </div>

              {showNewContact && (
                <div className="mb-4 p-4 rounded-lg bg-white/5 grid sm:grid-cols-4 gap-3">
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    className="input"
                    placeholder="Email *"
                  />
                  <input
                    type="text"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    className="input"
                    placeholder="Nombre"
                  />
                  <input
                    type="text"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    className="input"
                    placeholder="Apellido"
                  />
                  <input
                    type="tel"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    className="input"
                    placeholder="Teléfono"
                  />
                  <div className="sm:col-span-4 flex gap-2">
                    <button onClick={createContact} className="btn-primary">Guardar</button>
                    <button onClick={() => setShowNewContact(false)} className="btn-secondary">Cancelar</button>
                  </div>
                </div>
              )}

              {filteredContacts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-white/50 border-b border-white/10">
                        <th className="pb-3">Email</th>
                        <th className="pb-3">Nombre</th>
                        <th className="pb-3">Teléfono</th>
                        <th className="pb-3">Encuestas</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <tr key={contact.id} className="border-b border-white/5">
                          <td className="py-3 text-white">{contact.email}</td>
                          <td className="py-3 text-white/70">{contact.fullName || '-'}</td>
                          <td className="py-3 text-white/70">{contact.phone || '-'}</td>
                          <td className="py-3 text-white/50 text-sm">
                            {contact.surveysCompleted}/{contact.surveysReceived}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => deleteContact(contact.id)}
                              className="p-1 hover:bg-red-500/20 rounded text-white/30 hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50">
                    {search ? 'No se encontraron contactos' : 'Esta lista está vacía'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <p className="text-white/50">Selecciona o crea una lista de contactos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

