import { useState, useEffect } from 'react';
import { 
  Save, Mail, MessageSquare, Building2, User, Key, 
  Loader2, Check, AlertCircle, Eye, EyeOff, Send, Phone
} from 'lucide-react';
import api from '../api/axios';
import clsx from 'clsx';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSecrets, setShowSecrets] = useState({});
  const [configStatus, setConfigStatus] = useState({ smsConfigured: false, mailConfigured: false, bulksmsTokenId: '', bulksmsTokenSecret: '' });
  const [testPhone, setTestPhone] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const [companySettings, setCompanySettings] = useState({
    name: '',
    website: '',
    industry: '',
    logoUrl: '',
    primaryColor: '#4a4de6',
    secondaryColor: '#ff6b6b',
  });

  const [mailSettings, setMailSettings] = useState({
    provider: 'mailgun',
    mailgunApiKey: '',
    mailgunDomain: '',
    mailgunFromEmail: '',
    mailgunFromName: '',
  });

  const [smsSettings, setSmsSettings] = useState({
    provider: 'bulksms',
    bulksmsTokenId: '',
    bulksmsTokenSecret: '',
    bulksmsFromNumber: '',
  });

  useEffect(() => {
    loadSettings();
    loadConfigStatus();
  }, []);

  const loadSettings = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.company) {
        setCompanySettings({
          name: user.company.name || '',
          website: user.company.website || '',
          industry: user.company.industry || '',
          logoUrl: user.company.logoUrl || '',
          primaryColor: user.company.primaryColor || '#4a4de6',
          secondaryColor: user.company.secondaryColor || '#ff6b6b',
        });
      }
      // Set test email from user
      if (user.email) {
        setTestEmail(user.email);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const loadConfigStatus = async () => {
    try {
      const response = await api.get('/settings/status');
      setConfigStatus(response.data);
    } catch (err) {
      console.error('Error loading config status:', err);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone) {
      setMessage({ type: 'error', text: 'Ingresa un número de teléfono' });
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      const response = await api.post('/settings/test-sms', { phone: testPhone });
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error enviando SMS de prueba' });
    } finally {
      setTesting(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setMessage({ type: 'error', text: 'Ingresa un email' });
      return;
    }
    setTesting(true);
    setMessage(null);
    try {
      const response = await api.post('/settings/test-email', { email: testEmail });
      setMessage({ type: 'success', text: response.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error enviando email de prueba' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (section) => {
    setSaving(true);
    setMessage(null);
    
    try {
      let endpoint = '';
      let data = {};
      
      switch (section) {
        case 'company':
          endpoint = '/settings/company';
          data = companySettings;
          break;
        case 'mail':
          endpoint = '/settings/mail';
          data = mailSettings;
          break;
        case 'sms':
          endpoint = '/settings/sms';
          data = smsSettings;
          break;
      }
      
      await api.put(endpoint, data);
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSecret = (field) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const tabs = [
    { id: 'company', label: 'Compañía', icon: Building2 },
    { id: 'mail', label: 'Email (Mailgun)', icon: Mail },
    { id: 'sms', label: 'SMS (BulkGate)', icon: MessageSquare },
  ];

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">Configuración</h1>
        <p className="text-white/60">Configura tu cuenta y proveedores de envío</p>
      </div>

      {message && (
        <div className={clsx(
          'mb-6 p-4 rounded-xl flex items-center gap-3',
          message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        )}>
          {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Company Settings */}
      {activeTab === 'company' && (
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" />
            Información de la Compañía
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre de la compañía</label>
              <input
                type="text"
                value={companySettings.name}
                onChange={(e) => setCompanySettings({ ...companySettings, name: e.target.value })}
                className="input"
                placeholder="Mi Empresa S.A."
              />
            </div>
            <div>
              <label className="label">Sitio web</label>
              <input
                type="url"
                value={companySettings.website}
                onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                className="input"
                placeholder="https://miempresa.com"
              />
            </div>
            <div>
              <label className="label">Industria</label>
              <select
                value={companySettings.industry}
                onChange={(e) => setCompanySettings({ ...companySettings, industry: e.target.value })}
                className="input"
              >
                <option value="">Seleccionar...</option>
                <option value="technology">Tecnología</option>
                <option value="retail">Retail / Comercio</option>
                <option value="healthcare">Salud</option>
                <option value="finance">Finanzas</option>
                <option value="education">Educación</option>
                <option value="hospitality">Hotelería / Turismo</option>
                <option value="manufacturing">Manufactura</option>
                <option value="services">Servicios</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="label">URL del Logo</label>
              <input
                type="url"
                value={companySettings.logoUrl}
                onChange={(e) => setCompanySettings({ ...companySettings, logoUrl: e.target.value })}
                className="input"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="label">Color primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={companySettings.primaryColor}
                  onChange={(e) => setCompanySettings({ ...companySettings, primaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={companySettings.primaryColor}
                  onChange={(e) => setCompanySettings({ ...companySettings, primaryColor: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>
            <div>
              <label className="label">Color secundario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={companySettings.secondaryColor}
                  onChange={(e) => setCompanySettings({ ...companySettings, secondaryColor: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={companySettings.secondaryColor}
                  onChange={(e) => setCompanySettings({ ...companySettings, secondaryColor: e.target.value })}
                  className="input flex-1"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSave('company')}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </div>
      )}

      {/* Mail Settings */}
      {activeTab === 'mail' && (
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-400" />
            Configuración de Mailgun
          </h2>
          
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <p className="text-blue-300 text-sm">
              Mailgun es el proveedor de email para enviar encuestas. 
              Obtén tus credenciales en{' '}
              <a 
                href="https://app.mailgun.com/app/sending/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-blue-200"
              >
                app.mailgun.com
              </a>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">API Key</label>
              <div className="relative">
                <input
                  type={showSecrets.mailgunApiKey ? 'text' : 'password'}
                  value={mailSettings.mailgunApiKey}
                  onChange={(e) => setMailSettings({ ...mailSettings, mailgunApiKey: e.target.value })}
                  className="input pr-10"
                  placeholder="key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('mailgunApiKey')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showSecrets.mailgunApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Dominio</label>
              <input
                type="text"
                value={mailSettings.mailgunDomain}
                onChange={(e) => setMailSettings({ ...mailSettings, mailgunDomain: e.target.value })}
                className="input"
                placeholder="mg.tudominio.com"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Email remitente</label>
                <input
                  type="email"
                  value={mailSettings.mailgunFromEmail}
                  onChange={(e) => setMailSettings({ ...mailSettings, mailgunFromEmail: e.target.value })}
                  className="input"
                  placeholder="encuestas@tudominio.com"
                />
              </div>
              <div>
                <label className="label">Nombre remitente</label>
                <input
                  type="text"
                  value={mailSettings.mailgunFromName}
                  onChange={(e) => setMailSettings({ ...mailSettings, mailgunFromName: e.target.value })}
                  className="input"
                  placeholder="Mi Empresa"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSave('mail')}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar configuración
          </button>

          {/* Test Email Section */}
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-md font-medium text-white mb-3 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Probar envío de Email
            </h3>
            <div className="flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="input flex-1"
                placeholder="tu@email.com"
              />
              <button
                onClick={handleTestEmail}
                disabled={testing || !testEmail}
                className="btn-secondary flex items-center gap-2"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Enviar prueba
              </button>
            </div>
            {!configStatus.mailConfigured && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm">
                  ⚠️ Email no configurado. Configura las credenciales de Mailgun en el archivo application.properties o en variables de entorno.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SMS Settings */}
      {activeTab === 'sms' && (
        <div className="card space-y-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-400" />
            Configuración de BulkGate
          </h2>
          
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
            <p className="text-green-300 text-sm">
              BulkGate es el proveedor de SMS para enviar encuestas. 
              Obtén tus credenciales en{' '}
              <a 
                href="https://portal.bulkgate.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-green-200"
              >
                portal.bulkgate.com
              </a>
              {' '}→ Modules & APIs
            </p>
          </div>

          {/* Current credentials from backend */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
            <p className="text-purple-300 text-sm font-semibold mb-2">🔧 Credenciales actuales en el backend (BulkGate):</p>
            <div className="font-mono text-xs space-y-1">
              <p className="text-white/80">Application ID: <span className="text-yellow-300">{configStatus.bulksmsTokenId || 'No configurado'}</span></p>
              <p className="text-white/80">Application Token: <span className="text-yellow-300 break-all">{configStatus.bulksmsTokenSecret || 'No configurado'}</span></p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Application ID</label>
              <input
                type="text"
                value={smsSettings.bulksmsTokenId}
                onChange={(e) => setSmsSettings({ ...smsSettings, bulksmsTokenId: e.target.value })}
                className="input"
                placeholder="tu-application-id"
              />
            </div>
            <div>
              <label className="label">Application Token</label>
              <div className="relative">
                <input
                  type={showSecrets.bulksmsTokenSecret ? 'text' : 'password'}
                  value={smsSettings.bulksmsTokenSecret}
                  onChange={(e) => setSmsSettings({ ...smsSettings, bulksmsTokenSecret: e.target.value })}
                  className="input pr-10"
                  placeholder="tu-application-token"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('bulksmsTokenSecret')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showSecrets.bulksmsTokenSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Número remitente (opcional)</label>
              <input
                type="text"
                value={smsSettings.bulksmsFromNumber}
                onChange={(e) => setSmsSettings({ ...smsSettings, bulksmsFromNumber: e.target.value })}
                className="input"
                placeholder="+1234567890"
              />
              <p className="text-xs text-white/40 mt-1">
                Dejar vacío para usar el número por defecto de BulkGate
              </p>
            </div>
          </div>

          <button
            onClick={() => handleSave('sms')}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar configuración
          </button>

          {/* Test SMS Section */}
          <div className="pt-6 border-t border-white/10">
            <h3 className="text-md font-medium text-white mb-3 flex items-center gap-2">
              <Send className="w-4 h-4" />
              Probar envío de SMS
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="tel"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="input"
                  placeholder="+54 11 1234 5678"
                />
                <p className="text-xs text-white/40 mt-1">
                  Formato internacional con código de país (ej: +54...)
                </p>
              </div>
              <button
                onClick={handleTestSms}
                disabled={testing || !testPhone}
                className="btn-secondary flex items-center gap-2 h-fit"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                Enviar prueba
              </button>
            </div>
            {!configStatus.smsConfigured && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-yellow-300 text-sm">
                  ⚠️ SMS no configurado. Configura las credenciales de BulkGate en el archivo application.properties o en variables de entorno.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info about WhatsApp */}
      <div className="card mt-6 border border-yellow-500/30 bg-yellow-500/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-medium text-yellow-300">WhatsApp Business API</h3>
            <p className="text-sm text-white/60 mt-1">
              La integración con WhatsApp estará disponible próximamente. 
              Requiere configurar WhatsApp Business API con Meta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

