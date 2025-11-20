import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Upload, FileText, LogOut, Trash2, TrendingUp, BookOpen, Zap, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface PDF {
  id: string;
  file_name: string;
  file_size: number;
  upload_status: string;
  created_at: string;
}

interface Analytics {
  totalPDFs: number;
  totalOutputs: number;
  thisWeekPDFs: number;
  recentActivity: Array<{
    type: string;
    fileName: string;
    date: string;
  }>;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalPDFs: 0,
    totalOutputs: 0,
    thisWeekPDFs: 0,
    recentActivity: []
  });
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
      
      // Load analytics
      await loadAnalytics(userId, data || []);
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

  const loadAnalytics = async (userId: string, pdfData: PDF[]) => {
    try {
      // Get AI outputs count
      const { data: outputsData, error: outputsError } = await supabase
        .from("ai_outputs")
        .select("id")
        .eq("user_id", userId);

      if (outputsError) throw outputsError;

      // Calculate this week's uploads
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekPDFs = pdfData.filter(
        pdf => new Date(pdf.created_at) >= oneWeekAgo
      ).length;

      // Get recent activity
      const recentActivity = pdfData.slice(0, 5).map(pdf => ({
        type: "upload",
        fileName: pdf.file_name,
        date: new Date(pdf.created_at).toLocaleDateString()
      }));

      setAnalytics({
        totalPDFs: pdfData.length,
        totalOutputs: outputsData?.length || 0,
        thisWeekPDFs,
        recentActivity
      });
    } catch (error) {
      console.error("Error loading analytics:", error);
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
      <nav className="border-b-2 border-border bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md">
              <Brain className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-extrabold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              StudyGenie
            </h1>
          </div>
          <Button variant="outline" onClick={handleLogout} className="font-semibold border-2">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
            Welcome back, {user?.user_metadata?.full_name || "Student"}! 👋
          </h2>
          <p className="text-xl text-muted-foreground">
            Here's your learning dashboard and analytics
          </p>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total PDFs
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{analytics.totalPDFs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Documents uploaded
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Study Materials
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{analytics.totalOutputs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI outputs generated
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Week
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">{analytics.thisWeekPDFs}</div>
              <p className="text-xs text-muted-foreground mt-1">
                PDFs uploaded this week
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-all duration-300 bg-gradient-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Generation
              </CardTitle>
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold">~30s</div>
              <p className="text-xs text-muted-foreground mt-1">
                AI processing time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card className="border-2 bg-gradient-card">
              <CardHeader>
                <CardTitle className="text-2xl">Quick Actions</CardTitle>
                <CardDescription>Start your learning journey</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  onClick={() => navigate("/upload")}
                  className="bg-gradient-primary hover:opacity-90 transition-all shadow-lg text-base px-8 py-6 rounded-xl font-semibold"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload New PDF
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 text-base px-8 py-6 rounded-xl font-semibold"
                  onClick={() => pdfs[0] && navigate(`/output/${pdfs[0].id}`)}
                  disabled={pdfs.length === 0}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  View Latest
                </Button>
              </CardContent>
            </Card>

            {/* Your PDFs */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Your PDFs</CardTitle>
                <CardDescription>Manage your uploaded documents</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading your PDFs...</p>
                  </div>
                ) : pdfs.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">No PDFs yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your first PDF to get started with AI-powered learning
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pdfs.map((pdf) => (
                      <div
                        key={pdf.id}
                        className="flex items-center justify-between p-4 border-2 rounded-xl hover:bg-muted/50 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="h-12 w-12 rounded-lg bg-gradient-primary/10 flex items-center justify-center group-hover:bg-gradient-primary/20 transition-all">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{pdf.file_name}</h3>
                            <div className="flex gap-3 text-sm text-muted-foreground">
                              <span>{formatFileSize(pdf.file_size)}</span>
                              <span>•</span>
                              <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => navigate(`/output/${pdf.id}`)}
                            className="bg-gradient-primary hover:opacity-90 transition-all font-semibold"
                          >
                            View Results
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deletePDF(pdf.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity & Stats */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analytics.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity
                  </p>
                ) : (
                  <div className="space-y-4">
                    {analytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Upload className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {activity.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Study Tips */}
            <Card className="border-2 bg-gradient-primary/5">
              <CardHeader>
                <CardTitle className="text-xl">💡 Study Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">
                  Use the generated flashcards for quick revision sessions. Studies show that spaced repetition improves retention by up to 200%!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;