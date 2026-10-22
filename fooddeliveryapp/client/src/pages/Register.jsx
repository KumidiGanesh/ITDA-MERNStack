import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email || !form.password) {
      toast.error("Name, email, and password are required.");
      return;
    }

    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created successfully!");
      navigate("/", { replace: true });
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Unable to create your account.");
    }
  };

  return (
    <section className="auth-section">
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <p className="eyebrow">Food Delivery Mini App</p>
        <h1>Create your account</h1>
        <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <button type="submit">Register</button>
        <p>Already registered? <Link to="/login">Login</Link></p>
      </form>
    </section>
  );
}

export default Register;
