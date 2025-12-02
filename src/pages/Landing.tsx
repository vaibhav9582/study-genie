import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileText, Zap, Book, CheckCircle, ArrowRight, Sparkles, Users, Award, Clock } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { motion } from "framer-motion";
import dashboardPreview from "@/assets/dashboard-preview.png";

const Landing = () => {
  const navigate = useNavigate();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 rounded-full blur-[150px]"></div>
      </div>
      
      <div className="relative z-10">
        <Navigation />

        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              className="max-w-5xl mx-auto text-center space-y-8"
              initial="initial"
              animate="animate"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI-Powered Learning Assistant</span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInUp}
                className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-[1.1] tracking-tight"
              >
                Transform Your{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    Study Notes
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="50%" stopColor="hsl(var(--secondary))" />
                        <stop offset="100%" stopColor="hsl(var(--accent))" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <br />into Success
              </motion.h1>
              
              <motion.p 
                variants={fadeInUp}
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                Upload your PDF notes and let AI generate comprehensive summaries, interactive quizzes, flashcards, and important questions—all in seconds.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all text-lg px-8 py-6 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 group"
                  onClick={() => navigate("/auth?mode=signup")}
                >
                  Start Learning Free 
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 rounded-full font-semibold border-2 hover:bg-muted/50"
                >
                  Watch Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Dashboard Preview */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-16 max-w-5xl mx-auto"
            >
              <div className="relative rounded-2xl overflow-hidden border-2 border-border/50 shadow-2xl bg-gradient-to-b from-muted/50 to-background">
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"></div>
                <img 
                  src={dashboardPreview} 
                  alt="StudyGenie Dashboard Preview" 
                  className="w-full h-auto"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-y border-border/50 bg-muted/20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
            >
              {[
                { icon: Users, value: "10K+", label: "Active Students" },
                { icon: FileText, value: "50K+", label: "PDFs Processed" },
                { icon: Award, value: "98%", label: "Success Rate" },
                { icon: Clock, value: "5hrs", label: "Avg. Time Saved" }
              ].map((stat, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4">
                Supercharge Your Learning
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything you need to ace your exams, powered by advanced AI
              </p>
            </motion.div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {[
                {
                  icon: <FileText className="h-7 w-7" />,
                  title: "Smart Summaries",
                  description: "Get concise and detailed summaries with key bullet points",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: <CheckCircle className="h-7 w-7" />,
                  title: "Auto Quizzes",
                  description: "MCQs, True/False, and short questions generated instantly",
                  color: "from-green-500 to-emerald-500"
                },
                {
                  icon: <Book className="h-7 w-7" />,
                  title: "Flashcards",
                  description: "Key terms and definitions for quick revision",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: <Zap className="h-7 w-7" />,
                  title: "Exam Questions",
                  description: "Important questions for 5, 10, and 15 mark answers",
                  color: "from-orange-500 to-amber-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full bg-card/50 backdrop-blur-sm border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group">
                    <CardHeader className="space-y-4">
                      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">{feature.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">Process</span>
              <h2 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to study smarter
              </p>
            </motion.div>
            
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connection line */}
                <div className="hidden md:block absolute top-16 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-primary via-secondary to-accent"></div>
                
                {[
                  { step: "01", title: "Upload Your PDF", description: "Drag and drop your study notes or lecture materials" },
                  { step: "02", title: "AI Processes", description: "Our AI analyzes and extracts key information" },
                  { step: "03", title: "Get Materials", description: "Receive summaries, quizzes, and flashcards instantly" }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="relative"
                  >
                    <Card className="text-center border-2 hover:border-primary/50 transition-all bg-card/80 backdrop-blur-sm hover:shadow-xl">
                      <CardHeader className="pt-8 pb-6">
                        <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4 shadow-lg relative z-10">
                          {item.step}
                        </div>
                        <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                        <CardDescription className="text-base">{item.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-primary-foreground border-0 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <CardContent className="text-center py-16 md:py-20 px-4 relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
                      Ready to Study Smarter?
                    </h2>
                    <p className="text-lg md:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                      Join thousands of students who are already using AI to improve their grades
                    </p>
                    <Button 
                      size="lg" 
                      className="bg-background text-primary hover:bg-background/90 text-lg px-10 py-6 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105"
                      onClick={() => navigate("/auth?mode=signup")}
                    >
                      Get Started for Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold text-lg">StudyGenie</span>
              </div>
              <p className="text-muted-foreground text-sm">© 2025 StudyGenie. Powered by AI.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
