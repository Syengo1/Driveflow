"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Mail, Lock, Loader2, User, CheckCircle2, Chrome } from "lucide-react";
import { supabase } from "@/lib/supabase"; // Use direct client for auth actions
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const router = useRouter();

  // --- HANDLERS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Check Role & Redirect
        // We fetch the profile to see if they are an admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        toast.success("Welcome back!", {
          description: "Signing you in...",
          icon: <CheckCircle2 className="text-green-500" />,
        });

        if (profile?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard'); // or '/' for home
        }

      } else {
        // --- SIGN UP LOGIC ---
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name, // This metadata is used by our SQL trigger
            },
          },
        });

        if (error) throw error;

        toast.success("Account created!", {
          description: "Please check your email to confirm your account.",
          icon: <Mail className="text-blue-500" />,
        });
        
        // Optionally switch to login view or wait for email confirmation
        setIsLogin(true); 
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      toast.error("Authentication Failed", {
        description: error.message || "Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback` // Ensure this route exists
            }
        });
        if (error) throw error;
    } catch (error: any) {
        toast.error("Google Login Failed", { description: error.message });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      
      {/* --- LEFT: FORM SECTION --- */}
      <div className="flex flex-col justify-center px-8 md:px-24 lg:px-32 bg-zinc-950 relative z-20">
        
        {/* Logo */}
        <Link href="/" className="absolute top-8 left-8 md:left-24 flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">DRIVEFLOW</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            {isLogin ? "Welcome Back" : "Join the Club"}
          </h1>
          <p className="text-zinc-400">
            {isLogin 
              ? "Enter your details to access your account." 
              : "Create an account to skip the queue and unlock VIP rates."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
              <Label className="text-zinc-300">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-zinc-500" size={18} />
                <Input 
                  required 
                  placeholder="John Doe" 
                  className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12 focus:ring-yellow-500 focus:border-yellow-500"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-zinc-300">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <Input 
                required 
                type="email" 
                placeholder="name@example.com" 
                className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12 focus:ring-yellow-500 focus:border-yellow-500"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-zinc-300">Password</Label>
              {isLogin && (
                <Link href="/auth/reset-password" className="text-xs text-yellow-500 hover:underline">Forgot password?</Link>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
              <Input 
                required 
                type="password" 
                placeholder="••••••••" 
                className="pl-10 bg-zinc-900 border-zinc-800 text-white h-12 focus:ring-yellow-500 focus:border-yellow-500"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base rounded-xl shadow-lg shadow-yellow-500/20 transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
          </Button>
        </form>

        <div className="my-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-500 uppercase">Or continue with</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="grid grid-cols-1">
          <Button onClick={handleGoogleLogin} variant="outline" className="h-12 border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white">
            <Chrome className="mr-2 h-5 w-5" /> Google
          </Button>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setFormData({ email: "", password: "", name: "" }); }} 
            className="text-yellow-500 hover:underline font-bold outline-none"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>

      {/* --- RIGHT: VISUAL SECTION (Unchanged) --- */}
      {/* Kept existing visual code hidden for brevity, but assume it remains the same as your provided code */}
       <div className="hidden lg:flex flex-col justify-center items-center bg-zinc-900 relative overflow-hidden text-white">
          <img 
            src="https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1920&auto=format&fit=crop" 
            alt="Car" 
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <div className="relative z-10 text-center px-12">
             <h2 className="text-5xl font-black mb-6">Drive Your Ambition.</h2>
             <p className="text-xl text-zinc-300">Join thousands of premium members accessing the world's finest fleet.</p>
          </div>
       </div>

    </div>
  );
}