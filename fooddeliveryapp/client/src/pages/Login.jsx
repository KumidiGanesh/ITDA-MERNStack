import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Email and password are required.");
      return;
    }

    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate(location.state?.from || "/", { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to log in.");
    }
  };

  return (
    <section className="auth-section">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Food Delivery Mini App</p>
        <h1>Welcome back</h1>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <button type="submit">Login</button>
        <p>New here? <Link to="/register">Create an account</Link></p>
      </form>
    </section>
  );
}

export default Login;
