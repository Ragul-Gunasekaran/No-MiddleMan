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
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  
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

  // Auth & Loading States
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Fetch helper with User Auth Header
  const API_BASE_URL = import.meta.env.VITE_API_URL || '';
  const apiFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, { ...options, headers });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        setCurrentUser(null);
      }
      const errorText = await response.text().catch(() => '');
      let errorDetail = 'API request failed';
      try {
        const json = JSON.parse(errorText);
        errorDetail = json.detail || JSON.stringify(json);
      } catch (e) {
        errorDetail = errorText || 'Empty response';
      }
      const method = options.method || 'GET';
      throw new Error(`API ERROR\n${method} ${fullUrl}\nStatus: ${response.status}\nResponse: ${errorDetail}`);
    }
    return response.json();
  };

  // Initial Boot
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const user = await apiFetch('/api/auth/me');
          setCurrentUser(user);
        } catch (e) {
          localStorage.removeItem('token');
        }
      }
      setIsAppLoading(false);
      loadMarketPrices();
    };
    initAuth();
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
      const authRes = await apiFetch('/api/auth/register', {
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
      
      localStorage.setItem('token', authRes.access_token);
      setAuthSuccess('Account created successfully! Logging you in... / கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது!');
      setTimeout(() => {
        setCurrentUser(authRes.user);
        setAuthSuccess('');
      }, 1000);
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
      const authRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: loginForm.phone.trim(),
          password: loginForm.password
        })
      });
      
      localStorage.setItem('token', authRes.access_token);
      setAuthSuccess('Login successful! Welcome back... / உள்நுழைவு வெற்றிகரமாக முடிந்தது!');
      setTimeout(() => {
        setCurrentUser(authRes.user);
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
      setApiError(e.message || 'Unable to load data');
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
      setApiError(e.message || 'Unable to load data');
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
      setApiError(e.message || 'Unable to load data');
    }
  };

  const handleSelectRequirement = async (req) => {
    setSelectedRequirement(req);
    try {
      const matches = await apiFetch(`/api/requirements/${req.id}/matches`);
      setRequirementMatches(matches);
    } catch (e) {
      console.error(e);
      setApiError(e.message || 'Unable to load data');
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
      setApiError(e.message || 'Unable to load data');
    }
  };

  const handleRefresh = () => {
    setApiError(null);
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
  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setSelectedCrop(null);
    setSelectedRequirement(null);
    setSelectedOffer(null);
    setCropMatches([]);
    setRequirementMatches([]);
    setCropOffers([]);
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

  const handleRespondOffer = async (status, counterPrice = null, targetOfferId = null) => {
    const offerId = targetOfferId || selectedOffer?.id;
    if (!offerId) return;
    try {
      const updated = await apiFetch(`/api/offers/${offerId}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          status: status,
          counter_price: counterPrice ? parseFloat(counterPrice) : null,
          message: status === 'countered' ? `Countered price to ₹${counterPrice}/unit.` : `Responded: ${status.toUpperCase()}.`
        })
      });
      if (selectedOffer && selectedOffer.id === offerId) {
        setSelectedOffer(updated);
      }
      handleRefresh();
      alert(`Offer ${status} successfully!`);
    } catch (err) {
      alert("Operation failed: " + err.message);
    }
  };

  // Helper unit conversions for display reference
  const renderPriceInfo = (offer, crop) => {
    const key = (crop.crop_name || '').toLowerCase().strip ? (crop.crop_name || '').toLowerCase().trim() : (crop.crop_name || '').toLowerCase();
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

  if (isAppLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6 w-full">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Sprout className="w-12 h-12 text-emerald-600 animate-spin" />
          </div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Loading your account...</p>
        </div>
      </div>
    );
  }

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
          
          {/* Logout Action */}
          {/* Logout Action */}
          <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-2">
            <button onClick={handleLogout} className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg font-bold transition shadow-sm">Logout</button>
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
        
                {/* Error Boundary */}
        {apiError && (
          <div className="m-6 p-6 bg-rose-50 border border-rose-200 rounded-xl text-center">
            <h3 className="text-lg font-bold text-rose-800 mb-2">Unable to load data</h3>
            <p className="text-sm text-rose-600 mb-4">{apiError}</p>
            <button onClick={handleRefresh} className="px-4 py-2 bg-rose-600 text-white rounded font-bold hover:bg-rose-500 transition">
              Retry
            </button>
          </div>
        )}

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
            <button onClick={handleLogout} className="lg:hidden text-rose-500 font-bold hover:underline">Logout</button>
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
          {currentUser?.role === 'FARMER' && activeTab === 'farmer' && (() => {
            const matchesCount = allRequirements.filter(req => myCrops.some(c => (c.crop_name || '').toLowerCase().trim() === (req.crop_name || '').toLowerCase().trim())).length;
            const offersCount = cropOffers.length;
            
            let nextStepText = "";
            let nextStepAction = null;
            let nextStepBtnText = "";
            
            if (myCrops.length === 0) {
              nextStepText = "Post your first crop to find buyers. / வாங்குபவர்களைக் கண்டறிய உங்கள் முதல் பயிரை இடுகையிடவும்.";
              nextStepBtnText = "🌾 Post Crop / பயிர் இடுகையிடு";
              nextStepAction = () => { setActiveTab('my-crops'); setIsCreatingCrop(true); };
            } else if (matchesCount === 0) {
              nextStepText = `Find buyers for your ${myCrops[0].crop_name} crop. / உங்கள் ${myCrops[0].crop_name} பயிர்க்கான வாங்குபவர்களைக் கண்டறியவும்.`;
              nextStepBtnText = "🔎 Find Buyers / வாங்குபவர்களை தேடு";
              nextStepAction = () => setActiveTab('find-buyers');
            } else if (offersCount > 0 && cropOffers.some(o => o.status === 'pending' || o.status === 'countered')) {
              const pendingOffer = cropOffers.find(o => o.status === 'pending' || o.status === 'countered');
              if (pendingOffer) {
                nextStepText = `You have a new offer for your ${pendingOffer.crop.crop_name}. / உங்கள் ${pendingOffer.crop.crop_name} பயிருக்கு புதிய சலுகை வந்துள்ளது.`;
                nextStepBtnText = "💰 View Offer / சலுகையை காண்க";
                nextStepAction = () => setActiveTab('offers');
              } else {
                nextStepText = "Check matched buyers for your active crop listings. / உங்கள் பயிர்களுக்கான வாங்குபவர்கள் பொருத்தங்களை பார்க்கவும்.";
                nextStepBtnText = "🔍 Find Buyers / வாங்குபவர்களை தேடு";
                nextStepAction = () => setActiveTab('find-buyers');
              }
            } else {
              nextStepText = "Check matched buyers for your active crop listings. / உங்கள் பயிர்களுக்கான வாங்குபவர்கள் பொருத்தங்களை பார்க்கவும்.";
              nextStepBtnText = "🔎 Find Buyers / வாங்குபவர்களை தேடு";
              nextStepAction = () => setActiveTab('find-buyers');
            }

            return (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                    Welcome, {currentUser?.name} 👋
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 font-semibold">
                    What would you like to do today? / இன்று நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <button 
                      onClick={() => { setActiveTab('my-crops'); setIsCreatingCrop(true); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>🌾 Post Crop / பயிர் இடுகையிடு</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('find-buyers')}
                      className="bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition text-sm flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4 text-slate-500" />
                      <span>🔎 Find Buyers / வாங்குபவர்களை தேடு</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('offers')}
                      className="bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition text-sm flex items-center justify-center gap-2"
                    >
                      <IndianRupee className="w-4 h-4 text-slate-500" />
                      <span>💰 View Offers / சலுகைகள் காண்க</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">My Crops / என் பயிர்கள்</span>
                      <span className="text-4xl font-black text-slate-800">{myCrops.length}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <Sprout className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Buyer Matches / பொருத்தங்கள்</span>
                      <span className="text-4xl font-black text-slate-800">{matchesCount}</span>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                      <Search className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Offers / சலுகைகள்</span>
                      <span className="text-4xl font-black text-slate-800">{offersCount}</span>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
                      <IndianRupee className="w-8 h-8" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-emerald-800 font-extrabold text-sm uppercase tracking-wider">Your Next Step / அடுத்த கட்டம்</h4>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed">{nextStepText}</p>
                  </div>
                  <button 
                    onClick={nextStepAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm whitespace-nowrap"
                  >
                    {nextStepBtnText}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* 2. FARMER MY CROPS TAB */}
          {currentUser?.role === 'FARMER' && activeTab === 'my-crops' && (() => {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
                <div className="lg:col-span-1">
                  {isCreatingCrop || myCrops.length === 0 ? (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                      <h3 className="text-lg font-bold text-slate-800 border-b pb-2">🌾 Post Crop / பயிர் இடுகையிடு</h3>
                      <form onSubmit={async (e) => { 
                        await handleUploadCrop(e); 
                        setIsCreatingCrop(false); 
                      }} className="space-y-4 text-slate-700 text-xs">
                        <div>
                          <label className="block font-bold text-slate-500 mb-1">Step 1: What crop are you selling? / பயிர் வகை</label>
                          <select 
                            className="w-full p-3 border rounded-xl bg-slate-50 text-xs font-semibold"
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
                          <label className="block font-bold text-slate-500 mb-1">Variety / ரகம் (Optional)</label>
                          <input 
                            type="text"
                            placeholder="e.g. Hybrid, Local"
                            className="w-full p-3 border rounded-xl text-xs"
                            value={cropForm.variety}
                            onChange={(e) => setCropForm({...cropForm, variety: e.target.value})}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Step 2: Quantity / அளவு</label>
                            <input 
                              type="number"
                              required
                              min="1"
                              placeholder="e.g. 5"
                              className="w-full p-3 border rounded-xl text-xs"
                              value={cropForm.quantity}
                              onChange={(e) => setCropForm({...cropForm, quantity: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-slate-500 mb-1">Unit / அலகு</label>
                            <select 
                              className="w-full p-3 border rounded-xl bg-slate-50 text-xs font-semibold"
                              value={cropForm.unit}
                              onChange={(e) => setCropForm({...cropForm, unit: e.target.value})}
                            >
                              <option value="tons">Tons / டன்கள்</option>
                              <option value="kg">kg / கிலோகிராம்</option>
                              <option value="bags">Bags / மூடைகள்</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1">Step 3: Expected Price (₹ / unit) / எதிர்பார்க்கும் விலை</label>
                          <input 
                            type="number"
                            required
                            min="1"
                            placeholder="e.g. 20"
                            className="w-full p-3 border rounded-xl text-xs"
                            value={cropForm.expected_price}
                            onChange={(e) => setCropForm({...cropForm, expected_price: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1">Step 4: Harvest Location / அறுவடை இடம்</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Nashik"
                            className="w-full p-3 border rounded-xl text-xs"
                            value={cropForm.location}
                            onChange={(e) => setCropForm({...cropForm, location: e.target.value})}
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-slate-500 mb-1">Description / குறிப்பு (Optional)</label>
                          <textarea 
                            rows="2"
                            placeholder="e.g. Fresh harvest, ready to load"
                            className="w-full p-3 border rounded-xl text-xs"
                            value={cropForm.description}
                            onChange={(e) => setCropForm({...cropForm, description: e.target.value})}
                          />
                        </div>

                        <div className="flex gap-2">
                          {myCrops.length > 0 && (
                            <button 
                              type="button"
                              onClick={() => setIsCreatingCrop(false)}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 border text-slate-700 py-2.5 rounded-xl text-xs transition"
                            >
                              Cancel
                            </button>
                          )}
                          <button 
                            type="submit"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                          >
                            🌾 Post Crop / இடுகையிடு
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 text-center space-y-3">
                      <p className="text-slate-600 text-xs font-semibold">Ready to list another harvest? / மற்றொரு பயிர் சேர்க்க விரும்புகிறீர்களா?</p>
                      <button 
                        onClick={() => setIsCreatingCrop(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-xl text-xs transition shadow-sm"
                      >
                        + Post Crop / பயிர் சேர்
                      </button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">🌾 My Listed Crops / என் பயிர்கள்</h3>
                    {myCrops.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No crops posted yet. Use the form on the left to add one.</p>
                    ) : (
                      <div className="space-y-3">
                        {myCrops.map(crop => (
                          <div key={crop.id} className="border border-slate-200 rounded-xl p-4 bg-white hover:bg-slate-50/30 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-extrabold text-slate-800 text-sm">
                                  {crop.crop_name === 'Tomato' ? '🍅' : crop.crop_name === 'Potato' ? '🥔' : crop.crop_name === 'Onion' ? '🧅' : '🌾'} {crop.crop_name}
                                </h4>
                                {crop.variety && <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">{crop.variety}</span>}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 space-x-3">
                                <span>Qty: <span className="font-bold text-slate-700">{crop.quantity} {crop.unit}</span></span>
                                <span>Location: <span className="font-bold text-slate-700">{crop.location}</span></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                              <div className="text-left sm:text-right">
                                <span className="text-[8px] text-slate-400 font-extrabold uppercase block">Expected Price</span>
                                <span className="text-emerald-700 font-black text-sm">₹{crop.expected_price}/{crop.unit}</span>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditCropForm({
                                      id: crop.id,
                                      crop_name: crop.crop_name,
                                      variety: crop.variety || '',
                                      quantity: crop.quantity,
                                      unit: crop.unit,
                                      expected_price: crop.expected_price,
                                      location: crop.location,
                                      description: crop.description || ''
                                    });
                                    setIsEditingCrop(true);
                                  }}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-600 border px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => handleDeleteCrop(crop.id)}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 3. FARMER FIND BUYERS TAB */}
          {currentUser?.role === 'FARMER' && activeTab === 'find-buyers' && (() => {
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start max-w-5xl mx-auto">
                <div className="lg:col-span-1 space-y-4">
                  <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">🌾 Choose Crop Listing / பயிர் தேர்வு</h3>
                    {myCrops.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No crops posted yet. Add a crop first to find matches.</p>
                    ) : (
                      <div className="space-y-2">
                        {myCrops.map(crop => (
                          <div 
                            key={crop.id} 
                            onClick={() => handleSelectCrop(crop)}
                            className={`p-3.5 border rounded-xl text-xs flex justify-between items-center cursor-pointer hover:bg-slate-50 transition shadow-xs ${selectedCrop?.id === crop.id ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500' : 'border-slate-200'}`}
                          >
                            <div>
                              <div className="font-extrabold text-slate-800 text-xs">
                                {crop.crop_name === 'Tomato' ? '🍅' : crop.crop_name === 'Potato' ? '🥔' : crop.crop_name === 'Onion' ? '🧅' : '🌾'} {crop.crop_name}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">Qty: {crop.quantity} {crop.unit}</div>
                            </div>
                            <span className="text-emerald-700 font-bold text-xs">₹{crop.expected_price}/{crop.unit}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {selectedCrop ? (() => {
                    const matches = allRequirements
                      .map(req => {
                        let crop_score = 0.0;
                        if ((req.crop_name || '').toLowerCase().trim() === (selectedCrop.crop_name || '').toLowerCase().trim()) {
                          crop_score = 40.0;
                        }
                        
                        let location_score = 25.0;
                        let distance_km = 0.0;
                        if ((req.preferred_location || '').toLowerCase().trim() !== (selectedCrop.location || '').toLowerCase().trim()) {
                          location_score = 15.0;
                          distance_km = 80.0;
                        }
                        
                        let quantity_score = 20.0;
                        if (selectedCrop.quantity < req.required_quantity) {
                          quantity_score = 10.0;
                        }
                        
                        let price_score = 15.0;
                        if (selectedCrop.expected_price > req.max_price) {
                          price_score = 0.0;
                        } else if (selectedCrop.expected_price < req.max_price) {
                          price_score = 15.0;
                        }
                        
                        const total_score = crop_score + location_score + quantity_score + price_score;
                        const match_percent = Math.round(total_score);
                        
                        return {
                          req,
                          total_score,
                          match_percent,
                          breakdown: { crop_score, location_score, quantity_score, price_score }
                        };
                      })
                      .filter(m => m.match_percent >= 40)
                      .sort((a, b) => b.total_score - a.total_score);

                    return (
                      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b pb-2">
                          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-100" />
                            <span>Interested Buyers / வாங்குபவர்கள்</span>
                          </h3>
                          <span className="text-slate-500 text-xs font-semibold">{matches.length} matching demands found</span>
                        </div>

                        {matches.length === 0 ? (
                          <p className="text-sm text-slate-400 italic p-6 text-center">No matching buyer requirements found for {selectedCrop.crop_name} in your region.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matches.map(m => {
                              const isExpanded = expandedMatchId === m.req.id;
                              return (
                                <div key={m.req.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition">
                                  <div>
                                    <div className="flex justify-between items-center border-b pb-2">
                                      <div>
                                        <h4 className="font-extrabold text-slate-800 text-sm">{m.req.buyer?.name || "BigMart Wholesale"}</h4>
                                        <span className="text-[10px] text-slate-450 font-bold block">{m.req.preferred_location}</span>
                                      </div>
                                      <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 font-black text-xs px-2 py-1 rounded-lg">
                                        ⭐ {m.match_percent}% Match
                                      </div>
                                    </div>
                                    
                                    <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-emerald-600 font-bold">✓</span>
                                        <span>Same Crop: {m.req.crop_name}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={m.breakdown.location_score >= 20 ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>✓</span>
                                        <span>Location: {m.req.preferred_location}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={m.breakdown.quantity_score >= 15 ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>✓</span>
                                        <span>Quantity Suitability: {m.req.required_quantity} {m.req.unit}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className={m.breakdown.price_score >= 10 ? "text-emerald-600 font-bold" : "text-rose-500 font-bold"}>✓</span>
                                        <span>Price Suitability: Max ₹{m.req.max_price}/{m.req.unit}</span>
                                      </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t">
                                      <button 
                                        type="button"
                                        onClick={() => setExpandedMatchId(isExpanded ? null : m.req.id)}
                                        className="text-[10px] text-slate-450 hover:text-emerald-600 font-extrabold flex items-center gap-1"
                                      >
                                        <span>Why this match? / என்ன காரணம்?</span>
                                        <span>{isExpanded ? "▲" : "▼"}</span>
                                      </button>
                                      
                                      {isExpanded && (
                                        <div className="mt-2.5 bg-slate-50 border p-3 rounded-lg text-[10px] text-slate-500 space-y-1 font-mono">
                                          <div className="flex justify-between"><span>Crop Score / பயிர் பொருத்தக் காரணி:</span> <span>{m.breakdown.crop_score}/40</span></div>
                                          <div className="flex justify-between"><span>Location Match / தொலைவுப் காரணி:</span> <span>{m.breakdown.location_score}/25</span></div>
                                          <div className="flex justify-between"><span>Quantity Fit / அளவு காரணி:</span> <span>{m.breakdown.quantity_score}/20</span></div>
                                          <div className="flex justify-between"><span>Price Fit / விலை காரணி:</span> <span>{m.breakdown.price_score}/15</span></div>
                                          <div className="flex justify-between border-t pt-1 font-bold text-slate-700"><span>Total / மொத்தம்:</span> <span>{m.total_score}/100</span></div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="bg-white border rounded-2xl p-16 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[350px]">
                      <Search className="w-12 h-12 text-slate-200 mb-3" />
                      <h4 className="font-extrabold text-slate-800 text-base uppercase tracking-wider">No Crop Listing Selected</h4>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">Select one of your crop harvest listings from the left side to dynamically search for matching buyers and their demands.</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 4. FARMER OFFERS TAB */}
          {currentUser?.role === 'FARMER' && activeTab === 'offers' && (() => {
            const sortedOffers = [...cropOffers].sort((a, b) => b.offered_price_per_unit - a.offered_price_per_unit);
            
            return (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-1.5">
                      <IndianRupee className="w-5 h-5 text-emerald-600" />
                      <span>Received Offers / பெறப்பட்ட சலுகைகள்</span>
                    </h3>
                    <span className="text-slate-500 text-xs font-semibold">{cropOffers.length} offers received</span>
                  </div>

                  {sortedOffers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-6 text-center">No offers received yet from buyers. Your matchings will show up when buyers view your listings.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sortedOffers.map((offer, index) => {
                        const expectedPrice = offer.crop.expected_price;
                        const offeredPrice = offer.offered_price_per_unit;
                        const cropKey = (offer.crop.crop_name || '').toLowerCase().trim();
                        const marketPrice = marketPrices[cropKey] || 22.0;
                        
                        const isBelowMarket = offeredPrice < marketPrice;
                        
                        return (
                          <div 
                            key={offer.id} 
                            className={`border rounded-2xl p-5 bg-white shadow-xs flex flex-col justify-between hover:shadow-md transition relative overflow-hidden ${index === 0 ? 'ring-2 ring-emerald-500/25 border-emerald-300' : 'border-slate-200'}`}
                          >
                            {index === 0 && (
                              <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-xs">
                                🏆 Best Offer / சிறந்த சலுகை
                              </div>
                            )}

                            <div className="space-y-4">
                              <div className="border-b pb-3">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-extrabold text-slate-800 text-sm">{offer.buyer?.name}</h4>
                                  {offer.buyer?.is_verified ? (
                                    <span className="text-emerald-700 text-[8px] font-black bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded uppercase">✓ Verified Buyer</span>
                                  ) : (
                                    <span className="text-slate-400 text-[8px] font-bold bg-slate-50 border px-1 py-0.5 rounded">Buyer</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-450 font-bold mt-0.5">Crop: {offer.crop.crop_name} ({offer.crop.variety}) | Location: {offer.buyer?.location}</div>
                              </div>

                              <div className="bg-slate-50 border rounded-xl p-3.5 space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Offered Price / வழங்கிய விலை:</span>
                                  <span className="font-black text-emerald-700 text-sm">₹{offeredPrice}/{offer.crop.unit}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1.5">
                                  <span className="text-slate-400">Your Expected / உங்கள் எதிர்பார்ப்பு:</span>
                                  <span className="font-bold text-slate-600">₹{expectedPrice}/{offer.crop.unit}</span>
                                </div>
                                <div className="flex justify-between border-t pt-1.5">
                                  <span className="text-slate-400">Market Reference / சந்தை விலை:</span>
                                  <span className="font-bold text-slate-600">₹{marketPrice}/kg</span>
                                </div>
                              </div>

                              {isBelowMarket && (
                                <div className="bg-amber-50 border border-amber-100 text-amber-800 rounded-xl p-3 text-[10px] font-bold flex items-center gap-2">
                                  <span>⚠️ This offer is below the market reference price. / இந்த விலை சந்தை விலையை விட குறைவாக உள்ளது.</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-3 border-t flex flex-col gap-2">
                              {offer.status === 'accepted' || offer.status === 'rejected' ? (
                                <div className="text-center py-2 text-xs font-black uppercase text-slate-400">
                                  Deal {offer.status}
                                </div>
                              ) : (
                                <>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={async () => {
                                        await handleRespondOffer('accepted', null, offer.id);
                                        loadFarmerData();
                                      }}
                                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 rounded-lg text-xs transition shadow-sm"
                                    >
                                      Accept / ஏற்கு
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        await handleRespondOffer('rejected', null, offer.id);
                                        loadFarmerData();
                                      }}
                                      className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold py-2 rounded-lg text-xs transition border border-rose-100"
                                    >
                                      Reject / நிராகரி
                                    </button>
                                  </div>
                                  <button 
                                    onClick={() => handleSelectOffer(offer)}
                                    className="w-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border text-slate-700 font-extrabold py-2.5 rounded-lg text-xs transition text-center shadow-xs"
                                  >
                                    💬 Negotiate / பேரம் பேசு
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 5. BUYER DASHBOARD TAB */}
          {currentUser?.role === 'BUYER' && activeTab === 'buyer' && (() => {
            const matchedCropsCount = marketplaceCrops.filter(crop => myRequirements.some(req => (req.crop_name || '').toLowerCase().trim() === (crop.crop_name || '').toLowerCase().trim())).length;
            const myBidsCount = myOffers.length;
            
            let nextStepText = "";
            let nextStepAction = null;
            let nextStepBtnText = "";
            
            if (myRequirements.length === 0) {
              nextStepText = "Post your first requirement to find agricultural suppliers. / சப்ளையர்களைக் கண்டறிய உங்கள் முதல் தேவையை இடுகையிடவும்.";
              nextStepBtnText = "📋 Post Requirement / தேவை இடுகையிடு";
              nextStepAction = () => { setActiveTab('my-requirements'); setIsCreatingRequirement(true); };
            } else if (matchedCropsCount === 0) {
              nextStepText = "Search the marketplace for active farmer harvest listings. / சந்தையில் விற்பனைக்கு இருக்கும் பயிர்களைத் தேடுங்கள்.";
              nextStepBtnText = "🌾 Find Crops / பயிர்களைத் தேடு";
              nextStepAction = () => setActiveTab('find-crops');
            } else {
              nextStepText = "Submit price offers and negotiate directly with growers. / விவசாயிகளுக்கு விலை சலுகைகளை சமர்ப்பித்து நேரடியாக பேரம் பேசுங்கள்.";
              nextStepBtnText = "🌾 Find Crops / பயிர்களைத் தேடு";
              nextStepAction = () => setActiveTab('find-crops');
            }

            return (
              <div className="space-y-8 max-w-5xl mx-auto">
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                  <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">
                    Welcome, {currentUser?.name} 👋
                  </h1>
                  <p className="text-slate-500 text-sm mt-1 font-semibold">
                    What would you like to do today? / இன்று நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <button 
                      onClick={() => { setActiveTab('my-requirements'); setIsCreatingRequirement(true); }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>📋 Post Requirement / தேவை இடுகையிடு</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('find-crops')}
                      className="bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition text-sm flex items-center justify-center gap-2"
                    >
                      <Search className="w-4 h-4 text-slate-500" />
                      <span>🌾 Find Crops / பயிர்களைத் தேடு</span>
                    </button>
                    <button 
                      onClick={() => setActiveTab('my-offers')}
                      className="bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-6 rounded-xl transition text-sm flex items-center justify-center gap-2"
                    >
                      <IndianRupee className="w-4 h-4 text-slate-500" />
                      <span>💰 My Offers / என் சலுகைகள்</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">My Requirements / என் தேவைகள்</span>
                      <span className="text-4xl font-black text-slate-800">{myRequirements.length}</span>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Available Crops / விற்பனை பயிர்கள்</span>
                      <span className="text-4xl font-black text-slate-800">{marketplaceCrops.length}</span>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-xl">
                      <Sprout className="w-8 h-8" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">My Offers / என் சலுகைகள்</span>
                      <span className="text-4xl font-black text-slate-800">{myBidsCount}</span>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
                      <IndianRupee className="w-8 h-8" />
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h4 className="text-emerald-800 font-extrabold text-sm uppercase tracking-wider">Your Next Step / அடுத்த கட்டம்</h4>
                    <p className="text-slate-600 text-xs font-medium leading-relaxed">{nextStepText}</p>
                  </div>
                  <button 
                    onClick={nextStepAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition shadow-sm whitespace-nowrap"
                  >
                    {nextStepBtnText}
                  </button>
                </div>
              </div>
            );
          })()}

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
