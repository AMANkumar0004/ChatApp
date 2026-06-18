import { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Bounce, toast } from "react-toastify";

interface FieldStatus {
  checking: boolean;
  available: boolean | null;
}

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Record<string, FieldStatus>>({
    username: { checking: false, available: null },
    email: { checking: false, available: null },
    phone: { checking: false, available: null },
  });

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const navigate = useNavigate();

  // ✅ Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceRefs.current).forEach(clearTimeout);
    };
  }, []);

  const checkAvailability = (field: string, value: string) => {
    if (debounceRefs.current[field]) {
      clearTimeout(debounceRefs.current[field]);
    }

    if (!value.trim()) {
      setStatus(prev => ({ ...prev, [field]: { checking: false, available: null } }));
      return;
    }

    setStatus(prev => ({ ...prev, [field]: { checking: true, available: null } }));

    debounceRefs.current[field] = setTimeout(async () => {
      try {
        const res = await api.post("/auth/check-availability", { field, value });
        setStatus(prev => ({
          ...prev,
          [field]: { checking: false, available: res.data.available },
        }));
      } catch {
        setStatus(prev => ({ ...prev, [field]: { checking: false, available: null } }));
      }
    }, 500);
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (["email", "username", "phone"].includes(field)) {
      checkAvailability(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const unavailable = Object.entries(status).find(([, s]) => s.available === false);
    if (unavailable) {
      toast.error(`${unavailable[0]} is already taken`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/signup", form);
      localStorage.setItem("token", res.data.token);
      toast.success(`${res.data.success}!! welcome ${res.data.user.username}`, {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        theme: "dark",
        transition: Bounce,
      });
      setTimeout(() => navigate("/chat"), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  //  Status icon shown inside/beside input
  const StatusIcon = ({ field }: { field: string }) => {
    const s = status[field];
    const value = form[field as keyof typeof form];
    if (!value) return null;
    if (s.checking) return (
      <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
        style={{ borderColor: "#8696a0", borderTopColor: "transparent" }}
      />
    );
    if (s.available === true) return (
      <span className="text-xs flex-shrink-0" style={{ color: "#25d366" }}>✓</span>
    );
    if (s.available === false) return (
      <span className="text-xs flex-shrink-0" style={{ color: "#ef4444" }}>✗</span>
    );
    return null;
  };

  //  Message shown below input
  const StatusMessage = ({ field }: { field: string }) => {
    const s = status[field];
    const value = form[field as keyof typeof form];
    if (!value || s.checking || s.available === null) return null;
    return (
      <p className="text-xs mt-1 mb-2"
        style={{ color: s.available ? "#25d366" : "#ef4444" }}
      >
        {s.available
          ? `${field.charAt(0).toUpperCase() + field.slice(1)} is available`
          : `This ${field} is already taken`}
      </p>
    );
  };

  // Border color based on status
  const getBorderClass = (field: string) => {
    const s = status[field];
    if (s.available === true) return "outline outline-1 outline-[#25d366]";
    if (s.available === false) return "outline outline-1 outline-red-500";
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111b21] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#202c33] p-6 md:p-8 rounded-xl w-full max-w-sm shadow-lg"
      >
        <h2 className="text-white text-xl mb-4 text-center font-semibold">
          Create Account
        </h2>

        {/* Username */}
        <div className="relative flex items-center mb-0">
          <input
            placeholder="Username"
            className={`w-full p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm pr-8 ${getBorderClass("username")}`}
            onChange={(e) => handleChange("username", e.target.value)}
          />
          <div className="absolute right-3">
            <StatusIcon field="username" />
          </div>
        </div>
        <StatusMessage field="username" />
        {!status.username.available && status.username.available !== false && (
          <div className="mb-3" />
        )}

        {/* Email */}
        <div className="relative flex items-center mb-0">
          <input
            placeholder="Email"
            type="email"
            className={`w-full p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm pr-8 ${getBorderClass("email")}`}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <div className="absolute right-3">
            <StatusIcon field="email" />
          </div>
        </div>
        <StatusMessage field="email" />
        {!status.email.available && status.email.available !== false && (
          <div className="mb-3" />
        )}

        {/* Phone */}
        <div className="relative flex items-center mb-0">
          <input
            placeholder="Phone Number"
            type="tel"
            className={`w-full p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm pr-8 ${getBorderClass("phone")}`}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
          <div className="absolute right-3">
            <StatusIcon field="phone" />
          </div>
        </div>
        <StatusMessage field="phone" />
        {!status.phone.available && status.phone.available !== false && (
          <div className="mb-3" />
        )}

        {/* Password — no availability check needed */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm"
          onChange={(e) => handleChange("password", e.target.value)}
        />

        <button
          disabled={loading || Object.values(status).some(s => s.available === false)}
          className="w-full bg-[#00a884] p-3 rounded text-white font-semibold disabled:opacity-50 hover:bg-[#009070] transition"
        >
          {loading ? "Creating account..." : "Signup"}
        </button>

        <p className="text-gray-400 text-sm mt-3 text-center">
          Already have an account?{" "}
          <Link to="/" className="text-[#00a884]">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}