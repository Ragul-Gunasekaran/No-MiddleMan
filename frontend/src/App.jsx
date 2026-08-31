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
  Edit,
  Home,
  Search
} from 'lucide-react';

export default function App() {
  // Demo State
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [loginForm, setLoginForm] = useState({ phone: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', phone: '', location: '', password: '', role: 'FARMER' });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
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
  const [isCreatingCrop, setIsCreatingCrop] = useState(false);
  const [isCreatingRequirement, setIsCreatingRequirement] = useState(false);
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
    } catch (e) {
      console.error("Error loading users:", e);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    if (!regForm.name.trim()) {
      setAuthError('Name cannot be empty / பெயர் காலியாக இருக்கக்கூடாது');
      return;
    }
    if (!regForm.phone.trim() || !/^\d{10}$/.test(regForm.phone.trim())) {
      setAuthError('Phone number must be a valid 10-digit number / தொலைபேசி எண் 10 இலக்கங்களாக இருக்க வேண்டும்');
      return;
    }
    if (!regForm.location.trim()) {
      setAuthError('Location cannot be empty / இடம் காலியாக இருக்கக்கூடாது');
      return;
    }
    if (regForm.password.length < 6) {
      setAuthError('Password must be at least 6 characters / கடவுச்சொல் குறைந்தபட்சம் 6 எழுத்துகள் இருக்க வேண்டும்');
      return;
    }

    try {
      const newUser = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: regForm.name.trim(),
          phone: regForm.phone.trim(),
          role: regForm.role,
          location: regForm.location.trim(),
          password: regForm.password,
          is_verified: false
        })
      });
      
      setAuthSuccess('Account created successfully! Logging you in... / கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!');
      await loadUsers();
      setTimeout(() => {
        setCurrentUser(newUser);
        setAuthSuccess('');
      }, 1500);
    } catch (err) {
      setAuthError(err.message || 'Registration failed');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    
    if (!loginForm.phone.trim()) {
      setAuthError('Phone number required / தொலைபேசி எண் தேவை');
      return;
    }
    if (!loginForm.password) {
      setAuthError('Password required / கடவுச்சொல் தேவை');
      return;
    }

    try {
      const loggedUser = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: loginForm.phone.trim(),
          password: loginForm.password
        })
      });
      
      setAuthSuccess('Login successful! Welcome back... / உள்நுழைவு வெற்றிகரமாக முடிந்தது!');
      setTimeout(() => {
        setCurrentUser(loggedUser);
        setAuthSuccess('');
      }, 1000);
    } catch (err) {
      setAuthError(err.message || 'Invalid phone number or password / தவறான தொலைபேசி எண் அல்லது கடவுச்சொல்');
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

  const RenderSmartMatchDetails = ({ match, onAction }) => {
    const [showDetail, setShowDetail] = useState(false);
    const totalScore = match.score_details.total_score;
    const isCropMatch = match.score_details.crop_score > 0;
    const isLocationMatch = match.score_details.location_score >= 15;
    const isQuantityMatch = match.score_details.quantity_score >= 15;
    const isPriceMatch = match.score_details.price_score >= 10;

    return (
      <div className="border border-slate-150 rounded-xl p-4 bg-white hover:shadow-md transition space-y-3 shadow-xs">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-black border border-emerald-200">
              ⭐ {totalScore}% Match
            </span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
              {match.buyer_name || match.farmer_name}
              {match.buyer_verified && (
                <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 px-1 rounded border">✓ Verified Buyer</span>
              )}
              {match.farmer_verified && (
                <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 px-1 rounded border">✓ Verified Farmer</span>
              )}
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setShowDetail(!showDetail)}
            className="text-[11px] text-emerald-655 font-bold hover:underline"
          >
            {showDetail ? 'Hide explanation / மறை' : 'Why this match? / விளக்கம்'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 border-t pt-2.5">
          <div className="flex items-center gap-1">
            {isCropMatch ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-rose-500 font-bold">✗</span>}
            <span>Same Crop / ஒரே பயிர்</span>
          </div>
          <div className="flex items-center gap-1">
            {isLocationMatch ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-amber-500 font-bold">⚠</span>}
            <span>Good Location / அருகில்</span>
          </div>
          <div className="flex items-center gap-1">
            {isQuantityMatch ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-amber-500 font-bold">⚠</span>}
            <span>Quantity Suitable / அளவு</span>
          </div>
          <div className="flex items-center gap-1">
            {isPriceMatch ? <span className="text-emerald-600 font-bold">✓</span> : <span className="text-amber-500 font-bold">⚠</span>}
            <span>Price Suitable / விலை</span>
          </div>
        </div>

        {showDetail && (
          <div className="mt-3 p-3 bg-slate-50 border rounded-xl text-[11px] text-slate-500 font-mono space-y-1">
            <div className="font-bold text-slate-700 mb-1 border-b pb-1">Points Breakdown:</div>
            <div className="flex justify-between"><span>Crop Similarity:</span> <span className="font-bold">{match.score_details.crop_score}/40</span></div>
            <div className="flex justify-between"><span>Location Proximity:</span> <span className="font-bold">{match.score_details.location_score}/25 ({match.score_details.distance_km} km)</span></div>
            <div className="flex justify-between"><span>Quantity Match:</span> <span className="font-bold">{match.score_details.quantity_score}/20</span></div>
            <div className="flex justify-between"><span>Price Target Fit:</span> <span className="font-bold">{match.score_details.price_score}/15</span></div>
          </div>
        )}

        {onAction && (
          <div className="border-t pt-3 flex justify-end">
            {onAction}
          </div>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6 w-full">
        <div className="bg-white border rounded-2xl p-8 max-w-md w-full shadow-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <Sprout className="w-10 h-10 text-emerald-600 animate-bounce" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-wider">NO MIDDLE MAN</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Direct Farmer ↔ Buyer Marketplace</p>
          </div>

          {authError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{authSuccess}</span>
            </div>
          )}

          {authMode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number / தொலைபேசி எண்</label>
                <input 
                  type="text" 
                  value={loginForm.phone}
                  onChange={(e) => setLoginForm({ ...loginForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Password / கடவுச்சொல்</label>
                <input 
                  type="password" 
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition uppercase shadow-md tracking-wider"
              >
                Login / உள்நுழை
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                New to NO MIDDLE MAN?{' '}
                <button 
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Create Account / கணக்கு உருவாக்க
                </button>
              </div>

              {/* Demo Accounts List */}
              <div className="border-t pt-4 mt-2 space-y-3">
                <label className="text-[9px] font-bold text-slate-400 uppercase block text-center tracking-wider">Demo Accounts (For Instant Testing)</label>
                <div className="grid grid-cols-1 gap-2">
                  {users.filter(u => ['9876543210', '9876543211', '9876543212'].includes(u.phone)).map(demoUser => (
                    <button
                      key={demoUser.id}
                      type="button"
                      onClick={() => {
                        setAuthSuccess(`Logging in as ${demoUser.name}...`);
                        setTimeout(() => {
                          setCurrentUser(demoUser);
                          setAuthSuccess('');
                        }, 500);
                      }}
                      className="bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border text-left p-3 rounded-xl transition flex justify-between items-center group animate-none"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">{demoUser.name}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-medium">{demoUser.role.toLowerCase()} • {demoUser.location}</div>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition">Log In →</span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase block">I am a / நான் ஒரு</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, role: 'FARMER' })}
                    className={`py-3.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${regForm.role === 'FARMER' ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span>🌾 Farmer / விவசாயி</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegForm({ ...regForm, role: 'BUYER' })}
                    className={`py-3.5 px-4 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${regForm.role === 'BUYER' ? 'bg-emerald-50 border-emerald-400 text-emerald-800 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <span>🏢 Buyer / வாங்குபவர்</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name / முழு பெயர்</label>
                <input 
                  type="text" 
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Phone Number / தொலைபேசி எண்</label>
                <input 
                  type="text" 
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Location / இடம்</label>
                <input 
                  type="text" 
                  value={regForm.location}
                  onChange={(e) => setRegForm({ ...regForm, location: e.target.value })}
                  placeholder="e.g. Nashik, Maharashtra"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Password / கடவுச்சொல்</label>
                <input 
                  type="password" 
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs transition uppercase shadow-md tracking-wider"
              >
                Create Account / கணக்கு உருவாக்க
              </button>

              <div className="text-center pt-2 text-xs text-slate-500">
                Already have an account?{' '}
                <button 
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-emerald-600 font-bold hover:underline"
                >
                  Login / உள்நுழை
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

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
          <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="block text-[8px] uppercase font-bold text-slate-500">Demo Mode Switch / டெமோ தேர்வு</label>
              <button 
                onClick={() => setCurrentUser(null)}
                className="text-[9px] text-rose-400 hover:text-rose-350 hover:underline font-bold font-sans"
              >
                Logout / வெளியேறு
              </button>
            </div>
            <select 
              value={currentUser?.id || ''} 
              onChange={(e) => handleUserSwitch(e.target.value)}
              className="w-full bg-slate-900 text-slate-300 p-1.5 rounded-md text-[11px] outline-none border border-slate-700 cursor-pointer font-medium hover:border-slate-600 transition"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-slate-900">
                  {u.name} {u.is_verified ? '✓' : ''} ({u.role.toLowerCase()})
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
                  <Home className="w-4 h-4" />
                  <span>🏠 Dashboard / முகப்பு</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('my-crops')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'my-crops' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  <span>🌾 My Crops / என் பயிர்கள்</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('find-buyers')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'find-buyers' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>🔎 Find Buyers / வாங்குபவர்கள்</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('offers')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'offers' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  <span>💰 Offers / சலுகைகள்</span>
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
                  <Home className="w-4 h-4" />
                  <span>🏠 Dashboard / முகப்பு</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('my-requirements')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'my-requirements' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>📋 My Requirements / தேவைகள்</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('find-crops')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'find-crops' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span>🌾 Find Crops / பயிர்கள்</span>
                </span>
                <ChevronRight className="w-3 opacity-60" />
              </button>
              <button 
                onClick={() => setActiveTab('my-offers')} 
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition ${activeTab === 'my-offers' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
              >
                <span className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  <span>💰 My Offers / சலுகைகள்</span>
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
              {activeTab === 'farmer' && '🏠 Farmer Dashboard / முகப்பு'}
              {activeTab === 'my-crops' && '🌾 My Crops / என் பயிர்கள்'}
              {activeTab === 'find-buyers' && '🔎 Find Buyers / வாங்குபவர்கள்'}
              {activeTab === 'offers' && '💰 Offers / பெறப்பட்ட சலுகைகள்'}
              {activeTab === 'buyer' && '🏠 Buyer Dashboard / முகப்பு'}
              {activeTab === 'my-requirements' && '📋 My Requirements / என் தேவைகள்'}
              {activeTab === 'find-crops' && '🌾 Find Crops / பயிர்கள்'}
              {activeTab === 'my-offers' && '💰 My Offers / என் சலுகைகள்'}
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
        <div className="lg:hidden flex border-b bg-white overflow-x-auto select-none no-scrollbar">
          {currentUser?.role === 'FARMER' ? (
            <>
              <button 
                onClick={() => setActiveTab('farmer')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition border-r ${activeTab === 'farmer' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                🏠 Home
              </button>
              <button 
                onClick={() => setActiveTab('my-crops')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition border-r ${activeTab === 'my-crops' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                🌾 Crops
              </button>
              <button 
                onClick={() => setActiveTab('find-buyers')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition border-r ${activeTab === 'find-buyers' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                🔎 Buyers
              </button>
              <button 
                onClick={() => setActiveTab('offers')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition ${activeTab === 'offers' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                💰 Offers
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('buyer')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition border-r ${activeTab === 'buyer' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                🏠 Home
              </button>
              <button 
                onClick={() => setActiveTab('my-requirements')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition border-r ${activeTab === 'my-requirements' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                📋 Demands
              </button>
              <button 
                onClick={() => setActiveTab('find-crops')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition border-r ${activeTab === 'find-crops' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                🌾 Crops
              </button>
              <button 
                onClick={() => setActiveTab('my-offers')} 
                className={`flex-1 min-w-[90px] py-2.5 text-center text-[10px] font-extrabold transition ${activeTab === 'my-offers' ? 'border-b-2 border-b-emerald-600 text-emerald-700 bg-emerald-50/10' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                💰 Bids
              </button>
            </>
          )}
        </div>

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 space-y-6">

          {/* 1. FARMER DASHBOARD TAB */}
          {currentUser?.role === 'FARMER' && activeTab === 'farmer' && (
            <div className="space-y-8">
              {/* Spacious, Friendly Welcome Hero */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
                <div className="max-w-xl space-y-4">
                  <span className="text-emerald-100 text-xs uppercase font-extrabold tracking-widest bg-emerald-500/20 px-3 py-1 rounded-full">
                    Direct Marketplace / நேரடி விவசாய சந்தை
                  </span>
                  <h1 className="text-3xl font-black">Welcome back, {currentUser?.name} 👋 / வணக்கம்</h1>
                  <p className="text-emerald-100 text-sm leading-relaxed">
                    Post your harvest listings, automatically discover matching buyers in your region, negotiate direct price offers, and secure deals—all with no middle-man.
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => { setActiveTab('my-crops'); setIsCreatingCrop(true); }}
                      className="bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold px-6 py-3 rounded-xl shadow-md transition text-sm flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5 text-emerald-700" />
                      <span>Post New Harvest Crop / அறுவடை விவரம் சேர்க்க</span>
                    </button>
                  </div>
                </div>
                {/* Decorative background shape */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
                  <Sprout className="w-64 h-64" />
                </div>
              </div>

              {/* Status Overview Columns - What to do next? */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Crops status */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">My Crop Listings / என் பயிர்கள்</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      You currently have <span className="font-extrabold text-slate-850">{myCrops.length}</span> active agricultural crop harvests listed.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => { setActiveTab('my-crops'); setIsCreatingCrop(false); }}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition border text-center"
                    >
                      Manage My Crops / பயிர்கள்
                    </button>
                  </div>
                </div>

                {/* Column 2: Matches status */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit">
                      <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Interested Buyers / பொருத்தங்கள்</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      We found <span className="font-extrabold text-slate-850">{allRequirements.filter(req => myCrops.some(c => c.crop_name.toLowerCase().trim() === req.crop_name.toLowerCase().trim())).length}</span> matching buyers looking for your crops.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => setActiveTab('find-buyers')}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition border text-center"
                    >
                      Find Buyers / வாங்குபவர்கள் தேடு
                    </button>
                  </div>
                </div>

                {/* Column 3: Offers status */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Offers Received / சலுகைகள்</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      You have received <span className="font-extrabold text-slate-850">{cropOffers.length}</span> price bids and negotiation offers from buyers.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => setActiveTab('offers')}
                      className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition text-center shadow-xs"
                    >
                      Review Offers / சலுகைகள் காண்க
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 3. BUYER DASHBOARD TAB */}
          {currentUser?.role === 'BUYER' && activeTab === 'buyer' && (
            <div className="space-y-8">
              {/* Spacious, Friendly Welcome Hero */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-8 text-white shadow-md relative overflow-hidden">
                <div className="max-w-xl space-y-4">
                  <span className="text-emerald-100 text-xs uppercase font-extrabold tracking-widest bg-emerald-500/20 px-3 py-1 rounded-full">
                    Direct Sourcing / கொள்முதல் மையம்
                  </span>
                  <h1 className="text-3xl font-black">Welcome back, {currentUser?.name} 👋 / வணக்கம்</h1>
                  <p className="text-emerald-105 text-sm leading-relaxed">
                    Post your sourcing requirements, search for available crops listed by verified farmers, place price offers, and negotiate directly with growers.
                  </p>
                  <div className="pt-2">
                    <button 
                      onClick={() => { setActiveTab('my-requirements'); setIsCreatingRequirement(true); }}
                      className="bg-white hover:bg-emerald-50 text-emerald-800 font-extrabold px-6 py-3 rounded-xl shadow-md transition text-sm flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5 text-emerald-755" />
                      <span>Post Crop Requirement / கொள்முதல் தேவை சேர்க்க</span>
                    </button>
                  </div>
                </div>
                {/* Decorative background shape */}
                <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
                  <ShoppingBag className="w-64 h-64" />
                </div>
              </div>

              {/* Status Overview Columns - What to do next? */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Column 1: Requirements status */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl w-fit">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">My Requirements / என் தேவைகள்</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      You are looking to procure <span className="font-extrabold text-slate-850">{myRequirements.length}</span> crop requirements.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => { setActiveTab('my-requirements'); setIsCreatingRequirement(false); }}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition border text-center"
                    >
                      Manage Requirements / என் தேவைகள்
                    </button>
                  </div>
                </div>

                {/* Column 2: Available crops */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl w-fit">
                      <Sprout className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Crops on Sale / விற்பனை பயிர்கள்</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      There are <span className="font-extrabold text-slate-850">{marketplaceCrops.length}</span> fresh harvest listings available directly from farmers.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => setActiveTab('find-crops')}
                      className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-4 rounded-xl text-xs transition border text-center"
                    >
                      Browse Marketplace / சந்தை காண்க
                    </button>
                  </div>
                </div>

                {/* Column 3: Bids status */}
                <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl w-fit">
                      <IndianRupee className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">My Bids / என் சலுகைகள்</h3>
                    <p className="text-xs text-slate-500 leading-normal">
                      You have submitted <span className="font-extrabold text-slate-850">{myOffers.length}</span> price proposals to growers.
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <button 
                      onClick={() => setActiveTab('my-offers')}
                      className="w-full bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition text-center shadow-xs"
                    >
                      Review My Bids / சலுகைகள் காண்க
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 4. BUYER MY REQUIREMENTS TAB (Checklist + Details / Form) */}
          {currentUser?.role === 'BUYER' && activeTab === 'my-requirements' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left Column: My demands list & Form */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Requirement Form */}
                {isCreatingRequirement || myRequirements.length === 0 ? (
                  <div className="bg-white border rounded-xl p-4.5 shadow-sm space-y-3">
                    <h3 className="text-lg font-bold text-slate-700 border-b pb-2 mb-3">Define Crop Requirement / தேவைகள்</h3>
                    <form onSubmit={(e) => { handleAddRequirement(e); setIsCreatingRequirement(false); }} className="space-y-3 text-slate-750 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Crop</label>
                          <select 
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-semibold text-slate-800"
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
                            className="w-full p-2 border rounded-lg text-xs text-slate-800"
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
                            className="w-full p-2 border rounded-lg text-xs text-slate-800"
                            value={reqForm.required_quantity}
                            onChange={(e) => setReqForm({...reqForm, required_quantity: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Unit</label>
                          <select 
                            className="w-full p-2 border rounded-lg bg-slate-50 text-xs font-semibold text-slate-800"
                            value={reqForm.unit}
                            onChange={(e) => setReqForm({...reqForm, unit: e.target.value})}
                          >
                            <option value="kg">kg</option>
                            <option value="tons">Tons</option>
                            <option value="bags">Bags (50kg)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase">Max Dist</label>
                          <input 
                            type="number" 
                            required
                            className="w-full p-2 border rounded-lg text-xs text-slate-800"
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
                          className="w-full p-2 border rounded-lg text-xs text-slate-800"
                          value={reqForm.max_price}
                          onChange={(e) => setReqForm({...reqForm, max_price: e.target.value})}
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        {myRequirements.length > 0 && (
                          <button 
                            type="button" 
                            onClick={() => setIsCreatingRequirement(false)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 border text-slate-700 py-2 rounded-lg text-xs transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button 
                          type="submit" 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs transition shadow-xs"
                        >
                          Publish demand
                        </button>
                      </div>
                    </form>
                  </div>
                ) : null}

                {/* My Active demands checklist list */}
                <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-2">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wide">
                      My Demands / என் தேவைகள்
                    </h3>
                    <button 
                      onClick={() => setIsCreatingRequirement(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs"
                    >
                      + Add Requirement
                    </button>
                  </div>

                  {myRequirements.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No demands listed yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {myRequirements.map(req => (
                        <div 
                          key={req.id} 
                          onClick={() => { handleSelectRequirement(req); setIsCreatingRequirement(false); }}
                          className={`bg-white border rounded-lg p-3 text-xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition shadow-xs ${selectedRequirement?.id === req.id && !isCreatingRequirement ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500' : 'border-slate-200'}`}
                        >
                          <div>
                            <div className="font-bold text-slate-800 text-xs">🍉 {req.crop_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Qty: {req.required_quantity} {req.unit} | Max: {req.max_distance_km} km
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-400 text-[8px] uppercase font-bold">Budget</div>
                            <div className="text-emerald-700 font-bold text-xs">₹{req.max_price}/{req.unit}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Suppliers Matches for selected requirement */}
              <div className="lg:col-span-2 space-y-6">
                {selectedRequirement && !isCreatingRequirement ? (
                  <div className="bg-white border rounded-xl shadow-sm p-4.5 space-y-3">
                    <h3 className="font-bold text-slate-700 text-lg uppercase flex items-center gap-1.5 border-b pb-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                      <span>Matching Harvests / பொருத்தமான பயிர்கள்</span>
                    </h3>
                    {requirementMatches.length === 0 ? (
                      <p className="text-sm text-slate-400 italic p-4 text-center">No matching farmer harvest listings found in the region.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {requirementMatches.map(match => (
                          <RenderSmartMatchDetails 
                            key={match.crop_id} 
                            match={match} 
                            onAction={
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
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
                              >
                                Send Offer
                              </button>
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white border rounded-xl p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                    <ShoppingBag className="w-12 h-12 text-emerald-600 text-opacity-25 mb-3" />
                    <h4 className="font-extrabold text-slate-750 text-base uppercase tracking-wider">No Demand Requirement Selected</h4>
                    <p className="text-sm text-slate-400 mt-1 max-w-sm">Select one of your crop procurement requirements from the left to find matching supplier listings and submit price offers.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. BUYER FIND CROPS TAB (Marketplace) */}
          {currentUser?.role === 'BUYER' && activeTab === 'find-crops' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2.5 mb-3">
                <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">
                  Available Farmer Harvests / விவசாய பயிர்கள் சந்தை
                </h3>
                <span className="text-slate-500 text-xs font-semibold">{marketplaceCrops.length} harvests for sale</span>
              </div>
              
              {marketplaceCrops.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-16 bg-white border rounded-xl shadow-sm">No harvests are listed for sale at this time.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {marketplaceCrops.map(crop => (
                    <div key={crop.id} className="bg-white border rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition">
                      <div>
                        <div className="flex justify-between items-start mb-2 border-b pb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-base">🍅 {crop.crop_name}</h4>
                            <div className="text-xs text-slate-500 mt-0.5">{crop.variety || 'Standard Variety'}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-400 text-[9px] block uppercase font-bold font-bold">Expected Price</span>
                            <span className="text-emerald-700 font-extrabold text-base">₹{crop.expected_price}/{crop.unit}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-650 bg-slate-50 p-2.5 rounded border mb-3">
                          <div className="flex items-center gap-1"><Scale className="w-3.5 h-3.5 text-slate-400" /> Qty: <span className="font-semibold text-slate-700">{crop.quantity} {crop.unit}</span></div>
                          <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Loc: <span className="font-semibold text-slate-700">{crop.location}</span></div>
                        </div>

                        {crop.description && (
                          <p className="text-[11px] text-slate-500 italic line-clamp-2 bg-slate-50/50 p-2 rounded">"{crop.description}"</p>
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

          {/* 6. BUYER MY OFFERS TAB (Bids list) */}
          {currentUser?.role === 'BUYER' && activeTab === 'my-offers' && (
            <div className="space-y-6">
              <div className="bg-white border rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex justify-between items-center border-b pb-2 mb-2">
                  <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">
                    My Bids comparative matrix / அனுப்பிய சலுகைகள்
                  </h3>
                  <span className="text-slate-550 text-xs font-semibold">{myOffers.length} offers submitted</span>
                </div>

                {myOffers.length === 0 ? (
                  <p className="text-sm text-slate-405 italic p-6 text-center">No bids submitted yet. Visit the Find Crops tab to submit offers.</p>
                ) : (
                  <div className="overflow-x-auto border rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-3.5 font-bold uppercase text-[9px]">Crop Listing</th>
                          <th className="p-3.5 font-bold uppercase text-[9px] text-center font-bold">My Offered Price</th>
                          <th className="p-3.5 font-bold uppercase text-[9px] text-center">Quantity</th>
                          <th className="p-3.5 font-bold uppercase text-[9px] text-center">Status</th>
                          <th className="p-3.5 font-bold uppercase text-[9px] text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {myOffers.map(offer => (
                          <tr key={offer.id} className="hover:bg-slate-50/50 transition">
                            <td className="p-3.5 font-bold text-slate-800">
                              🌾 {offer.crop.crop_name} ({offer.crop.variety})
                              <div className="text-[10px] text-slate-400 font-medium">Farmer ID: {offer.crop.farmer_id} • {offer.crop.location}</div>
                            </td>
                            <td className="p-3.5 text-center font-bold text-emerald-700">
                              ₹{offer.offered_price_per_unit}/{offer.crop.unit}
                            </td>
                            <td className="p-3.5 text-center text-slate-655 font-semibold">
                              {offer.quantity} {offer.crop.unit}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-850' : 
                                offer.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                offer.status === 'countered' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-850'
                              }`}>
                                {offer.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
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
                      {currentUser.role === 'FARMER' ? (
                        selectedOffer.buyer.is_verified && <span className="text-emerald-600 text-[8px] font-bold bg-emerald-50 px-1 rounded border">✓ Verified Buyer</span>
                      ) : (
                        <span className="text-emerald-600 text-[8px] font-bold bg-emerald-50 px-1 rounded border">✓ Verified Farmer</span>
                      )}
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
