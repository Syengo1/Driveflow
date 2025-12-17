"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  isVerified?: boolean; // For your KYC logic
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Fetch Profile Helper
  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUser({
          id: data.id,
          email: email,
          name: data.full_name || "User",
          role: data.role || 'user',
          isVerified: true // You can map this to a DB column later
        });
      }
    } catch (error) {
      console.error("Profile Fetch Error", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Initialize Auth State
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchProfile(session.user.id, session.user.email!);
      } else {
        setLoading(false);
      }

      // Listen for changes (Login/Logout)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchProfile(session.user.id, session.user.email!);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          router.push('/auth/login');
        }
      });

      return () => subscription.unsubscribe();
    };

    initAuth();
  }, []);

  // 3. Actions
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error("Login Failed", { description: error.message });
      setLoading(false);
    } else {
      toast.success("Welcome Back");
      router.refresh();
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.info("Signed out");
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin: user?.role === 'admin', 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};