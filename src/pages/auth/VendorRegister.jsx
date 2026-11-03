import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerVendor } from "../../api/authApi";

const VendorRegister = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    // Full Name Validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Minimum 3 characters required";
    }

    // Phone Validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Enter valid 10-digit mobile number";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // remove error while typing
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await registerVendor(formData);

      if (response?.Status) {
        toast.success("Registration successful! OTP password sent via SMS.");

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } else {
        toast.error(response?.Message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5F0] relative overflow-hidden px-4">
      {/* Background Decorative Shapes */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />

      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-300 rounded-full blur-3xl opacity-20 translate-x-1/3 translate-y-1/3" />

      {/* Register Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-100 p-8 relative z-10">
        {/* Logo / Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#F47C20] flex items-center justify-center shadow-lg mb-4">
            <span className="text-white text-2xl font-bold">GC</span>
          </div>

          <h1 className="text-3xl font-bold text-[#1E293B]">
            Vendor Registration
          </h1>

          <p className="text-sm text-slate-500 mt-2 text-center">
            Create your vendor account to continue
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter full name"
              className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-orange-300 ${
                errors.fullName ? "border-red-400" : "border-slate-200"
              }`}
            />

            {errors.fullName && (
              <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              className={`w-full px-4 py-3 rounded-xl border bg-white outline-none transition-all duration-200 focus:ring-2 focus:ring-orange-300 ${
                errors.phone ? "border-red-400" : "border-slate-200"
              }`}
            />

            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47C20] hover:bg-[#e56f12] text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-orange-300/40 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Already have credentials?{" "}
          <Link
            to="/login"
            className="text-[#F47C20] font-semibold hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VendorRegister;
