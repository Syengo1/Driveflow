"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShieldCheck, Mail, Lock, Phone, User, Loader2, 
  Chrome, Eye, EyeOff 
} from "lucide-react";
import { supabase } from "@/lib/supabase"; // FIX: Use Supabase directly
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // --- PASSWORD VISIBILITY STATE ---
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  // --- LOGIC: PASSWORD STRENGTH ---
  const getStrength = (pass: string) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 7) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  
  const strength = getStrength(formData.password);

  const handleNameChange = (val: string) => {
    const formatted = val.replace(/\b\w/g, c => c.toUpperCase());
    setFormData(prev => ({ ...prev, name: formatted }));
  };

  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/[^0-9+]/g, '');
    if (clean.startsWith('07') || clean.startsWith('01')) {
      clean = '+254' + clean.substring(1);
    }
    setFormData(prev => ({ ...prev, phone: clean }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (strength < 2) {
        toast.error("Weak Password", { description: "Please use a stronger password with numbers or symbols." });
        return;
    }

    setIsLoading(true);

    try {
        // 1. Sign Up Logic
        const { data, error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.name, // Used by DB Trigger to create profile
                    phone: formData.phone
                }
            }
        });

        if (error) throw error;

        // 2. Success Handler
        toast.success("Account Created!", {
            description: "Please check your email to verify your account.",
        });
        
        // 3. Redirect to Sign In
        router.push("/auth/signin");

    } catch (error: any) {
        console.error("Signup Error:", error);
        toast.error("Signup Failed", { 
            description: error.message || "Could not create account. Please try again." 
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
                redirectTo: `${window.location.origin}/auth/callback`
            }
        });
        if (error) throw error;
    } catch (error: any) {
        toast.error("Google Login Failed", { description: error.message });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-zinc-950 text-white">
      
      {/* --- LEFT: VISUAL SECTION --- */}
      <div className="hidden lg:flex flex-col justify-between relative overflow-hidden p-12 text-white">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=1920&auto=format&fit=crop" 
            alt="Luxury Interior" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        </div>

        <Link href="/" className="relative z-10 flex items-center gap-2 group w-fit">
          <div className="w-8 h-8 rounded-lg bg-yellow-500 flex items-center justify-center text-black shadow-sm group-hover:scale-105 transition-transform">
            <ShieldCheck size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">DRIVEFLOW</span>
        </Link>

        <div className="relative z-10 max-w-md">
           <h2 className="text-3xl font-black mb-4 leading-tight">
             "The ultimate way to explore Kenya. The fleet is impeccable."
           </h2>
           <div className="flex gap-1 mb-4">
             {[1,2,3,4,5].map(i => (
               <svg key={i} className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 20 20">
                 <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
               </svg>
             ))}
           </div>
           <p className="font-bold">Sarah Jenkins</p>
           <p className="text-zinc-400 text-sm">Travel Photographer</p>
        </div>
      </div>

      {/* --- RIGHT: FORM SECTION --- */}
      <div className="flex flex-col justify-center px-8 md:px-24 lg:px-32 py-12 overflow-y-auto custom-scrollbar">
        
        {/* Mobile Logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <ShieldCheck className="text-yellow-500" size={24} />
            <span className="font-bold text-xl">DRIVEFLOW</span>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-zinc-400">
            Join today and get <span className="text-yellow-500 font-bold">10% off</span> your first booking.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase font-bold">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <Input 
                    required 
                    placeholder="John Doe" 
                    className="pl-10 bg-black border-zinc-800 h-11 focus:ring-yellow-500 text-white"
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                  />
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase font-bold">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <Input 
                    required 
                    placeholder="+254..." 
                    className="pl-10 bg-black border-zinc-800 h-11 font-mono focus:ring-yellow-500 text-white"
                    value={formData.phone}
                    onChange={e => handlePhoneChange(e.target.value)}
                  />
                </div>
             </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label className="text-zinc-400 text-xs uppercase font-bold">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-zinc-500" size={18} />
              <Input 
                required 
                type="email"
                placeholder="john@example.com" 
                className="pl-10 bg-black border-zinc-800 h-11 focus:ring-yellow-500 text-white"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          {/* Password Section */}
          <div className="space-y-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl">
             
             {/* Password Field */}
             <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase font-bold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <Input 
                    required 
                    type={showPass ? "text" : "password"} // Toggle Type
                    placeholder="••••••••" 
                    className="pl-10 pr-10 bg-black border-zinc-800 h-11 focus:ring-yellow-500 text-white"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                  {/* Toggle Button */}
                  <button 
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {/* Strength Meter */}
                <div className="flex gap-1 h-1 mt-2">
                   <div className={cn("flex-1 rounded-full transition-colors", strength > 0 ? "bg-red-500" : "bg-zinc-800")} />
                   <div className={cn("flex-1 rounded-full transition-colors", strength > 1 ? "bg-orange-500" : "bg-zinc-800")} />
                   <div className={cn("flex-1 rounded-full transition-colors", strength > 2 ? "bg-yellow-500" : "bg-zinc-800")} />
                   <div className={cn("flex-1 rounded-full transition-colors", strength > 3 ? "bg-green-500" : "bg-zinc-800")} />
                </div>
             </div>

             {/* Confirm Password Field */}
             <div className="space-y-2">
                <Label className="text-zinc-400 text-xs uppercase font-bold">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-zinc-500" size={18} />
                  <Input 
                    required 
                    type={showConfirmPass ? "text" : "password"} // Toggle Type
                    placeholder="••••••••" 
                    className={cn(
                       "pl-10 pr-10 bg-black border-zinc-800 h-11 focus:ring-yellow-500 text-white",
                       formData.confirmPassword && formData.password !== formData.confirmPassword ? "border-red-500/50" : ""
                    )}
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  />
                  {/* Toggle Button */}
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-3 text-zinc-500 hover:text-white transition-colors"
                  >
                    {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
             </div>
          </div>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base rounded-xl shadow-lg shadow-yellow-500/20 transition-all hover:scale-[1.01]"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Create Account"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span></div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGoogleLogin} // Added Google Handler
            className="w-full h-12 border-zinc-800 bg-black text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            <Chrome className="mr-2 h-5 w-5" /> Google
          </Button>

        </form>

        <p className="mt-8 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-yellow-500 hover:underline font-bold">
            Sign In
          </Link>
        </p>

      </div>

    </div>
  );
}