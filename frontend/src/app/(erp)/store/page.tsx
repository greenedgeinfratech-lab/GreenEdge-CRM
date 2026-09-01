'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/providers/ToastProvider';
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  Upload,
  Plus,
  Store,
  Package,
  CreditCard,
  Rocket,
  X,
} from 'lucide-react';

interface StoreData {
  companyName: string;
  tagline: string;
  description: string;
  gstNumber: string;
  logo: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  productCategories: string[];
  defaultTaxRate: number;
  defaultCgst: number;
  defaultSgst: number;
  catalogNote: string;
  paymentMethods: string[];
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  upiId: string;
  shippingMethods: string[];
  freeShippingAbove: number;
  defaultShippingCharge: number;
  launchReady: boolean;
}

const STEPS = [
  { label: 'Basic Info', icon: Store },
  { label: 'Products & Catalog', icon: Package },
  { label: 'Payment & Shipping', icon: CreditCard },
  { label: 'Launch', icon: Rocket },
];

const DEFAULT_DATA: StoreData = {
  companyName: '',
  tagline: '',
  description: '',
  gstNumber: '',
  logo: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  website: '',
  productCategories: [],
  defaultTaxRate: 18,
  defaultCgst: 9,
  defaultSgst: 9,
  catalogNote: '',
  paymentMethods: [],
  bankName: '',
  bankAccount: '',
  bankIfsc: '',
  upiId: '',
  shippingMethods: [],
  freeShippingAbove: 0,
  defaultShippingCharge: 0,
  launchReady: false,
};

const PAYMENT_OPTIONS = [
  'Bank Transfer',
  'UPI',
  'Cash',
  'Cheque',
  'Credit Card',
  'Debit Card',
  'Wallet',
  'COD',
];

const SHIPPING_OPTIONS = [
  'Self Pickup',
  'Courier',
  'Transport',
  'Speed Post',
  'DTDC',
  'Blue Dart',
];

