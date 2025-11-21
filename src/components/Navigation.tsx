import { useNavigate, useLocation } from "react-router-dom";
import { Brain, Home, Upload, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { UserMenu } from "./UserMenu";

export const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b-2 border-border bg-background/95 backdrop-blur shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              StudyGenie
            </h1>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={isActive("/dashboard") ? "default" : "ghost"}
                onClick={() => navigate("/dashboard")}
                className="font-semibold"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={isActive("/upload") ? "default" : "ghost"}
                onClick={() => navigate("/upload")}
                className="font-semibold"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="font-semibold"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="font-semibold border-2"
              >
                Login
              </Button>
            </>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
    </nav>
  );
};
