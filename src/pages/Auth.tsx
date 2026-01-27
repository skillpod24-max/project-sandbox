import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Car, Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const dataToValidate = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;
      
      authSchema.parse(dataToValidate);

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        // Check if user is marketplace admin
        const { data: adminData } = await supabase
          .from("marketplace_admins")
          .select("*")
          .eq("user_id", data.user?.id)
          .single();

        if (adminData) {
          // Redirect admin to admin dashboard
          toast({
            title: "Welcome Admin!",
            description: "Redirecting to admin dashboard.",
          });
          navigate("/admin/marketplace");
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: formData.full_name,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Scenic Brand Panel - 70% */}
      <div className="hidden lg:flex lg:w-[70%] items-center justify-center relative overflow-hidden bg-sky-200">

        {/* SVG Scenic Background */}
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full"
        >
          {/* Sky */}
          <rect width="1440" height="900" fill="#87CEEB" />

          {/* Sun */}
          <circle cx="1200" cy="140" r="60" fill="#FFD93D" />

          {/* Clouds */}
          <g fill="#ffffff" opacity="0.8">
            <ellipse cx="300" cy="150" rx="60" ry="25" />
            <ellipse cx="340" cy="150" rx="40" ry="20" />
            <ellipse cx="280" cy="150" rx="40" ry="20" />

            <ellipse cx="700" cy="120" rx="70" ry="28" />
            <ellipse cx="740" cy="120" rx="45" ry="22" />
            <ellipse cx="670" cy="120" rx="45" ry="22" />
          </g>

          {/* Hills */}
          <path d="M0 520 Q 300 420 600 520 T 1200 520 T 1440 520 V900 H0 Z" fill="#7EC850" />
          <path d="M0 600 Q 360 500 720 600 T 1440 600 V900 H0 Z" fill="#5BAF4A" />

          {/* Trees */}
          <g>
            <rect x="180" y="460" width="16" height="60" fill="#5B3A29" />
            <circle cx="188" cy="440" r="30" fill="#2E8B57" />

            <rect x="980" y="470" width="16" height="60" fill="#5B3A29" />
            <circle cx="988" cy="450" r="30" fill="#2E8B57" />
          </g>

          {/* Road */}
          <rect y="640" width="1440" height="120" fill="#2E2E2E" />
          <line
            x1="0"
            y1="700"
            x2="1440"
            y2="700"
            stroke="#ffffff"
            strokeWidth="6"
            strokeDasharray="30 20"
          />

          {/* Moving Car */}
          <g className="car-animation">
            <rect x="0" y="600" width="90" height="30" rx="8" fill="#111827" />
            <rect x="20" y="580" width="50" height="30" rx="6" fill="#1F2937" />
            <circle cx="25" cy="635" r="8" fill="#000" />
            <circle cx="65" cy="635" r="8" fill="#000" />
          </g>
        </svg>

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-black/40" />

        {/* TEXT CONTENT (UNCHANGED) */}
        <div className="relative z-10 text-center text-white max-w-2xl px-12">
          <div className="flex items-center justify-center mb-8">
            <Car className="h-20 w-20" />
          </div>

          <h1 className="text-6xl font-bold mb-6">VahanHub</h1>

          <p className="text-2xl font-light mb-4">
            Vehicle Dealer Management System
          </p>

          <p className="text-lg opacity-90">
            Complete solution for managing your vehicle dealership - inventory, sales,
            purchases, and more
          </p>

          <div className="mt-12 grid grid-cols-3 gap-8 text-sm">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-2">360°</div>
              <div>Complete Management</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-2">EMI</div>
              <div>Payment Tracking</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div>Document Management</div>
            </div>
          </div>
        </div>
      </div>


      {/* Right Form Panel - 30% */}
      <div className="w-full lg:w-[30%] flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <Car className="h-12 w-12 text-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Welcome Back
            </h2>

            <p className="text-muted-foreground">
              Sign in to your account
            </p>

          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>

              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />

                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="pl-10 pr-10"
                  required
                />

                {/* Eye Toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>


            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account? <br />
              <span className="font-medium text-foreground">
                Please contact your system administrator.
              </span>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