export default function StorePage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<StoreData>(DEFAULT_DATA);
  const [newCategory, setNewCategory] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('store_setup_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('store_setup_data', JSON.stringify(data));
    }
  }, [data, mounted]);

  const update = (patch: Partial<StoreData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  };

  const saveAndNext = () => {
    showToast('Progress saved', 'success');
    if (currentStep < 3) setCurrentStep((s) => s + 1);
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const saveHeader = () => {
    showToast('Saved successfully', 'success');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      update({ logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    update({ logo: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addCategory = () => {
    const cat = newCategory.trim();
    if (cat && !data.productCategories.includes(cat)) {
      update({ productCategories: [...data.productCategories, cat] });
      setNewCategory('');
    }
  };

  const removeCategory = (cat: string) => {
    update({ productCategories: data.productCategories.filter((c) => c !== cat) });
  };

  const togglePayment = (method: string) => {
    const exists = data.paymentMethods.includes(method);
    update({
      paymentMethods: exists
        ? data.paymentMethods.filter((m) => m !== method)
        : [...data.paymentMethods, method],
    });
  };

  const toggleShipping = (method: string) => {
    const exists = data.shippingMethods.includes(method);
    update({
      shippingMethods: exists
        ? data.shippingMethods.filter((m) => m !== method)
        : [...data.shippingMethods, method],
    });
  };

  const handleTaxRateChange = (val: number) => {
    const cgst = parseFloat((val / 2).toFixed(2));
    const sgst = parseFloat((val / 2).toFixed(2));
    update({ defaultTaxRate: val, defaultCgst: cgst, defaultSgst: sgst });
  };

  const completionPct = () => {
    let filled = 0;
    let total = 0;

    const strFields: (keyof StoreData)[] = [
      'companyName', 'tagline', 'description', 'gstNumber', 'logo',
      'address', 'city', 'state', 'pincode', 'phone', 'email', 'website',
      'bankName', 'bankAccount', 'bankIfsc', 'upiId', 'catalogNote',
    ];
    strFields.forEach((f) => {
      total++;
      if ((data[f] as string) !== '') filled++;
    });

    total += 2;
    if (data.productCategories.length > 0) filled++;
    if (data.paymentMethods.length > 0) filled++;
    if (data.shippingMethods.length > 0) filled++;
    if (data.launchReady) filled++;
    total += 2;

    return Math.round((filled / total) * 100);
  };

  const handleLaunchSave = () => {
    if (!data.launchReady) {
      showToast('Please mark as ready to launch', 'error');
      return;
    }
    showToast('Store setup launched successfully!', 'success');
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <Store className="w-6 h-6 text-[#c85a17]" />
          <span className="text-xl font-semibold text-gray-800">Store Setup</span>
        </div>
        <button
          onClick={saveHeader}
          className="flex items-center gap-2 px-4 py-2 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Setup Progress</span>
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of 4 &mdash; {completionPct()}% complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-[#c85a17] h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Navigation Buttons */}
      <div className="flex flex-wrap gap-2">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <button
              key={step.label}
              onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                i === currentStep
                  ? 'bg-[#162032] text-white'
                  : i < currentStep
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {i < currentStep ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span>{i + 1}. {step.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-white border rounded-lg p-6">
        {/* Step 0: Basic Info */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.companyName}
                  onChange={(e) => update({ companyName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={data.tagline}
                  onChange={(e) => update({ tagline: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Your business tagline"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={data.description}
                  onChange={(e) => update({ description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Describe your business..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={data.gstNumber}
                  onChange={(e) => update({ gstNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="e.g. 22AAAAA0000A1Z5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => update({ email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="business@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={data.website}
                  onChange={(e) => update({ website: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={data.address}
                  onChange={(e) => update({ address: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Business address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => update({ city: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={data.state}
                  onChange={(e) => update({ state: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  type="text"
                  value={data.pincode}
                  onChange={(e) => update({ pincode: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Pincode"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {data.logo ? (
                  <div className="relative inline-block">
                    <img
                      src={data.logo}
                      alt="Logo preview"
                      className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 text-sm hover:border-[#c85a17] hover:text-[#c85a17] transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Logo
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={saveAndNext}
                disabled={!data.companyName}
                className="flex items-center gap-2 px-6 py-2 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Products & Catalog */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Products & Catalog</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Categories</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {data.productCategories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                  >
                    {cat}
                    <button
                      onClick={() => removeCategory(cat)}
                      className="hover:text-orange-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="Add a product category..."
                />
                <button
                  onClick={addCategory}
                  className="flex items-center gap-1 px-4 py-2 bg-[#c85a17] text-white rounded-lg text-sm font-medium hover:bg-[#b04a10] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Tax Settings</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Default Tax Rate (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={data.defaultTaxRate}
                    onChange={(e) => handleTaxRateChange(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CGST (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={data.defaultCgst}
                    onChange={(e) => update({ defaultCgst: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">SGST (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={data.defaultSgst}
                    onChange={(e) => update({ defaultSgst: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catalog Notes</label>
              <textarea
                value={data.catalogNote}
                onChange={(e) => update({ catalogNote: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                placeholder="Additional notes for your product catalog..."
              />
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={saveAndNext}
                className="flex items-center gap-2 px-6 py-2 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
              >
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment & Shipping */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Payment & Shipping</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Methods</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((method) => {
                  const active = data.paymentMethods.includes(method);
                  return (
                    <button
                      key={method}
                      onClick={() => togglePayment(method)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-green-100 border-green-400 text-green-800'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {active && <Check className="inline w-3 h-3 mr-1" />}
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Bank Details</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={data.bankName}
                    onChange={(e) => update({ bankName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                    placeholder="Bank name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={data.bankAccount}
                    onChange={(e) => update({ bankAccount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={data.bankIfsc}
                    onChange={(e) => update({ bankIfsc: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                    placeholder="IFSC code"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={data.upiId}
                    onChange={(e) => update({ upiId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                    placeholder="UPI ID"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Methods</label>
              <div className="flex flex-wrap gap-2">
                {SHIPPING_OPTIONS.map((method) => {
                  const active = data.shippingMethods.includes(method);
                  return (
                    <button
                      key={method}
                      onClick={() => toggleShipping(method)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {active && <Check className="inline w-3 h-3 mr-1" />}
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Free Shipping Above (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={data.freeShippingAbove || ''}
                  onChange={(e) => update({ freeShippingAbove: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Default Shipping Charge (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={data.defaultShippingCharge || ''}
                  onChange={(e) => update({ defaultShippingCharge: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c85a17] transition-colors"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={saveAndNext}
                className="flex items-center gap-2 px-6 py-2 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
              >
                Save & Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Launch */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Launch Your Store</h2>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              {/* Company Info */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Company Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Company Name</span>
                    <p className="text-gray-800 font-medium">{data.companyName || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Tagline</span>
                    <p className="text-gray-800">{data.tagline || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">GSTIN</span>
                    <p className="text-gray-800">{data.gstNumber || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Phone</span>
                    <p className="text-gray-800">{data.phone || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Email</span>
                    <p className="text-gray-800">{data.email || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Website</span>
                    <p className="text-gray-800">{data.website || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-500 text-xs">Address</span>
                    <p className="text-gray-800">
                      {[data.address, data.city, data.state, data.pincode].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                  {data.logo && (
                    <div>
                      <span className="text-gray-500 text-xs">Logo</span>
                      <div className="mt-1">
                        <img src={data.logo} alt="Logo" className="w-16 h-16 object-cover rounded border border-gray-200" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-gray-200 mb-6" />

              {/* Product Setup */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Product Setup</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="md:col-span-2">
                    <span className="text-gray-500 text-xs">Categories</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.productCategories.length > 0 ? (
                        data.productCategories.map((cat) => (
                          <span key={cat} className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-xs font-medium">
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Tax Rate</span>
                    <p className="text-gray-800">{data.defaultTaxRate}% (CGST {data.defaultCgst}% / SGST {data.defaultSgst}%)</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Catalog Notes</span>
                    <p className="text-gray-800">{data.catalogNote || '—'}</p>
                  </div>
                </div>
              </div>

              <hr className="border-gray-200 mb-6" />

              {/* Payment & Shipping */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Payment &amp; Shipping</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="md:col-span-2">
                    <span className="text-gray-500 text-xs">Payment Methods</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.paymentMethods.length > 0 ? (
                        data.paymentMethods.map((m) => (
                          <span key={m} className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">{m}</span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Bank</span>
                    <p className="text-gray-800">{[data.bankName, data.bankAccount, data.bankIfsc].filter(Boolean).join(' / ') || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">UPI</span>
                    <p className="text-gray-800">{data.upiId || '—'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-500 text-xs">Shipping Methods</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.shippingMethods.length > 0 ? (
                        data.shippingMethods.map((m) => (
                          <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">{m}</span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Free Shipping Above</span>
                    <p className="text-gray-800">{data.freeShippingAbove > 0 ? `₹${data.freeShippingAbove.toLocaleString('en-IN')}` : '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Default Shipping Charge</span>
                    <p className="text-gray-800">{data.defaultShippingCharge > 0 ? `₹${data.defaultShippingCharge.toLocaleString('en-IN')}` : '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={data.launchReady}
                  onChange={(e) => update({ launchReady: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-[#c85a17] focus:ring-[#c85a17] cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">I have reviewed all settings and am ready to launch my store</span>
              </label>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={goBack}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                onClick={handleLaunchSave}
                className="flex items-center gap-2 px-6 py-2 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
              >
                <Rocket className="w-4 h-4" />
                Save & Launch
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
