import React, { useState, useEffect } from 'react';
import { 
  User, 
  Sprout, 
  MapPin, 
  Scale, 
  IndianRupee, 
  Check, 
  X, 
  MessageCircle, 
  Send, 
  Sparkles, 
  ShoppingBag, 
  ListFilter,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  TrendingUp,
  BarChart2,
  Settings,
  Bell,
  ChevronRight,
  Trash2,
  Edit
} from 'lucide-react';

export default function App() {
  // Demo State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // App views: 'farmer', 'buyer', 'marketplace'
  const [activeTab, setActiveTab] = useState('farmer'); 
  
  // Data State
  const [myCrops, setMyCrops] = useState([]);
  const [marketplaceCrops, setMarketplaceCrops] = useState([]);
  const [myRequirements, setMyRequirements] = useState([]);
  const [allRequirements, setAllRequirements] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [cropMatches, setCropMatches] = useState([]);
  const [requirementMatches, setRequirementMatches] = useState([]);
  const [cropOffers, setCropOffers] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [marketPrices, setMarketPrices] = useState({});
  const [isEditingCrop, setIsEditingCrop] = useState(false);
  const [editCropForm, setEditCropForm] = useState(null);
  
  // Form States
  const [cropForm, setCropForm] = useState({
    crop_name: 'Tomato',
    variety: 'Local Hybrid',
    quantity: '5',
    unit: 'tons',
    expected_price: '20',
    location: 'Nashik',
    description: 'Fresh quality harvest, ready for immediate loading.'
  });
  
  const [reqForm, setReqForm] = useState({
    crop_name: 'Tomato',
    required_quantity: '10000',
    unit: 'kg',
    preferred_location: 'Nashik',
    max_price: '25',
    max_distance_km: '150'
  });

  const [registerForm, setRegisterForm] = useState({
    name: '',
    phone: '',
    role: 'FARMER',
    location: '',
    password: 'password123'
  });

  const [showRegister, setShowRegister] = useState(false);
  
  // Negotiation States
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsgText, setNewMsgText] = useState('');
  const [counterPriceInput, setCounterPriceInput] = useState('');

  // Offer Modal State
  const [activeOfferTarget, setActiveOfferTarget] = useState(null);
  const [offerForm, setOfferForm] = useState({
    offered_price_per_unit: '',
    quantity: '',
    message: ''
  });

  // Fetch helper with User Auth Header
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (currentUser) {
      headers['X-User-Id'] = currentUser.id.toString();
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'API request failed');
    }
    return response.json();
  };

  // Initial Boot
  useEffect(() => {
    loadUsers();
    loadMarketPrices();
  }, []);

  // Reload data when User changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'FARMER') {
        setActiveTab('farmer');
        loadFarmerData();
      } else {
        setActiveTab('buyer');
        loadBuyerData();
      }
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const data = await apiFetch('/api/users');
      setUsers(data);
      if (data.length > 0 && !currentUser) {
        // Log in Rajesh by default if seeded
        const rajesh = data.find(u => u.phone === '9876543210') || data[0];
        setCurrentUser(rajesh);
      }
    } catch (e) {
      console.error("Error loading users:", e);
    }
  };

  const loadMarketPrices = async () => {
    try {
      const data = await apiFetch('/api/market-prices');
      setMarketPrices(data);
    } catch (e) {
      console.error("Error loading market prices:", e);
    }
  };

  const loadFarmerData = async () => {
    try {
      const crops = await apiFetch('/api/crops/my');
      setMyCrops(crops);
      const received = await apiFetch('/api/offers/my');
      setMyOffers(received);
      const reqs = await apiFetch('/api/requirements');
      setAllRequirements(reqs);
      
      // Auto-select first crop if none selected
      if (crops.length > 0 && !selectedCrop) {
        handleSelectCrop(crops[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadBuyerData = async () => {
    try {
      const reqs = await apiFetch('/api/requirements/my');
      setMyRequirements(reqs);
      const marketplace = await apiFetch('/api/crops');
      setMarketplaceCrops(marketplace);
      const sent = await apiFetch('/api/offers/my');
      setMyOffers(sent);
      
      // Auto-select first requirement if none selected
      if (reqs.length > 0 && !selectedRequirement) {
        handleSelectRequirement(reqs[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectCrop = async (crop) => {
    setSelectedCrop(crop);
    try {
      const matches = await apiFetch(`/api/crops/${crop.id}/matches`);
      setCropMatches(matches);
      const offers = await apiFetch(`/api/crops/${crop.id}/offers`);
      setCropOffers(offers);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectRequirement = async (req) => {
    setSelectedRequirement(req);
    try {
      const matches = await apiFetch(`/api/requirements/${req.id}/matches`);
      setRequirementMatches(matches);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditCropSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await apiFetch(`/api/crops/${selectedCrop.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          crop_name: editCropForm.crop_name,
          variety: editCropForm.variety || null,
          quantity: parseFloat(editCropForm.quantity),
          unit: editCropForm.unit,
          expected_price: parseFloat(editCropForm.expected_price),
          location: editCropForm.location,
          description: editCropForm.description || null
        })
      });
      setIsEditingCrop(false);
      setEditCropForm(null);
      await loadFarmerData();
      handleSelectCrop(updated);
      alert("Crop listing updated successfully!");
    } catch (err) {
      alert("Update failed: " + err.message);
    }
  };

  const handleDeleteCrop = async (cropId) => {
    if (!confirm("Are you sure you want to delete this crop listing?")) return;
    try {
      await apiFetch(`/api/crops/${cropId}`, {
        method: 'DELETE'
      });
      setSelectedCrop(null);
      setCropMatches([]);
      setCropOffers([]);
      await loadFarmerData();
      alert("Listing deleted successfully!");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleSelectOffer = async (offer) => {
    setSelectedOffer(offer);
    setCounterPriceInput(offer.offered_price_per_unit.toString());
    try {
      const thread = await apiFetch(`/api/offers/${offer.id}/messages`);
      setChatMessages(thread);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefresh = () => {
    loadMarketPrices();
    if (currentUser) {
      if (currentUser.role === 'FARMER') {
        loadFarmerData();
        if (selectedCrop) handleSelectCrop(selectedCrop);
      } else {
        loadBuyerData();
        if (selectedRequirement) handleSelectRequirement(selectedRequirement);
      }
      if (selectedOffer) handleSelectOffer(selectedOffer);
    }
  };

  // Auth Operations
  const handleUserSwitch = (userId) => {
    const user = users.find(u => u.id === parseInt(userId));
    if (user) {
      setCurrentUser(user);
      setSelectedCrop(null);
      setSelectedRequirement(null);
      setSelectedOffer(null);
      setCropMatches([]);
      setRequirementMatches([]);
      setCropOffers([]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const newUser = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm)
      });
      setShowRegister(false);
      setRegisterForm({ name: '', phone: '', role: 'FARMER', location: '', password: 'password123' });
      await loadUsers();
      setCurrentUser(newUser);
    } catch (err) {
      alert("Registration failed: " + err.message);
    }
  };

  // Farmer Actions
  const handleUploadCrop = async (e) => {
    e.preventDefault();
    try {
      const created = await apiFetch('/api/crops', {
        method: 'POST',
        body: JSON.stringify({
          crop_name: cropForm.crop_name,
          variety: cropForm.variety || null,
          quantity: parseFloat(cropForm.quantity),
          unit: cropForm.unit,
          expected_price: parseFloat(cropForm.expected_price),
          location: cropForm.location,
          description: cropForm.description || null
        })
      });
      await loadFarmerData();
      handleSelectCrop(created);
      alert("Crop uploaded successfully!");
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  };

  // Buyer Actions
  const handleAddRequirement = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/api/requirements', {
        method: 'POST',
        body: JSON.stringify({
          crop_name: reqForm.crop_name,
          required_quantity: parseFloat(reqForm.required_quantity),
          unit: reqForm.unit,
          preferred_location: reqForm.preferred_location,
          max_price: parseFloat(reqForm.max_price),
          max_distance_km: parseFloat(reqForm.max_distance_km)
        })
      });
      setReqForm({
        crop_name: 'Tomato',
        required_quantity: '10000',
        unit: 'kg',
        preferred_location: 'Nashik',
        max_price: '25',
        max_distance_km: '150'
      });
      loadBuyerData();
      alert("Requirement added successfully!");
    } catch (err) {
      alert("Failed to add requirement: " + err.message);
    }
  };

  const handleOpenOfferModal = (crop) => {
    setActiveOfferTarget(crop);
    setOfferForm({
      offered_price_per_unit: crop.expected_price.toString(),
      quantity: crop.quantity.toString(),
      message: 'I am interested in buying your harvest.'
    });
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/crops/${activeOfferTarget.id}/offers`, {
        method: 'POST',
        body: JSON.stringify({
          offered_price_per_unit: parseFloat(offerForm.offered_price_per_unit),
          quantity: parseFloat(offerForm.quantity),
          message: offerForm.message
        })
      });
      setActiveOfferTarget(null);
      loadBuyerData();
      alert("Offer submitted successfully!");
    } catch (err) {
      alert("Failed to submit offer: " + err.message);
    }
  };

  // Negotiation Actions
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMsgText.trim()) return;
    try {
      const msg = await apiFetch(`/api/offers/${selectedOffer.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message_text: newMsgText })
      });
      setChatMessages([...chatMessages, msg]);
      setNewMsgText('');
    } catch (err) {
      alert("Failed to send message: " + err.message);
    }
  };

  const handleRespondOffer = async (status, counterPrice = null) => {
    try {
      const updated = await apiFetch(`/api/offers/${selectedOffer.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          status: status,
          counter_price: counterPrice ? parseFloat(counterPrice) : null,
          message: status === 'countered' ? `Countered price to ₹${counterPrice}/unit.` : `Responded: ${status.toUpperCase()}.`
        })
      });
      setSelectedOffer(updated);
      handleRefresh();
      alert(`Offer ${status} successfully!`);
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  // Helper unit conversions for display reference
  const renderPriceInfo = (offer, crop) => {
    const key = crop.crop_name.toLowerCase().strip ? crop.crop_name.toLowerCase().trim() : crop.crop_name.toLowerCase();
    const referenceObj = marketPrices[key];
    const refPrice = referenceObj ? referenceObj.reference_price : 20.0;
    
    const isBelow = offer.offered_price_per_unit < refPrice;
    
    return (
      <div className="bg-slate-100 p-3 rounded-lg border text-sm space-y-2 mt-2">
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <div>Farmer Price</div>
          <div>Market Reference</div>
          <div>Buyer Offer</div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center font-bold text-base">
          <div className="text-emerald-700">₹{crop.expected_price}/{crop.unit}</div>
          <div className="text-slate-600">₹{refPrice}/kg</div>
          <div className={`${isBelow ? 'text-amber-600' : 'text-emerald-600'}`}>₹{offer.offered_price_per_unit}/{crop.unit}</div>
        </div>
        {isBelow && (
          <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-xs px-2.5 py-1.5 rounded-md mt-2 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Offer is below the market reference price</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 w-full">
      
      {/* Left Sidebar - Hidden on mobile/tablet, sticky on desktop */}
      <aside className="hidden lg:flex w-64 bg-slate-900 text-slate-200 flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-800 shadow-xl">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-2">
          <Sprout className="w-6 h-6 text-emerald-400" />
          <div>
            <h1 className="font-black text-white text-sm tracking-wider uppercase">NO MIDDLE MAN</h1>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wide">இடைத்தரகர் இல்லாதது</p>
          </div>
        </div>

        {/* Current Profile Card */}
        <div className="p-3.5 mx-3 my-4 bg-slate-800 rounded-xl border border-slate-700/50 space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-white text-xs truncate flex items-center gap-1">
                {currentUser?.name}
                {currentUser?.is_verified && (
                  <span className="text-emerald-400 text-[9px] font-bold" title="Verified Buyer">✓</span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 capitalize">{currentUser?.role.toLowerCase()}</div>
            </div>
          </div>
          
          {/* User Switcher inline */}
          <div className="pt-2 border-t border-slate-700/60">
            <label className="block text-[8px] uppercase font-bold text-slate-500 mb-1">Select Profile / பயனர் தேர்வு</label>
            <select 
              value={currentUser?.id || ''} 
              onChange={(e) => handleUserSwitch(e.target.value)}
              className="w-full bg-slate-955 text-slate-300 p-1.5 rounded-md text-[11px] outline-none border border-slate-700 cursor-pointer font-medium hover:border-slate-600 transition bg-slate-900"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {u.name} {u.is_verified ? '✓' : ''} ({u.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-3 space-y-1">
          {currentUser?.role === 'FARMER' ? (
            <>
              <button 
                onClick={() => setActiveTab('farmer')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'farmer' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4" />
                  <span>Dashboard / முகப்பு</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('upload')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'upload' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Upload Crop / பதிவேற்று</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('buyer')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'buyer' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>My Demands / என் தேவைகள்</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('marketplace')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'marketplace' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <ListFilter className="w-4 h-4" />
                  <span>Marketplace / சந்தை</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
            </>
          )}
        </nav>

        {/* Demo Register widget */}
        <div className="p-3.5 mx-3 mb-4 bg-slate-800/40 rounded-xl border border-slate-700/30 text-[11px] space-y-2">
          <div className="flex justify-between items-center text-slate-400 font-bold uppercase tracking-wider text-[9px]">
            <span>New Demo User</span>
            <button 
              onClick={() => setShowRegister(!showRegister)}
              className="text-emerald-400 hover:underline hover:text-emerald-300 font-semibold"
            >
              {showRegister ? 'Cancel' : '+ Add'}
            </button>
          </div>
          {showRegister && (
            <form onSubmit={handleRegister} className="space-y-1.5 text-slate-800">
              <input 
                type="text" 
                placeholder="Name" 
                required
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-1">
                <input 
                  type="text" 
                  placeholder="Phone" 
                  required
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                />
                <input 
                  type="text" 
                  placeholder="Location" 
                  required
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-slate-200 text-xs"
                  value={registerForm.location}
                  onChange={(e) => setRegisterForm({...registerForm, location: e.target.value})}
                />
              </div>
              <div className="flex gap-2 items-center justify-between text-slate-300 text-xs">
                <select 
                  value={registerForm.role}
                  className="px-1 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300 text-xs"
                  onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                >
                  <option value="FARMER">Farmer</option>
                  <option value="BUYER">Buyer</option>
                </select>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded font-bold transition text-xs">
                  Save
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>

      {/* Main Content Area - Full width on mobile/tablet, offset by sidebar width on desktop */}
      <div className="flex-1 pl-0 lg:pl-64 flex flex-col min-h-screen w-full">
        
        {/* Top Header */}
        <header className="bg-white border-b h-16 sticky top-0 z-20 flex items-center justify-between px-6 shadow-sm">
          <div>
            <h2 className="text-xs lg:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              {activeTab === 'farmer' && 'Farmer Dashboard / விவசாயி கட்டுப்பாட்டு அறை'}
              {activeTab === 'upload' && 'Upload Crop Listings / அறுவடை விவரம் பதிவேற்றம்'}
              {activeTab === 'buyer' && 'Buyer Demands / கொள்முதல் தேவைகள்'}
              {activeTab === 'marketplace' && 'Available Crops Marketplace / விவசாய பயிர் சந்தை'}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            {/* Mobile/Tablet user profile switcher (only when sidebar is hidden) */}
            <div className="lg:hidden flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border text-slate-700 px-2 py-1 rounded-md transition">
              <select 
                value={currentUser?.id || ''} 
                onChange={(e) => handleUserSwitch(e.target.value)}
                className="bg-transparent text-[11px] outline-none cursor-pointer font-bold"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toLowerCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative p-2 text-slate-400 hover:text-slate-600 cursor-pointer transition hover:bg-slate-50 rounded-full">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </div>

            <button 
              onClick={handleRefresh}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-700 px-3 py-1.5 rounded-lg transition"
              title="Sync data with server"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>

            <div className="flex items-center gap-2 border-l pl-4">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{currentUser?.name}</div>
                <div className="text-[10px] text-slate-400 font-medium capitalize">{currentUser?.role.toLowerCase()}</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center border border-emerald-200 shadow-xs">
                {currentUser?.name?.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile/Tablet Tab Navigation (only visible when sidebar is hidden) */}
        <div className="lg:hidden flex border-b bg-white divide-x divide-slate-100">
          {currentUser?.role === 'FARMER' ? (
            <>
              <button 
                onClick={() => setActiveTab('farmer')} 
                className={`flex-1 py-3 text-center text-xs font-bold transition ${activeTab === 'farmer' ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Dashboard / முகப்பு
              </button>
              <button 
                onClick={() => setActiveTab('upload')} 
                className={`flex-1 py-3 text-center text-xs font-bold transition ${activeTab === 'upload' ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Upload Crop / பதிவேற்று
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('buyer')} 
                className={`flex-1 py-3 text-center text-xs font-bold transition ${activeTab === 'buyer' ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                My Demands / என் தேவைகள்
              </button>
              <button 
                onClick={() => setActiveTab('marketplace')} 
                className={`flex-1 py-3 text-center text-xs font-bold transition ${activeTab === 'marketplace' ? 'border-b-2 border-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Marketplace / சந்தை
              </button>
            </>
          )}
        </div>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 space-y-6">

          {/* 1. FARMER TAB */}
          {currentUser?.role === 'FARMER' && activeTab === 'farmer' && (
            <div className="space-y-6">
              {/* Farmer Statistics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">My Harvest Listings / என் பயிர்கள்</div>
                    <div className="text-2xl font-black text-slate-800">{myCrops.length}</div>
                    <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>Active crops listed</span>
                    </div>
                  </div>
                  <div className="w-16 h-8 text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <rect x="5" y="15" width="12" height="25" fill="currentColor" opacity="0.3" rx="2" />
                      <rect x="25" y="20" width="12" height="20" fill="currentColor" opacity="0.5" rx="2" />
                      <rect x="45" y="10" width="12" height="30" fill="currentColor" opacity="0.7" rx="2" />
                      <rect x="65" y="5" width="12" height="35" fill="currentColor" opacity="0.9" rx="2" />
                      <rect x="85" y="8" width="12" height="32" fill="currentColor" opacity="1" rx="2" />
                    </svg>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Active Buyer Demands / தேவைகள்</div>
                    <div className="text-2xl font-black text-slate-800">{allRequirements.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Market procurement feeds</div>
                  </div>
                  <div className="w-16 h-8 text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path d="M5,35 Q25,15 45,25 T85,10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Offers Received / சலுகைகள்</div>
                    <div className="text-2xl font-black text-slate-800">{cropOffers.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Bids in negotiation pipeline</div>
                  </div>
                  <div className="w-16 h-8 text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <circle cx="15" cy="20" r="4" fill="currentColor" />
                      <circle cx="45" cy="15" r="4" fill="currentColor" />
                      <circle cx="75" cy="30" r="4" fill="currentColor" />
                      <path d="M15,20 L45,15 L75,30" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left Column (1/3): My Listings & Buyer Demands */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* My Crop Listings */}
                  <div className="bg-white border rounded-xl shadow-sm p-4.5">
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider border-b pb-2 mb-3">
                      My Crop Listings / என் பயிர்கள்
                    </h3>
                    {myCrops.length === 0 ? (
                      <div className="bg-slate-50 border border-dashed rounded-xl p-6 text-center text-slate-400 text-xs">
                        <p>No crops uploaded yet.</p>
                        <button 
                          onClick={() => setActiveTab('upload')} 
                          className="mt-2 text-emerald-600 font-bold hover:underline"
                        >
                          + Post harvest crop
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {myCrops.map(crop => (
                          <div 
                            key={crop.id}
                            onClick={() => handleSelectCrop(crop)}
                            className={`p-3 rounded-lg border text-left cursor-pointer transition flex justify-between items-center ${selectedCrop?.id === crop.id ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                          >
                            <div>
                              <div className="font-bold text-slate-800 text-xs">🌾 {crop.crop_name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{crop.quantity} {crop.unit} • {crop.location}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-700 font-bold text-xs">₹{crop.expected_price}/{crop.unit}</div>
                              <span className={`inline-block text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-black mt-1 ${crop.status === 'sold' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                {crop.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Procurement Feeds */}
                  <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-3">
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider border-b pb-2 mb-3">
                      Active Buyer Demands / கொள்முதல் தேவைகள்
                    </h3>
                    {allRequirements.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No requirements published yet.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                        {allRequirements.map(req => {
                          const buyerUser = users.find(u => u.id === req.buyer_id);
                          return (
                            <div key={req.id} className="border border-slate-100 rounded-lg p-2.5 text-xs flex justify-between items-center hover:bg-slate-50 bg-white shadow-xs">
                              <div>
                                <div className="font-bold text-slate-700">🍉 {req.crop_name}</div>
                                <div className="text-[10px] text-slate-500 mt-0.5">Quantity: {req.required_quantity} {req.unit} | {req.preferred_location}</div>
                                <div className="text-[9px] text-slate-400 mt-1 flex items-center">
                                  {req.buyer_id === 2 ? 'BigMart Wholesale' : (buyerUser?.name || `Buyer (ID: ${req.buyer_id})`)}
                                  {(req.buyer_id === 2 || buyerUser?.is_verified) && (
                                    <span className="text-emerald-600 font-black ml-1 text-[8px] bg-emerald-50 px-1 rounded">✓ Verified</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-slate-400 text-[8px] uppercase block">Budget</span>
                                <span className="text-emerald-700 font-bold text-xs">₹{req.max_price}/{req.unit}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (2/3): Selected Listing Smart Matches & Comparative Table */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedCrop ? (
                    <div className="space-y-6">
                      
                      {/* Active Profile Summary */}
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-5 rounded-xl shadow-xs flex justify-between items-start">
                        <div>
                          <span className="text-emerald-800 text-[9px] uppercase font-bold tracking-widest bg-emerald-100 px-2 py-0.5 rounded">
                            Selected Active Profile / நடப்பு பயிர் விவரம்
                          </span>
                          <h4 className="text-lg font-black text-slate-800 mt-2">🌾 {selectedCrop.crop_name} ({selectedCrop.variety})</h4>
                          <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5">
                            <span className="flex items-center gap-1"><Scale className="w-3.5 h-3.5 text-slate-400" /> {selectedCrop.quantity} {selectedCrop.unit}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedCrop.location}</span>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <div>
                            <span className="text-slate-400 text-[9px] uppercase font-bold block">Expected Price</span>
                            <span className="text-emerald-700 font-black text-lg">₹{selectedCrop.expected_price}/{selectedCrop.unit}</span>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditCropForm({
                                  crop_name: selectedCrop.crop_name,
                                  variety: selectedCrop.variety || '',
                                  quantity: selectedCrop.quantity.toString(),
                                  unit: selectedCrop.unit,
                                  expected_price: selectedCrop.expected_price.toString(),
                                  location: selectedCrop.location,
                                  description: selectedCrop.description || ''
                                });
                                setIsEditingCrop(true);
                              }}
                              className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold transition border"
                            >
                              Edit / திருத்து
                            </button>
                            <button
                              onClick={() => handleDeleteCrop(selectedCrop.id)}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-rose-200"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Smart Match Table Layout */}
                      <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-3">
                        <div className="flex justify-between items-center border-b pb-2 mb-2">
                          <h4 className="font-bold text-slate-700 text-lg uppercase flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                            <span>Smart Matches Discovery 🤖</span>
                          </h4>
                          <span className="text-slate-400 text-[10px] font-semibold">{cropMatches.length} matching demands found</span>
                        </div>

                        {cropMatches.length === 0 ? (
                          <p className="text-sm text-slate-400 italic p-4 text-center">No buyer requirements matched this crop. Buyers need to list requirements.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                  <th className="p-3 font-bold uppercase text-[9px]">Match %</th>
                                  <th className="p-3 font-bold uppercase text-[9px]">Buyer</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Crop Match</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Location Proximity</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Quantity Fit</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Price Fit</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cropMatches.map(match => (
                                  <tr key={match.requirement_id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-3">
                                      <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-black border border-emerald-200 shadow-xs">
                                        {match.score_details.total_score}%
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <div className="font-bold text-slate-800 flex items-center gap-1">
                                        {match.buyer_name}
                                        {match.buyer_verified && (
                                          <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 py-0.2 rounded font-bold" title="Verified Buyer">✓ Verified</span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 mt-0.5">{match.buyer_location}</div>
                                    </td>
                                    <td className="p-3 text-center">
                                      {match.score_details.crop_score > 0 ? (
                                        <span className="text-emerald-600 font-bold">✓ 40/40</span>
                                      ) : (
                                        <span className="text-rose-600 font-bold">✗ 0/40</span>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="font-semibold text-slate-700">{match.score_details.distance_km} km</div>
                                      <div className="text-[9px] text-slate-400">Score: {match.score_details.location_score}/25</div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="font-semibold text-slate-700">{match.required_quantity} {match.unit}</div>
                                      <div className="text-[9px] text-slate-400">Score: {match.score_details.quantity_score}/20</div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="font-semibold text-slate-700">max ₹{match.max_price}</div>
                                      <div className="text-[9px] text-slate-400">Score: {match.score_details.price_score}/15</div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Offers Comparison Desktop Table */}
                      <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-3">
                        <h4 className="font-bold text-slate-700 text-lg uppercase flex items-center gap-1.5 border-b pb-2 mb-2">
                          <IndianRupee className="w-4 h-4 text-emerald-600" />
                          <span>Offers received & comparison / பெறப்பட்ட சலுகைகள்</span>
                        </h4>

                        {cropOffers.length === 0 ? (
                          <p className="text-sm text-slate-400 italic p-4 text-center">No offers received yet. Buyers must send offers from the marketplace.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                              <thead>
                                <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                  <th className="p-3 font-bold uppercase text-[9px]">Buyer</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Offered Price</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Expected Price</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Market Reference</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Quantity</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-center">Status</th>
                                  <th className="p-3 font-bold uppercase text-[9px] text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {cropOffers.map(offer => {
                                  const key = selectedCrop.crop_name.toLowerCase().trim();
                                  const referenceObj = marketPrices[key];
                                  const refPrice = referenceObj ? referenceObj.reference_price : 20.0;
                                  const isBelow = offer.offered_price_per_unit < refPrice;

                                  return (
                                    <tr key={offer.id} className="hover:bg-slate-50/50 transition">
                                      <td className="p-3 font-bold text-slate-800">
                                        <div className="flex items-center gap-1">
                                          {offer.buyer.name}
                                          {offer.buyer.is_verified && (
                                            <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded font-bold">✓ Verified</span>
                                          )}
                                        </div>
                                        {offer.message && (
                                          <div className="text-[10px] text-slate-400 italic mt-0.5 truncate max-w-[150px]">"{offer.message}"</div>
                                        )}
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`font-black text-xs ${isBelow ? 'text-amber-600' : 'text-emerald-700'}`}>
                                          ₹{offer.offered_price_per_unit}/{selectedCrop.unit}
                                        </span>
                                        {isBelow && <span className="block text-[8px] text-amber-500 font-bold">Below Market</span>}
                                      </td>
                                      <td className="p-3 text-slate-500 text-center font-bold">
                                        ₹{selectedCrop.expected_price}/{selectedCrop.unit}
                                      </td>
                                      <td className="p-3 text-slate-500 text-center font-semibold">
                                        ₹{refPrice}/kg
                                      </td>
                                      <td className="p-3 text-slate-655 text-center font-semibold">
                                        {offer.quantity} {selectedCrop.unit}
                                      </td>
                                      <td className="p-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                          offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-850' : 
                                          offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                          offer.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-850'
                                        }`}>
                                          {offer.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        <button
                                          onClick={() => handleSelectOffer(offer)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-[11px] transition shadow-xs"
                                        >
                                          Negotiate / பேரம்
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white border rounded-xl p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                      <Sprout className="w-12 h-12 text-emerald-600 text-opacity-25 mb-4" />
                      <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">No Crop Selected / பயிர் தேர்ந்தெடுக்கப்படவில்லை</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Select one of your crop listings from the sidebar checklist to evaluate smart matching recommendations, compare offers, and log counter-offers.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. FARMER UPLOAD TAB */}
          {currentUser?.role === 'FARMER' && activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto bg-white border rounded-xl shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2.5 flex items-center gap-1.5">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <span>Upload New Harvest Details / புதிய அறுவடை விவரம் பதிவேற்று</span>
              </h3>
              
              <form onSubmit={handleUploadCrop} className="space-y-4 text-slate-700 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Crop Name / பயிர் பெயர்</label>
                    <select 
                      className="w-full p-2.5 border rounded-lg bg-slate-50 font-semibold text-xs"
                      value={cropForm.crop_name}
                      onChange={(e) => setCropForm({...cropForm, crop_name: e.target.value})}
                    >
                      <option value="Tomato">🍅 Tomato / தக்காளி</option>
                      <option value="Potato">🥔 Potato / உருளைக்கிழங்கு</option>
                      <option value="Onion">🧅 Onion / வெங்காயம்</option>
                      <option value="Rice">🌾 Rice / நெல்</option>
                      <option value="Wheat">🌾 Wheat / கோதுமை</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Variety / ரகம்</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Local Hybrid, Premium"
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={cropForm.variety}
                      onChange={(e) => setCropForm({...cropForm, variety: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Quantity / அளவு</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={cropForm.quantity}
                      onChange={(e) => setCropForm({...cropForm, quantity: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Unit / அலகு</label>
                    <select 
                      className="w-full p-2.5 border rounded-lg bg-slate-50 text-xs font-semibold"
                      value={cropForm.unit}
                      onChange={(e) => setCropForm({...cropForm, unit: e.target.value})}
                    >
                      <option value="tons">Tons / டன்கள்</option>
                      <option value="kg">kg / கிலோகிராம்</option>
                      <option value="bags">Bags / மூடைகள்</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">Expected Price (₹/unit) / விலை</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full p-2.5 border rounded-lg text-xs"
                      value={cropForm.expected_price}
                      onChange={(e) => setCropForm({...cropForm, expected_price: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Harvest Location / அறுவடை இடம்</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Nashik, Maharashtra"
                    className="w-full p-2.5 border rounded-lg text-xs"
                    value={cropForm.location}
                    onChange={(e) => setCropForm({...cropForm, location: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">Additional Details / கூடுதல் விவரங்கள்</label>
                  <textarea 
                    rows="3" 
                    placeholder="Notes on harvesting date, logistics support details, packaging, etc." 
                    className="w-full p-2.5 border rounded-lg text-xs"
                    value={cropForm.description}
                    onChange={(e) => setCropForm({...cropForm, description: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm text-xs uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Harvest Listing / அறுவடை விவரத்தைப் பதிவேற்று</span>
                </button>
              </form>
            </div>
          )}

          {/* 3. BUYER TAB */}
          {currentUser?.role === 'BUYER' && activeTab === 'buyer' && (
            <div className="space-y-6">
              
              {/* Buyer Overview Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">My Active Demands / தேவைகள்</div>
                    <div className="text-2xl font-black text-slate-800">{myRequirements.length}</div>
                    <div className="text-[10px] text-emerald-600 font-bold">Listed crop requirements</div>
                  </div>
                  <div className="w-16 h-8 text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <rect x="5" y="10" width="12" height="30" fill="currentColor" opacity="0.3" rx="2" />
                      <rect x="25" y="15" width="12" height="25" fill="currentColor" opacity="0.5" rx="2" />
                      <rect x="45" y="5" width="12" height="35" fill="currentColor" opacity="0.7" rx="2" />
                      <rect x="65" y="20" width="12" height="20" fill="currentColor" opacity="0.9" rx="2" />
                      <rect x="85" y="12" width="12" height="28" fill="currentColor" opacity="1" rx="2" />
                    </svg>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Matching Suppliers / விவசாயிகள்</div>
                    <div className="text-2xl font-black text-slate-800">{requirementMatches.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Farmers found in match range</div>
                  </div>
                  <div className="w-16 h-8 text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <circle cx="20" cy="20" r="6" fill="none" stroke="currentColor" strokeWidth="3" />
                      <line x1="26" y1="26" x2="38" y2="38" stroke="currentColor" strokeWidth="3" />
                    </svg>
                  </div>
                </div>

                <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Offers Sent / சலுகைகள்</div>
                    <div className="text-2xl font-black text-slate-800">{myOffers.length}</div>
                    <div className="text-[10px] text-slate-500 font-medium">Bids in negotiation logs</div>
                  </div>
                  <div className="w-16 h-8 text-emerald-500">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path d="M5,10 Q25,35 45,15 T85,30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Grid split */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* Left Column (1/3): Form and Demands list */}
                <div className="lg:col-span-1 space-y-6">
                  
                  {/* Post Form */}
                  <div className="bg-white border rounded-xl p-4.5 shadow-sm space-y-3">
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 mb-3">
                      <ShoppingBag className="w-4 h-4 text-emerald-600" />
                      <span>Define Crop Requirement</span>
                    </h3>
                    
                    <form onSubmit={handleAddRequirement} className="space-y-3 text-slate-700 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Crop</label>
                          <select 
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-semibold"
                            value={reqForm.crop_name}
                            onChange={(e) => setReqForm({...reqForm, crop_name: e.target.value})}
                          >
                            <option value="Tomato">🍅 Tomato</option>
                            <option value="Potato">🥔 Potato</option>
                            <option value="Onion">🧅 Onion</option>
                            <option value="Rice">🌾 Rice</option>
                            <option value="Wheat">🌾 Wheat</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Region</label>
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. Nashik, Pune"
                            className="w-full p-2 border rounded-lg text-xs"
                            value={reqForm.preferred_location}
                            onChange={(e) => setReqForm({...reqForm, preferred_location: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Qty</label>
                          <input 
                            type="number" 
                            required
                            min="1"
                            className="w-full p-2 border rounded-lg text-xs"
                            value={reqForm.required_quantity}
                            onChange={(e) => setReqForm({...reqForm, required_quantity: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Unit</label>
                          <select 
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-semibold"
                            value={reqForm.unit}
                            onChange={(e) => setReqForm({...reqForm, unit: e.target.value})}
                          >
                            <option value="kg">kg</option>
                            <option value="tons">Tons</option>
                            <option value="bags">Bags</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Max Dist</label>
                          <input 
                            type="number" 
                            required
                            className="w-full p-2 border rounded-lg text-xs"
                            value={reqForm.max_distance_km}
                            onChange={(e) => setReqForm({...reqForm, max_distance_km: e.target.value})}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Max Price Budget (₹/unit)</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          className="w-full p-2 border rounded-lg text-xs"
                          value={reqForm.max_price}
                          onChange={(e) => setReqForm({...reqForm, max_price: e.target.value})}
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs"
                      >
                        Save Demand Profile
                      </button>
                    </form>
                  </div>

                  {/* My active demands list */}
                  <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-2">
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider border-b pb-2 mb-3">
                      My Active Demands / என் தேவைகள்
                    </h3>
                    {myRequirements.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No demands listed yet.</p>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {myRequirements.map(req => (
                          <div 
                            key={req.id} 
                            onClick={() => handleSelectRequirement(req)}
                            className={`bg-white border rounded-lg p-3 text-xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition shadow-xs ${selectedRequirement?.id === req.id ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500' : 'border-slate-200'}`}
                          >
                            <div>
                              <div className="font-bold text-slate-800 text-xs">🌾 {req.crop_name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Qty: {req.required_quantity} {req.unit} | Max: {req.max_distance_km} km
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-slate-400 text-[8px] uppercase">Budget</div>
                              <div className="text-emerald-700 font-bold text-xs">₹{req.max_price}/{req.unit}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column (2/3): Suppliers and Sent Offers */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Matching suppliers list */}
                  {selectedRequirement ? (
                    <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-3">
                      <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <h3 className="font-bold text-slate-700 text-lg uppercase flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                          <span>Find Suppliers / உற்பத்தியாளர்கள் கண்டறிதல் 🤖</span>
                        </h3>
                        <span className="text-slate-400 text-[10px] font-semibold">{requirementMatches.length} matching harvests found</span>
                      </div>

                      {requirementMatches.length === 0 ? (
                        <p className="text-sm text-slate-400 italic p-4 text-center">No matching farmer harvest listings found in the region.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <th className="p-3 font-bold uppercase text-[9px]">Match %</th>
                                <th className="p-3 font-bold uppercase text-[9px]">Farmer</th>
                                <th className="p-3 font-bold uppercase text-[9px] text-center">Crop Match</th>
                                <th className="p-3 font-bold uppercase text-[9px] text-center">Distance</th>
                                <th className="p-3 font-bold uppercase text-[9px] text-center">Supply Quantity</th>
                                <th className="p-3 font-bold uppercase text-[9px] text-center">Price Fit</th>
                                <th className="p-3 font-bold uppercase text-[9px] text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {requirementMatches.map(match => (
                                <tr key={match.crop_id} className="hover:bg-slate-50/50 transition">
                                  <td className="p-3">
                                    <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-black border border-emerald-200 shadow-xs">
                                      {match.score_details.total_score}%
                                    </span>
                                  </td>
                                  <td className="p-3">
                                    <div className="font-bold text-slate-800 flex items-center gap-1">
                                      {match.farmer_name}
                                      {match.farmer_verified && (
                                        <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 py-0.2 rounded font-bold" title="Verified Farmer">✓ Verified</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{match.farmer_location}</div>
                                  </td>
                                  <td className="p-3 text-center font-bold text-emerald-600">
                                    {match.score_details.crop_score > 0 ? '✓ 40/40' : '✗ 0/40'}
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="font-semibold text-slate-700">{match.score_details.distance_km} km</div>
                                    <div className="text-[9px] text-slate-400">Score: {match.score_details.location_score}/25</div>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="font-semibold text-slate-700">{match.quantity} {match.unit}</div>
                                    <div className="text-[9px] text-slate-400">Expected ₹{match.expected_price}</div>
                                  </td>
                                  <td className="p-3 text-center font-semibold text-slate-650">
                                    Score: {match.score_details.price_score}/15
                                  </td>
                                  <td className="p-3 text-right">
                                    <button 
                                      onClick={() => {
                                        const cropObj = marketplaceCrops.find(c => c.id === match.crop_id);
                                        if (cropObj) {
                                          handleOpenOfferModal(cropObj);
                                        } else {
                                          handleOpenOfferModal({
                                            id: match.crop_id,
                                            crop_name: match.crop_name,
                                            variety: match.variety,
                                            quantity: match.quantity,
                                            unit: match.unit,
                                            expected_price: match.expected_price,
                                            location: match.farmer_location,
                                            farmer_id: match.farmer_id
                                          });
                                        }
                                      }}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-[11px] shadow-xs"
                                    >
                                      Send Offer
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border rounded-xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[220px]">
                      <ShoppingBag className="w-12 h-12 text-emerald-600 text-opacity-25 mb-3" />
                      <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider">No Demand Requirement Selected</h4>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-sm">Select one of your crop procurement requirements on the left to run automatic smart matching checks against local farm harvests.</p>
                    </div>
                  )}

                  {/* My Offers Sent */}
                  <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-3">
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider border-b pb-2 mb-3">
                      My Offers Sent to Farmers / அனுப்பிய சலுகைகள்
                    </h3>
                    {myOffers.length === 0 ? (
                      <p className="text-sm text-slate-400 italic p-2 text-center">No offers placed yet. Visit the Marketplace to send offers.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                              <th className="p-3 font-bold uppercase text-[9px]">Crop Listing</th>
                              <th className="p-3 font-bold uppercase text-[9px] text-center">Offered Price</th>
                              <th className="p-3 font-bold uppercase text-[9px] text-center">Quantity</th>
                              <th className="p-3 font-bold uppercase text-[9px] text-center">Status</th>
                              <th className="p-3 font-bold uppercase text-[9px] text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {myOffers.map(offer => (
                              <tr key={offer.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-3 font-bold text-slate-800">
                                  🌾 {offer.crop.crop_name} ({offer.crop.variety})
                                  <div className="text-[10px] text-slate-400 font-medium">Farmer ID: {offer.crop.farmer_id} • {offer.crop.location}</div>
                                </td>
                                <td className="p-3 text-center font-bold text-emerald-700">
                                  ₹{offer.offered_price_per_unit}/{offer.crop.unit}
                                </td>
                                <td className="p-3 text-center text-slate-655 font-semibold">
                                  {offer.quantity} {offer.crop.unit}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                    offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-850' : 
                                    offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                    offer.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-850'
                                  }`}>
                                    {offer.status}
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button 
                                    onClick={() => handleSelectOffer(offer)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition text-[11px] shadow-xs"
                                  >
                                    Chat Negotiation
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. MARKETPLACE TAB */}
          {currentUser?.role === 'BUYER' && activeTab === 'marketplace' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2.5 mb-3">
                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">
                  Available Farmer Harvests / சந்தையில் உள்ள பயிர்கள்
                </h3>
                <span className="text-slate-400 text-xs font-semibold">{marketplaceCrops.length} harvests for sale</span>
              </div>
              
              {marketplaceCrops.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-16 bg-white border rounded-xl shadow-sm">No harvests are listed for sale at this time.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceCrops.map(crop => (
                    <div key={crop.id} className="bg-white border rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-base">🍅 {crop.crop_name}</h4>
                            <div className="text-xs text-slate-500">{crop.variety || 'Standard Variety'}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[9px] block uppercase font-medium">Expected Price</span>
                            <span className="text-emerald-700 font-extrabold text-base">₹{crop.expected_price}/{crop.unit}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-550 bg-slate-50 p-2.5 rounded border border-slate-100 mb-3">
                          <div className="flex items-center gap-1"><Scale className="w-3.5 h-3.5 text-slate-400" /> Qty: <span className="font-semibold text-slate-700">{crop.quantity} {crop.unit}</span></div>
                          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Loc: <span className="font-semibold text-slate-700">{crop.location}</span></div>
                        </div>

                        {crop.description && (
                          <p className="text-[11px] text-slate-400 italic line-clamp-2">"{crop.description}"</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t pt-3 mt-1.5">
                        <span className="text-[10px] text-slate-400 font-semibold">Farmer ID: {crop.farmer_id}</span>
                        <button 
                          onClick={() => handleOpenOfferModal(crop)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
                        >
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>Send Direct Offer</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* 5. DIRECT NEGOTIATION CHAT INTERFACE (Displays when an offer is selected) */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex items-center justify-center p-6 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl border flex overflow-hidden">
            {/* Left Panel: Offer and Crop Details (1/3 width) */}
            <div className="w-1/3 border-r bg-slate-50 p-6 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b pb-4">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Offer Details / சலுகை விவரம்</h3>
                    <p className="text-[10px] text-slate-400 mt-1">ID: #{selectedOffer.id}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded text-[9px] uppercase font-black tracking-wide ${
                    selectedOffer.status === 'accepted' ? 'bg-emerald-100 text-emerald-850' : 
                    selectedOffer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                    selectedOffer.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-850'
                  }`}>
                    {selectedOffer.status}
                  </span>
                </div>

                <div className="space-y-4 text-xs text-slate-600">
                  <div className="bg-white p-3.5 rounded-xl border shadow-xs space-y-1">
                    <div className="font-bold text-[9px] text-slate-400 uppercase tracking-wide">Target Harvest Listing</div>
                    <div className="font-black text-slate-800 text-xs">🌾 {selectedOffer.crop.crop_name} ({selectedOffer.crop.variety})</div>
                    <div className="text-[11px] text-slate-500">Quantity: {selectedOffer.crop.quantity} {selectedOffer.crop.unit}</div>
                    <div className="text-[11px] text-slate-500">Expected: ₹{selectedOffer.crop.expected_price}/{selectedOffer.crop.unit}</div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border shadow-xs space-y-1">
                    <div className="font-bold text-[9px] text-slate-400 uppercase tracking-wide">Counterparty Details</div>
                    <div className="font-black text-slate-800 text-xs flex items-center gap-1">
                      {currentUser.role === 'FARMER' ? selectedOffer.buyer.name : `Farmer (ID: ${selectedOffer.crop.farmer_id})`}
                      {currentUser.role === 'FARMER' && selectedOffer.buyer.is_verified && <span className="text-emerald-600 text-[8px] font-bold bg-emerald-50 px-1 rounded border">Verified</span>}
                    </div>
                    <div className="text-[11px] text-slate-550">Contact: {currentUser.role === 'FARMER' ? selectedOffer.buyer.phone : 'Farmer User'}</div>
                    <div className="text-[11px] text-slate-550">Location: {currentUser.role === 'FARMER' ? selectedOffer.buyer.location : selectedOffer.crop.location}</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold text-[9px] text-slate-400 uppercase tracking-wide mb-1.5">Market Reference pricing Comparison</div>
                  {renderPriceInfo(selectedOffer, selectedOffer.crop)}
                </div>
              </div>

              {selectedOffer.status !== 'accepted' && selectedOffer.status !== 'rejected' && (
                <div className="border-t pt-4 space-y-2 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border shadow-xs space-y-2">
                    <div className="font-bold text-[9px] text-slate-505 uppercase tracking-wider">Propose Counter Offer Price / பேரம்</div>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold">₹</span>
                        <input 
                          type="number" 
                          className="w-full pl-6 pr-2 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                          placeholder="Price / unit" 
                          value={counterPriceInput}
                          onChange={(e) => setCounterPriceInput(e.target.value)}
                        />
                      </div>
                      <span className="text-slate-400 font-semibold">/{selectedOffer.crop.unit}</span>
                      <button 
                        onClick={() => handleRespondOffer('countered', counterPriceInput)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition"
                      >
                        Counter
                      </button>
                    </div>
                  </div>

                  {currentUser.role === 'FARMER' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleRespondOffer('accepted')}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl text-center transition text-xs uppercase"
                      >
                        Accept Offer
                      </button>
                      <button 
                        onClick={() => handleRespondOffer('rejected')}
                        className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-center transition border border-rose-200 text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Panel: Chat Thread (2/3 width) */}
            <div className="w-2/3 flex flex-col justify-between h-full bg-slate-50">
              <div className="p-4 border-b bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-xs border">
                    {currentUser.role === 'FARMER' ? selectedOffer.buyer.name.substring(0, 2).toUpperCase() : `Farmer`.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-xs">
                      {currentUser.role === 'FARMER' ? selectedOffer.buyer.name : `Farmer (ID: ${selectedOffer.crop.farmer_id})`}
                    </div>
                    <div className="text-[9px] text-slate-400">Direct Negotiation Log</div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOffer(null)} 
                  className="p-1.5 text-slate-400 hover:text-slate-655 rounded-full hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {chatMessages.map(msg => {
                  const isMe = msg.sender_id === currentUser.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3.5 rounded-2xl max-w-[70%] text-xs shadow-xs ${
                        isMe ? 'bg-emerald-600 text-white rounded-tr-none shadow-sm' : 'bg-white border rounded-2xl rounded-tl-none text-slate-700'
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</p>
                        <div className={`text-[8px] mt-1.5 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400 font-semibold'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSendChatMessage} className="p-4 bg-white border-t flex gap-2">
                <input 
                  type="text" 
                  className="flex-1 px-4 py-2 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500" 
                  placeholder="Type negotiation message / செய்தி தட்டச்சு செய்க..." 
                  value={newMsgText}
                  onChange={(e) => setNewMsgText(e.target.value)}
                />
                <button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 px-5 rounded-xl transition flex items-center justify-center gap-1 font-bold text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 6. SEND OFFER MODAL (From Marketplace or Supplier Match list) */}
      {activeOfferTarget && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-sm">Send Offer to Farmer / சலுகையளி</h3>
              <button onClick={() => setActiveOfferTarget(null)} className="text-slate-400 hover:text-slate-655">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1.5">
              <div className="font-bold text-slate-800 text-xs">🍅 {activeOfferTarget.crop_name} ({activeOfferTarget.variety})</div>
              <div className="text-slate-500 text-[10px]">
                Expected price: <span className="font-bold text-emerald-700">₹{activeOfferTarget.expected_price}/{activeOfferTarget.unit}</span> | Location: {activeOfferTarget.location}
              </div>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-4 text-slate-700 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Offered Price (₹ / {activeOfferTarget.unit})</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full p-2.5 border rounded-lg text-xs"
                  value={offerForm.offered_price_per_unit}
                  onChange={(e) => setOfferForm({...offerForm, offered_price_per_unit: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Quantity Requested ({activeOfferTarget.unit})</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full p-2.5 border rounded-lg text-xs"
                  value={offerForm.quantity}
                  onChange={(e) => setOfferForm({...offerForm, quantity: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Proposal Message</label>
                <textarea 
                  rows="2" 
                  placeholder="Ask for quality specifications, shipping arrangements, etc."
                  className="w-full p-2.5 border rounded-lg text-xs"
                  value={offerForm.message}
                  onChange={(e) => setOfferForm({...offerForm, message: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-sm"
              >
                Submit Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. EDIT CROP DIALOG MODAL */}
      {isEditingCrop && editCropForm && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2.5">
              <h3 className="font-extrabold text-slate-800 text-sm">Edit Crop Listing / பயிர் விவரம் திருத்துக</h3>
              <button 
                onClick={() => {
                  setIsEditingCrop(false);
                  setEditCropForm(null);
                }} 
                className="text-slate-400 hover:text-slate-655"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCropSubmit} className="space-y-4 text-slate-700 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Crop Name / பயிர் பெயர்</label>
                <select 
                  className="w-full p-2.5 border rounded-lg bg-slate-50 text-xs font-semibold"
                  value={editCropForm.crop_name}
                  onChange={(e) => setEditCropForm({...editCropForm, crop_name: e.target.value})}
                >
                  <option value="Tomato">🍅 Tomato / தக்காளி</option>
                  <option value="Potato">🥔 Potato / உருளைக்கிழங்கு</option>
                  <option value="Onion">🧅 Onion / வெங்காயம்</option>
                  <option value="Rice">🌾 Rice / நெல்</option>
                  <option value="Wheat">🌾 Wheat / கோதுமை</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Variety / ரகம்</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border rounded-lg text-xs"
                  value={editCropForm.variety}
                  onChange={(e) => setEditCropForm({...editCropForm, variety: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Quantity / அளவு</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full p-2.5 border rounded-lg text-xs"
                    value={editCropForm.quantity}
                    onChange={(e) => setEditCropForm({...editCropForm, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Unit / அலகு</label>
                  <select 
                    className="w-full p-2.5 border rounded-lg bg-slate-50 text-xs font-semibold"
                    value={editCropForm.unit}
                    onChange={(e) => setEditCropForm({...editCropForm, unit: e.target.value})}
                  >
                    <option value="tons">Tons / டன்கள்</option>
                    <option value="kg">kg / கிலோகிராம்</option>
                    <option value="bags">Bags / மூடைகள்</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Expected Price (₹ / unit) / எதிர்பார்க்கும் விலை</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full p-2.5 border rounded-lg text-xs"
                  value={editCropForm.expected_price}
                  onChange={(e) => setEditCropForm({...editCropForm, expected_price: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Harvest Location / அறுவடை இடம்</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2.5 border rounded-lg text-xs"
                  value={editCropForm.location}
                  onChange={(e) => setEditCropForm({...editCropForm, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Additional Details / கூடுதல் விவரங்கள்</label>
                <textarea 
                  rows="2" 
                  className="w-full p-2 border rounded-lg text-xs"
                  value={editCropForm.description}
                  onChange={(e) => setEditCropForm({...editCropForm, description: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition"
              >
                Save Changes / மாற்றங்களைச் சேமி
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
