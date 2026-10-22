import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await login(form);
      localStorage.setItem("token", response.token);
      setUser(response.user);
      navigate(location.state?.from || "/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to log in.");
    }
  };

  return <AuthForm title="Welcome back" submitLabel="Login" form={form} setForm={setForm} error={error} onSubmit={handleSubmit} footer={<p>New here? <Link to="/register">Create an account</Link></p>} />;
}

function AuthForm({ title, submitLabel, form, setForm, error, onSubmit, footer }) {
  return (
    <section className="auth-section">
      <form className="auth-form" onSubmit={onSubmit}>
        <p className="eyebrow">Food Delivery Mini App</p><h1>{title}</h1>
        {form.name !== undefined && <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}
        <label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Password<input type="password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        {error && <p className="error-message">{error}</p>}<button type="submit">{submitLabel}</button>{footer}
      </form>
    </section>
  );
}

export { AuthForm };
export default LoginPage;
