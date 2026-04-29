import { useState } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { Bounce, toast } from "react-toastify";

export default function Signup() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111b21] px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#202c33] p-6 md:p-8 rounded-xl w-full max-w-sm shadow-lg"
      >
        <h2 className="text-white text-xl mb-4 text-center font-semibold">
          Create Account
        </h2>

        <input
          placeholder="Username"
          className="w-full mb-3 p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />

        <input
          placeholder="Email"
          type="email"
          className="w-full mb-3 p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm"
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          placeholder="Phone Number"
          type="tel"
          className="w-full mb-3 p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm"
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 p-3 bg-[#2a3942] text-white rounded outline-none placeholder-[#8696a0] text-sm"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          disabled={loading}
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