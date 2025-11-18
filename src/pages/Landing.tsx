import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Brain, Zap, Book, CheckCircle } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              StudyGenie
            </h1>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Login
            </Button>
            <Button 
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-block animate-fade-in">
            <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              AI-Powered Learning Assistant
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-tight animate-fade-in-up">
            Transform Your{" "}
            <span className="bg-gradient-hero bg-clip-text text-transparent">
              Study Notes
            </span>{" "}
            into Success
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Upload your PDF notes and let AI generate summaries, quizzes, flashcards, and important questions—all in seconds.
          </p>
          <div className="flex gap-4 justify-center animate-fade-in-up animation-delay-400">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 transition-all shadow-glow text-lg px-8"
              onClick={() => navigate("/auth?mode=signup")}
            >
              Start Learning Free
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Supercharge Your Learning</h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to ace your exams
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {[
            {
              icon: <FileText className="h-8 w-8" />,
              title: "Smart Summaries",
              description: "Get short and long summaries with key bullet points"
            },
            {
              icon: <Brain className="h-8 w-8" />,
              title: "Auto Quizzes",
              description: "MCQs, True/False, and short questions generated instantly"
            },
            {
              icon: <Book className="h-8 w-8" />,
              title: "Flashcards",
              description: "Key terms and definitions for quick revision"
            },
            {
              icon: <Zap className="h-8 w-8" />,
              title: "Exam Questions",
              description: "Important questions for 5, 10, and 15 mark answers"
            }
          ].map((feature, i) => (
            <Card 
              key={i} 
              className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-gradient-card border-border/50"
            >
              <div className="h-16 w-16 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground mb-4 shadow-md">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            Three simple steps to smarter studying
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {[
            { step: "1", title: "Upload PDF", description: "Drag and drop your study notes" },
            { step: "2", title: "AI Analyzes", description: "Our AI extracts and processes content" },
            { step: "3", title: "Get Results", description: "Download summaries, quizzes & more" }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-glow">
                {item.step}
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-hero text-primary-foreground p-12 text-center max-w-4xl mx-auto shadow-glow">
          <h2 className="text-4xl font-bold mb-4">Ready to Study Smarter?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students who are already acing their exams
          </p>
          <div className="flex gap-4 justify-center items-center flex-wrap">
            <CheckCircle className="h-5 w-5" />
            <span>Free to start</span>
            <span className="opacity-50">•</span>
            <CheckCircle className="h-5 w-5" />
            <span>No credit card required</span>
            <span className="opacity-50">•</span>
            <CheckCircle className="h-5 w-5" />
            <span>Instant results</span>
          </div>
          <Button 
            size="lg" 
            variant="secondary"
            className="mt-8 text-lg px-8"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Start Free Now
          </Button>
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