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
  Plus
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Header & Demo Accounts Switcher */}
      <header className="bg-emerald-700 text-white p-4 sticky top-0 z-40 shadow">
        <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sprout className="w-6 h-6 text-emerald-300" />
              <h1 className="text-lg font-black tracking-tight">NO MIDDLE MAN</h1>
            </div>
            <button 
              onClick={handleRefresh}
              className="p-1.5 hover:bg-emerald-800 rounded-full transition md:hidden"
              title="Refresh database"
            >
              <RefreshCw className="w-4 h-4 text-emerald-100" />
            </button>
          </div>
          
          {/* Switcher & Desktop Refresh */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 flex-1 md:justify-end">
            <div className="bg-emerald-800 bg-opacity-70 p-2.5 rounded-lg text-xs space-y-1.5 border border-emerald-600 flex-1 md:flex-none md:w-80">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-200">DEMO SWITCHER WIDGET:</span>
                <button 
                  onClick={() => setShowRegister(!showRegister)}
                  className="text-[10px] text-emerald-300 hover:text-white underline font-semibold"
                >
                  {showRegister ? 'Cancel' : '+ New User'}
                </button>
              </div>
              
              {showRegister ? (
                <form onSubmit={handleRegister} className="space-y-1.5 bg-emerald-900 p-2 rounded text-slate-800">
                  <input 
                    type="text" 
                    placeholder="Name" 
                    required
                    className="w-full p-1 rounded text-xs"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                  />
                  <div className="flex gap-1">
                    <input 
                      type="text" 
                      placeholder="Phone" 
                      required
                      className="w-1/2 p-1 rounded text-xs"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})}
                    />
                    <input 
                      type="text" 
                      placeholder="Location" 
                      required
                      className="w-1/2 p-1 rounded text-xs"
                      value={registerForm.location}
                      onChange={(e) => setRegisterForm({...registerForm, location: e.target.value})}
                    />
                  </div>
                  <div className="flex gap-2 text-white items-center justify-between">
                    <div>
                      <label className="mr-2">Role:</label>
                      <select 
                        value={registerForm.role}
                        className="text-slate-800 p-0.5 rounded text-xs"
                        onChange={(e) => setRegisterForm({...registerForm, role: e.target.value})}
                      >
                        <option value="FARMER">Farmer</option>
                        <option value="BUYER">Buyer</option>
                      </select>
                    </div>
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-bold">
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="font-bold text-white flex items-center">
                      {currentUser?.name}
                      {currentUser?.is_verified && (
                        <span className="bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded text-[8px] ml-1.5">
                          ✓ Verified Buyer
                        </span>
                      )}
                    </span>
                    <span className="bg-emerald-600 text-emerald-100 px-1.5 py-0.2 rounded font-mono text-[9px] uppercase tracking-wide">
                      {currentUser?.role}
                    </span>
                  </div>
                  <select 
                    value={currentUser?.id || ''} 
                    onChange={(e) => handleUserSwitch(e.target.value)}
                    className="bg-emerald-950 text-white p-1 rounded text-xs outline-none border border-emerald-700 cursor-pointer font-medium"
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.is_verified ? '✓ Verified' : ''} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-emerald-800 rounded-full transition hidden md:block bg-emerald-800"
              title="Refresh database"
            >
              <RefreshCw className="w-4 h-4 text-emerald-100" />
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="bg-white border-b shadow-sm sticky top-[73px] md:top-[80px] z-30">
        <div className="max-w-6xl w-full mx-auto flex">
          {currentUser?.role === 'FARMER' ? (
            <>
              <button 
                onClick={() => setActiveTab('farmer')} 
                className={`flex-1 md:flex-initial md:px-8 py-3.5 text-center text-sm font-bold border-b-2 transition ${activeTab === 'farmer' ? 'border-emerald-600 text-emerald-700 bg-emerald-50 bg-opacity-20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                Dashboard / கட்டுப்பாட்டு அறை
              </button>
              <button 
                onClick={() => setActiveTab('upload')} 
                className={`flex-1 md:flex-initial md:px-8 py-3.5 text-center text-sm font-bold border-b-2 transition ${activeTab === 'upload' ? 'border-emerald-600 text-emerald-700 bg-emerald-50 bg-opacity-20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                Upload Crop / புதிய பதிவேற்றம்
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('buyer')} 
                className={`flex-1 md:flex-initial md:px-8 py-3.5 text-center text-sm font-bold border-b-2 transition ${activeTab === 'buyer' ? 'border-emerald-600 text-emerald-700 bg-emerald-50 bg-opacity-20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                My Demands / என் தேவைகள்
              </button>
              <button 
                onClick={() => setActiveTab('marketplace')} 
                className={`flex-1 md:flex-initial md:px-8 py-3.5 text-center text-sm font-bold border-b-2 transition ${activeTab === 'marketplace' ? 'border-emerald-600 text-emerald-700 bg-emerald-50 bg-opacity-20' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}
              >
                Marketplace / சந்தை
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* FARMER TAB */}
        {currentUser?.role === 'FARMER' && activeTab === 'farmer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Listings & Demands */}
            <div className="md:col-span-1 space-y-6">
              
              {/* My Crops list */}
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-850 mb-3 uppercase tracking-wide border-b pb-2">
                  My Active Crop Listings / என் பயிர்கள்
                </h2>
                {myCrops.length === 0 ? (
                  <div className="bg-slate-50 border-2 border-dashed rounded-lg p-6 text-center text-slate-400">
                    <p className="text-sm">You haven't uploaded any crops yet.</p>
                    <button 
                      onClick={() => setActiveTab('upload')}
                      className="mt-2 text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1 mx-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Post your first crop
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {myCrops.map(crop => (
                      <button
                        key={crop.id}
                        onClick={() => handleSelectCrop(crop)}
                        className={`w-full p-3 rounded-lg border text-left transition flex justify-between items-center ${selectedCrop?.id === crop.id ? 'border-emerald-500 bg-emerald-50 bg-opacity-40 ring-1 ring-emerald-500' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                      >
                        <div>
                          <div className="font-bold text-slate-800 truncate">{crop.crop_name}</div>
                          <div className="text-xs text-slate-500">{crop.quantity} {crop.unit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-700 font-bold text-xs">₹{crop.expected_price}/{crop.unit}</div>
                          <span className={`inline-block text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold mt-1 ${crop.status === 'sold' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {crop.status}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Buyer Demands Feed */}
              <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 border-b pb-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Active Buyer Demands / கொள்முதல் தேவைகள்</span>
                </h2>
                {allRequirements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No buyer demands published yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {allRequirements.map(req => {
                      const buyerUser = users.find(u => u.id === req.buyer_id);
                      return (
                        <div key={req.id} className="border rounded-lg p-2.5 text-xs flex justify-between items-center hover:bg-slate-50 bg-white">
                          <div>
                            <div className="font-bold text-slate-850">🌾 {req.crop_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Quantity: {req.required_quantity} {req.unit} | Location: {req.preferred_location}
                            </div>
                            <div className="text-[9px] text-slate-400 mt-0.5 flex items-center">
                              Buyer: {req.buyer_id === 2 ? 'BigMart Wholesale' : req.buyer_id === 3 ? 'FreshMart Retail' : (buyerUser?.name || `Buyer (ID: ${req.buyer_id})`)}
                              {(req.buyer_id === 2 || buyerUser?.is_verified) && (
                                <span className="text-emerald-600 font-bold ml-1 text-[8px] bg-emerald-50 px-1 rounded border border-emerald-200">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-[8px] uppercase font-semibold">Max Price</div>
                            <div className="text-emerald-700 font-black text-xs">₹{req.max_price}/{req.unit}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Crop Detail, Matches, Offers */}
            <div className="md:col-span-2 space-y-6">
              {selectedCrop ? (
                <div className="space-y-6">
                  {/* Crop Profile Summary Banner */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-4 rounded-xl shadow-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-emerald-800 text-[10px] uppercase font-bold tracking-widest bg-emerald-100 px-1.5 py-0.5 rounded">
                          Active Profile / நடப்பு பயிர் விவரம்
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-800 mt-1.5">🌾 {selectedCrop.crop_name} ({selectedCrop.variety})</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-0.5"><Scale className="w-3.5 h-3.5 text-slate-400" /> {selectedCrop.quantity} {selectedCrop.unit}</span>
                          <span className="flex items-center gap-0.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {selectedCrop.location}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-slate-400 text-[10px] uppercase font-semibold">Expected Price / எதிர்பார்த்த விலை</div>
                        <div className="text-emerald-700 font-black text-lg">₹{selectedCrop.expected_price}/{selectedCrop.unit}</div>
                      </div>
                    </div>
                    
                    {/* Edit & Delete Controls */}
                    <div className="flex gap-2 justify-end mt-4 border-t pt-2.5 border-emerald-100">
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
                        className="bg-emerald-100 hover:bg-emerald-200 text-emerald-850 px-4 py-1.5 rounded-lg text-xs font-bold transition"
                      >
                        Edit / திருத்து
                      </button>
                      <button
                        onClick={() => handleDeleteCrop(selectedCrop.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-1.5 rounded-lg text-xs font-bold transition border border-rose-200"
                      >
                        Delete / நீக்கு
                      </button>
                    </div>
                  </div>

                  {/* SMART MATCH PANEL */}
                  <div className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                        <span>Smart Match 🤖</span>
                      </h3>
                      <span className="text-slate-400 text-[10px] font-semibold">{cropMatches.length} matches found</span>
                    </div>

                    {cropMatches.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No matching buyer requirements found. Buyers need to list their demands.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {cropMatches.map(match => (
                          <div key={match.requirement_id} className="border rounded-lg p-3 text-xs space-y-2 hover:bg-slate-50 bg-white">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-bold text-slate-700 flex items-center">
                                  {match.buyer_name}
                                  {match.buyer_verified && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded ml-1 font-bold">
                                      ✓ Verified Buyer
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[10px] flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> Proximity: {match.score_details.distance_km} km ({match.buyer_location})
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-black border border-emerald-200">
                                  {match.score_details.total_score}% Match
                                </span>
                              </div>
                            </div>
                            
                            {/* Score metrics breakdown */}
                            <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 grid grid-cols-2 gap-y-1 gap-x-2 border border-slate-100">
                              <div>{match.score_details.crop_score > 0 ? '✓' : '✗'} Crop Match: <span className="font-semibold text-slate-700">{match.score_details.crop_score}/40</span></div>
                              <div>{match.score_details.location_score > 0 ? '✓' : '✗'} Nearby: <span className="font-semibold text-slate-700">{match.score_details.location_score}/25</span></div>
                              <div>{match.score_details.quantity_score >= 10 ? '✓' : '✗'} Quantity Fit: <span className="font-semibold text-slate-700">{match.score_details.quantity_score}/20</span></div>
                              <div>{match.score_details.price_score > 0 ? '✓' : '✗'} Price Fit: <span className="font-semibold text-slate-700">{match.score_details.price_score}/15</span></div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] pt-1">
                              <span className="text-slate-500">Demands: <span className="font-semibold text-slate-700">{match.required_quantity} {match.unit} @ max ₹{match.max_price}</span></span>
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                Discovery Match <Check className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* OFFERS RECEIVED & COMPARISON */}
                  <div className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                    <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-2">
                      <IndianRupee className="w-4 h-4 text-emerald-600" />
                      <span>Offers & Comparison / பெறப்பட்ட சலுகைகள்</span>
                    </h3>
                    
                    {cropOffers.length > 0 && (
                      <div className="bg-slate-50 border p-3 rounded-lg text-xs space-y-1.5">
                        <div className="font-bold text-slate-700 uppercase tracking-wide text-[10px]">Comparative Offer Panel / ஒப்பீட்டு சலுகைகள்:</div>
                        <div className="grid grid-cols-3 font-semibold text-slate-500 border-b pb-1 text-[10px]">
                          <div>Buyer / வாங்குபவர்</div>
                          <div className="text-center">Price / unit</div>
                          <div className="text-right">Total Quantity</div>
                        </div>
                        <div className="space-y-1 pt-1 text-[11px]">
                          {cropOffers.map(o => (
                            <div key={o.id} className="grid grid-cols-3 text-slate-700">
                              <div className="font-medium flex items-center truncate">
                                {o.buyer.name}
                                {o.buyer.is_verified && (
                                  <span className="text-emerald-600 font-bold ml-1 text-[8px]" title="Verified Buyer">✓</span>
                                )}
                              </div>
                              <div className="text-center font-bold text-emerald-700">₹{o.offered_price_per_unit}/{selectedCrop.unit}</div>
                              <div className="text-right text-slate-600">{o.quantity} {selectedCrop.unit}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {cropOffers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No offers received yet. Buyers must send offers from the marketplace.</p>
                    ) : (
                      <div className="space-y-3">
                        {cropOffers.map(offer => (
                          <div 
                            key={offer.id} 
                            className={`border rounded-lg p-3 text-xs space-y-2 cursor-pointer transition ${selectedOffer?.id === offer.id ? 'border-emerald-600 bg-emerald-50 bg-opacity-20 ring-1 ring-emerald-500' : 'hover:bg-slate-50 bg-white'}`}
                            onClick={() => handleSelectOffer(offer)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-700 flex items-center">
                                {offer.buyer.name}
                                {offer.buyer.is_verified && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded ml-1 font-bold">
                                    ✓ Verified Buyer
                                  </span>
                                )}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 
                                offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                offer.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {offer.status}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Quantity: {offer.quantity} {selectedCrop.unit}</span>
                              <span className="font-bold text-slate-700 text-sm">₹{offer.offered_price_per_unit}/{selectedCrop.unit}</span>
                            </div>
                            
                            {/* Direct message text if present */}
                            {offer.message && (
                              <p className="bg-slate-50 p-2 rounded text-slate-600 text-xs italic">
                                "{offer.message}"
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                              <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                              <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                                Open Chat Negotiation <ArrowRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                  <Sprout className="w-12 h-12 text-emerald-600 text-opacity-30 mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">No Crop Selected / பயிர் தேர்ந்தெடுக்கப்படவில்லை</h3>
                  <p className="text-xs mt-1 max-w-sm">Select one of your crop listings on the left to view buyer matches, pricing comparisons, and negotiation logs.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FARMER UPLOAD TAB */}
        {currentUser?.role === 'FARMER' && activeTab === 'upload' && (
          <div className="bg-white border rounded-xl p-4 space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5 border-b pb-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <span>Upload New Harvest Details / புதிய அறுவடை விவரம் பதிவேற்று</span>
            </h2>
            
            <form onSubmit={handleUploadCrop} className="space-y-3.5 text-slate-700">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Crop Name / பயிர் பெயர்</label>
                <select 
                  className="w-full p-2 border rounded-lg text-sm bg-slate-50"
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
                <label className="block text-xs font-bold text-slate-500 mb-1">Variety / ரகம்</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Local Hybrid, Basmati, Jyoti" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={cropForm.variety}
                  onChange={(e) => setCropForm({...cropForm, variety: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Quantity / அளவு</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    className="w-full p-2 border rounded-lg text-sm"
                    value={cropForm.quantity}
                    onChange={(e) => setCropForm({...cropForm, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Unit / அலகு</label>
                  <select 
                    className="w-full p-2 border rounded-lg text-sm bg-slate-50"
                    value={cropForm.unit}
                    onChange={(e) => setCropForm({...cropForm, unit: e.target.value})}
                  >
                    <option value="tons">Tons / டன்கள்</option>
                    <option value="kg">Kilograms / கிலோகிராம் (kg)</option>
                    <option value="bags">Bags / மூடைகள் (50kg)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Expected Price (₹ / unit) / எதிர்பார்க்கும் விலை</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full p-2 border rounded-lg text-sm"
                  value={cropForm.expected_price}
                  onChange={(e) => setCropForm({...cropForm, expected_price: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Harvest Location (Town / Region) / அறுவடை இடம்</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Nashik, Pune, Satara" 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={cropForm.location}
                  onChange={(e) => setCropForm({...cropForm, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Additional Details / கூடுதல் விவரங்கள்</label>
                <textarea 
                  rows="3" 
                  placeholder="Notes on harvesting date, logistics, etc." 
                  className="w-full p-2 border rounded-lg text-sm"
                  value={cropForm.description}
                  onChange={(e) => setCropForm({...cropForm, description: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg text-sm transition mt-2 flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Harvest Listing / அறுவடை விவரத்தைப் பதிவேற்று</span>
              </button>
            </form>
          </div>
        )}

        {/* BUYER TAB (My Demands) */}
        {currentUser?.role === 'BUYER' && activeTab === 'buyer' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: Post form and my demands */}
            <div className="md:col-span-1 space-y-6">
              
              {/* Post requirement form */}
              <div className="bg-white border rounded-xl p-4 space-y-3.5 shadow-sm">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5 border-b pb-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Define Buyer Crop Requirement</span>
                </h3>
                
                <form onSubmit={handleAddRequirement} className="space-y-3 text-slate-700">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Crop</label>
                      <select 
                        className="w-full p-1.5 border rounded text-xs bg-slate-50"
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
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Preferred Region</label>
                      <input 
                        type="text" 
                        required
                        placeholder="e.g. Nashik, Pune"
                        className="w-full p-1.5 border rounded text-xs"
                        value={reqForm.preferred_location}
                        onChange={(e) => setReqForm({...reqForm, preferred_location: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Quantity</label>
                      <input 
                        type="number" 
                        required
                        min="1"
                        className="w-full p-1.5 border rounded text-xs"
                        value={reqForm.required_quantity}
                        onChange={(e) => setReqForm({...reqForm, required_quantity: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Unit</label>
                      <select 
                        className="w-full p-1.5 border rounded text-xs bg-slate-50"
                        value={reqForm.unit}
                        onChange={(e) => setReqForm({...reqForm, unit: e.target.value})}
                      >
                        <option value="kg">kg</option>
                        <option value="tons">Tons</option>
                        <option value="bags">Bags</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Dist (km)</label>
                      <input 
                        type="number" 
                        required
                        className="w-full p-1.5 border rounded text-xs"
                        value={reqForm.max_distance_km}
                        onChange={(e) => setReqForm({...reqForm, max_distance_km: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Max Price (₹ / unit)</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      className="w-full p-1.5 border rounded text-xs"
                      value={reqForm.max_price}
                      onChange={(e) => setReqForm({...reqForm, max_price: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded text-xs transition"
                  >
                    Save Demands Profile
                  </button>
                </form>
              </div>

              {/* List my requirements */}
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-2">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b pb-2">
                  My Active Demands / என் தேவைகள்
                </h3>
                {myRequirements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No demand requirements posted yet.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {myRequirements.map(req => (
                      <div 
                        key={req.id} 
                        onClick={() => handleSelectRequirement(req)}
                        className={`bg-white border rounded-lg p-3 text-xs flex justify-between items-center shadow-xs cursor-pointer hover:bg-slate-50 transition ${selectedRequirement?.id === req.id ? 'border-emerald-500 bg-emerald-50 bg-opacity-20 ring-1 ring-emerald-500' : ''}`}
                      >
                        <div>
                          <div className="font-bold text-slate-800">🌾 {req.crop_name}</div>
                          <div className="text-slate-500 text-[10px] mt-0.5">
                            Quantity: {req.required_quantity} {req.unit} | Location: {req.preferred_location} (Max {req.max_distance_km} km)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-slate-400 text-[9px] uppercase font-semibold">Max Budget</div>
                          <div className="text-emerald-700 font-extrabold text-sm">₹{req.max_price}/{req.unit}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Suppliers Match List and Sent Offers */}
            <div className="md:col-span-2 space-y-6">
              {selectedRequirement ? (
                <div className="space-y-6">
                  {/* SMART MATCH SUPPLIERS PANEL */}
                  <div className="bg-white border rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                        <span>Find Suppliers / உற்பத்தியாளர்கள் கண்டறிதல் 🤖</span>
                      </h3>
                      <span className="text-slate-400 text-[10px] font-semibold">{requirementMatches.length} suppliers found</span>
                    </div>

                    {requirementMatches.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No matching farmer harvests found in the region.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {requirementMatches.map(match => (
                          <div key={match.crop_id} className="border rounded-lg p-3 text-xs space-y-2 hover:bg-slate-50 bg-white">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-bold text-slate-700 flex items-center">
                                  {match.farmer_name}
                                  {match.farmer_verified && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[8px] px-1 rounded ml-1 font-bold">
                                      ✓ Verified Farmer
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-400 text-[10px] flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5" /> Proximity: {match.score_details.distance_km} km ({match.farmer_location})
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-black border border-emerald-200">
                                  {match.score_details.total_score}% Match
                                </span>
                              </div>
                            </div>
                            
                            {/* Score metrics breakdown checklist */}
                            <div className="bg-slate-50 p-2 rounded text-[10px] text-slate-500 grid grid-cols-2 gap-y-1 gap-x-2 border border-slate-100">
                              <div className="flex items-center gap-0.5">
                                <span className="mr-1">{match.score_details.crop_score > 0 ? '✓' : '✗'}</span>
                                <span>Crop Match: <span className="font-semibold text-slate-700">{match.score_details.crop_score}/40</span></span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <span className="mr-1">{match.score_details.location_score > 0 ? '✓' : '✗'}</span>
                                <span>Nearby: <span className="font-semibold text-slate-700">{match.score_details.location_score}/25</span></span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <span className="mr-1">{match.score_details.quantity_score >= 10 ? '✓' : '✗'}</span>
                                <span>Qty Fit: <span className="font-semibold text-slate-700">{match.score_details.quantity_score}/20</span></span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <span className="mr-1">{match.score_details.price_score > 0 ? '✓' : '✗'}</span>
                                <span>Price Fit: <span className="font-semibold text-slate-700">{match.score_details.price_score}/15</span></span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-[10px] pt-1">
                              <span className="text-slate-500">Supplies: <span className="font-semibold text-slate-700">{match.quantity} {match.unit} @ ₹{match.expected_price}/{match.unit}</span></span>
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
                                className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5 bg-emerald-50 px-2 py-1 rounded"
                              >
                                Place Offer / சலுகையளி <ArrowRight className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white border rounded-xl p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[220px]">
                  <ShoppingBag className="w-12 h-12 text-emerald-600 text-opacity-30 mb-3" />
                  <h3 className="font-bold text-slate-700 text-sm">No Demand Requirement Selected</h3>
                  <p className="text-xs mt-1 max-w-sm">Select one of your demands on the left to activate smart supplier matches and negotiate listings.</p>
                </div>
              )}

              {/* Sent Offers Section */}
              <div className="bg-white border rounded-xl p-4 shadow-sm space-y-3">
                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider border-b pb-2">
                  My Offers Sent to Farmers / அனுப்பிய சலுகைகள்
                </h3>
                {myOffers.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No offers sent yet. Visit the Marketplace tab to place offers.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {myOffers.map(offer => (
                      <div 
                        key={offer.id} 
                        className={`bg-white border rounded-lg p-3 text-xs space-y-2 cursor-pointer transition hover:bg-slate-50 ${selectedOffer?.id === offer.id ? 'border-emerald-500 bg-emerald-50 bg-opacity-20 ring-1 ring-emerald-500' : ''}`}
                        onClick={() => handleSelectOffer(offer)}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">🌾 {offer.crop.crop_name} Listing</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black ${
                            offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 
                            offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            offer.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {offer.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-slate-500">
                          <span>Offered Price: <span className="font-bold text-slate-800">₹{offer.offered_price_per_unit}/{offer.crop.unit}</span></span>
                          <span>Quantity: {offer.quantity} {offer.crop.unit}</span>
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center justify-end gap-0.5">
                          <span>Direct Chat Negotiation</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BUYER TAB (Marketplace Browse) */}
        {currentUser?.role === 'BUYER' && activeTab === 'marketplace' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide">
              Available Farmer Harvests / சந்தையில் உள்ள பயிர்கள்
            </h2>
            
            {marketplaceCrops.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-12 bg-white border rounded-xl shadow-xs">No harvests are listed for sale at this time.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {marketplaceCrops.map(crop => (
                  <div key={crop.id} className="bg-white border rounded-xl p-4.5 space-y-4 shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-extrabold text-slate-800 text-base">🍅 {crop.crop_name}</h3>
                          <div className="text-xs text-slate-500">{crop.variety || 'Standard Variety'}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 text-[9px] block uppercase font-medium">Expected Price</span>
                          <span className="text-emerald-700 font-extrabold text-base">₹{crop.expected_price}/{crop.unit}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-100 mb-3">
                        <div className="flex items-center gap-1"><Scale className="w-3.5 h-3.5 text-slate-400" /> Qty: <span className="font-semibold text-slate-700">{crop.quantity} {crop.unit}</span></div>
                        <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Loc: <span className="font-semibold text-slate-700">{crop.location}</span></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t pt-3">
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

      {/* DIRECT NEGOTIATION CHAT INTERFACE (Displays when an offer is selected) */}
      {selectedOffer && (
        <div className="fixed inset-y-0 right-0 w-full md:max-w-md bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col h-full">
          {/* Chat Header */}
          <div className="p-4 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">
                  {currentUser.role === 'FARMER' ? selectedOffer.buyer.name : `Farmer (ID: ${selectedOffer.crop.farmer_id})`}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[8px] uppercase px-1 py-0.2 rounded font-bold">
                  {selectedOffer.status}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Negotiating: {selectedOffer.crop.crop_name} | {selectedOffer.quantity} {selectedOffer.crop.unit}
              </p>
            </div>
            <button 
              onClick={() => setSelectedOffer(null)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Price Comparer Panel (Market Support) */}
          <div className="p-3 border-b bg-emerald-50 bg-opacity-20">
            {renderPriceInfo(selectedOffer, selectedOffer.crop)}
          </div>

          {/* Message Thread Scroll Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
            {chatMessages.map(msg => {
              const isMe = msg.sender_id === currentUser.id;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3.5 rounded-2xl max-w-[80%] text-xs shadow-xs ${
                    isMe ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border rounded-2xl rounded-tl-none text-slate-700'
                  }`}>
                    {msg.message_text}
                    <div className={`text-[8px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Negotiate Action Controls */}
          {selectedOffer.status !== 'accepted' && selectedOffer.status !== 'rejected' && (
            <div className="p-3 bg-white border-t space-y-2 text-xs">
              <div className="flex gap-2 justify-between items-center bg-slate-50 p-2 rounded-lg border">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-600">Counter Price:</span>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1.5 text-slate-400">₹</span>
                    <input 
                      type="number" 
                      className="w-20 pl-4 py-1 border rounded text-xs" 
                      value={counterPriceInput}
                      onChange={(e) => setCounterPriceInput(e.target.value)}
                    />
                  </div>
                  <span className="text-slate-500">/{selectedOffer.crop.unit}</span>
                </div>
                <button 
                  onClick={() => handleRespondOffer('countered', counterPriceInput)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded font-bold transition text-xs shadow-xs"
                >
                  Send Counter Offer
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleRespondOffer('accepted')}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept Deal & Finalize</span>
                </button>
                <button 
                  onClick={() => handleRespondOffer('rejected')}
                  className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Offer</span>
                </button>
              </div>
            </div>
          )}

          {/* Chat Message Input Form */}
          <form onSubmit={handleSendChatMessage} className="p-3 border-t bg-white flex gap-2">
            <input 
              type="text" 
              placeholder="Send message to continue negotiating..."
              className="flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              value={newMsgText}
              onChange={(e) => setNewMsgText(e.target.value)}
            />
            <button 
              type="submit" 
              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* PLACE OFFER DIALOG MODAL (For Buyers placing offers on listings) */}
      {activeOfferTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Send Offer to Farmer</h3>
              <button onClick={() => setActiveOfferTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border text-xs">
              <div className="font-bold text-slate-800">🍅 {activeOfferTarget.crop_name} ({activeOfferTarget.variety})</div>
              <div className="text-slate-500 mt-0.5">
                Expected: ₹{activeOfferTarget.expected_price}/{activeOfferTarget.unit} | Location: {activeOfferTarget.location}
              </div>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3.5 text-slate-700 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Offered Price (₹ / {activeOfferTarget.unit})</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  className="w-full p-2 border rounded-lg text-xs"
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
                  className="w-full p-2 border rounded-lg text-xs"
                  value={offerForm.quantity}
                  onChange={(e) => setOfferForm({...offerForm, quantity: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Proposal Message</label>
                <textarea 
                  rows="2" 
                  className="w-full p-2 border rounded-lg text-xs"
                  value={offerForm.message}
                  onChange={(e) => setOfferForm({...offerForm, message: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg transition"
              >
                Submit Offer
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CROP DIALOG MODAL */}
      {isEditingCrop && editCropForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-4 shadow-2xl border">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-800 text-sm">Edit Crop Listing / பயிர் விவரம் திருத்துக</h3>
              <button 
                onClick={() => {
                  setIsEditingCrop(false);
                  setEditCropForm(null);
                }} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditCropSubmit} className="space-y-3 text-slate-700 text-xs">
              <div>
                <label className="block font-bold text-slate-500 mb-1">Crop Name / பயிர் பெயர்</label>
                <select 
                  className="w-full p-2 border rounded-lg bg-slate-50 text-xs"
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
                  className="w-full p-2 border rounded-lg text-xs"
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
                    className="w-full p-2 border rounded-lg text-xs"
                    value={editCropForm.quantity}
                    onChange={(e) => setEditCropForm({...editCropForm, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-500 mb-1">Unit / அலகு</label>
                  <select 
                    className="w-full p-2 border rounded-lg bg-slate-50 text-xs"
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
                  className="w-full p-2 border rounded-lg text-xs"
                  value={editCropForm.expected_price}
                  onChange={(e) => setEditCropForm({...editCropForm, expected_price: e.target.value})}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">Harvest Location / அறுவடை இடம்</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border rounded-lg text-xs"
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
