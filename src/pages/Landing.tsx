import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Zap, Book, CheckCircle } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5 blur-3xl"></div>
        <div className="max-w-5xl mx-auto space-y-10 relative z-10">
          <div className="inline-block animate-fade-in">
            <span className="px-5 py-2.5 bg-gradient-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20 shadow-sm">
              ✨ AI-Powered Learning Assistant
            </span>
          </div>
          <h1 className="text-6xl md:text-8xl font-extrabold leading-tight animate-fade-in-up tracking-tight">
            Transform Your{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Study Notes
            </span>{" "}
            into Success
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up animation-delay-200 leading-relaxed">
            Upload your PDF notes and let AI generate comprehensive summaries, interactive quizzes, flashcards, and important questions—all in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400 pt-4">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow text-lg px-10 py-7 rounded-xl font-semibold"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Start Learning Free →
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-10 py-7 rounded-xl font-semibold border-2 hover:bg-muted/50"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">Supercharge Your Learning</h2>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to ace your exams, powered by AI
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {[
            {
              icon: <FileText className="h-10 w-10" />,
              title: "Smart Summaries",
              description: "Get short and detailed summaries with key bullet points and proper headings"
            },
            {
              icon: <CheckCircle className="h-10 w-10" />,
              title: "Auto Quizzes",
              description: "MCQs, True/False, and short questions generated instantly for practice"
            },
            {
              icon: <Book className="h-10 w-10" />,
              title: "Flashcards",
              description: "Key terms and definitions for quick revision and better retention"
            },
            {
              icon: <Zap className="h-10 w-10" />,
              title: "Exam Questions",
              description: "Important questions for 5, 10, and 15 mark answers to prepare for exams"
            }
          ].map((feature, index) => (
            <Card key={index} className="bg-gradient-card border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
              <CardHeader>
                <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground mb-4 group-hover:scale-110 transition-transform shadow-md">
                  {feature.icon}
                </div>
                <CardTitle className="text-2xl mb-3">{feature.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-24 bg-muted/30">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-extrabold mb-6 tracking-tight">How It Works</h2>
          <p className="text-xl md:text-2xl text-muted-foreground">
            Three simple steps to study smarter
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">
          {[
            { step: "1", title: "Upload Your PDF", description: "Drag and drop your study notes or lecture materials" },
            { step: "2", title: "AI Processes", description: "Our AI analyzes and extracts key information from your content" },
            { step: "3", title: "Get Study Materials", description: "Receive summaries, quizzes, flashcards, and questions instantly" }
          ].map((item, i) => (
            <Card key={i} className="text-center relative overflow-hidden group hover:shadow-xl transition-all duration-300 border-2">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="pt-10">
                <div className="mx-auto h-20 w-20 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-3xl font-bold mb-6 shadow-glow group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <CardTitle className="text-2xl mb-4">{item.title}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="bg-gradient-hero text-primary-foreground border-0 shadow-glow relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnptMCAzMGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjAzIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
          <CardContent className="text-center py-20 px-4 relative z-10">
            <h2 className="text-5xl md:text-6xl font-extrabold mb-8 tracking-tight">
              Ready to Study Smarter?
            </h2>
            <p className="text-xl md:text-2xl mb-10 opacity-95 max-w-3xl mx-auto leading-relaxed">
              Join thousands of students who are already using AI to improve their grades and save study time
            </p>
            <Button 
              size="lg" 
              className="bg-background text-primary hover:bg-background/90 text-lg px-12 py-7 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Get Started for Free →
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 StudyGenie. Powered by AI.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
