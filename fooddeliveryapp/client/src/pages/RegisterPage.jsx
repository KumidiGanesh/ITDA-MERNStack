import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { AuthForm } from "./LoginPage";

function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await register(form);
      localStorage.setItem("token", response.token);
      setUser(response.user);
      navigate("/");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to create your account.");
    }
  };

  return <AuthForm title="Create your account" submitLabel="Register" form={form} setForm={setForm} error={error} onSubmit={handleSubmit} footer={<p>Already registered? <Link to="/login">Login</Link></p>} />;
}

export default RegisterPage;
