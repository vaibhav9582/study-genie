import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Upload, FileText, LogOut, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface PDF {
  id: string;
  file_name: string;
  file_size: number;
  upload_status: string;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check auth and get user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadPDFs(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadPDFs(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadPDFs = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("uploaded_pdfs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPdfs(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading PDFs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const deletePDF = async (pdfId: string) => {
    try {
      const { error } = await supabase
        .from("uploaded_pdfs")
        .delete()
        .eq("id", pdfId);

      if (error) throw error;

      setPdfs(pdfs.filter((pdf) => pdf.id !== pdfId));
      toast({
        title: "PDF deleted",
        description: "Your file has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StudyGenie
            </h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.full_name || "Student"}!
          </h2>
          <p className="text-muted-foreground">
            Upload a new PDF or continue working on your study materials
          </p>
        </div>

        {/* Upload Button */}
        <Button
          size="lg"
          className="mb-8 bg-gradient-primary hover:opacity-90 shadow-glow"
          onClick={() => navigate("/upload")}
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload New PDF
        </Button>

        {/* Recent PDFs */}
        <div>
          <h3 className="text-2xl font-semibold mb-4">Your Study Materials</h3>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : pdfs.length === 0 ? (
            <Card className="bg-gradient-card">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-muted-foreground mb-4">
                  No PDFs uploaded yet
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/upload")}
                >
                  Upload Your First PDF
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfs.map((pdf) => (
                <Card key={pdf.id} className="hover:shadow-lg transition-all bg-gradient-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-primary" />
                      {pdf.file_name}
                    </CardTitle>
                    <CardDescription>
                      {formatFileSize(pdf.file_size)} • {new Date(pdf.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-2">
                    <Button
                      className="flex-1 bg-gradient-primary hover:opacity-90"
                      onClick={() => navigate(`/output/${pdf.id}`)}
                    >
                      View Results
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => deletePDF(pdf.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;