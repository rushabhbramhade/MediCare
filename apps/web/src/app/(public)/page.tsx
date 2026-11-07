"use client";

import {
  Ambulance,
  ArrowRight,
  Brain,
  Check,
  Compass,
  Folder,
  Heart,
  Hospital,
  Layout,
  Lock,
  LockOpen,
  Pill,
  Play,
  Phone,
  Shield,
  Star,
  Stethoscope,
  X,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactElement } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ServiceCardProps = {
  icon: ReactElement;
  iconBg: string;
  tag: string;
  tagClass: string;
  title: string;
  desc: string;
  link: string;
  linkColor: string;
  extra?: ReactElement;
  onClick?: () => void;
};

function ServiceCard({
  icon,
  iconBg,
  tag,
  tagClass,
  title,
  desc,
  link,
  linkColor,
  extra,
  onClick,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        "group bg-white rounded-3xl p-7 border border-slate-200/90 shadow-[0_10px_30px_-4px_rgba(4,27,60,0.05)] hover:shadow-[0_18px_36px_-6px_rgba(8,126,139,0.12)] hover:-translate-y-1 transition-all flex flex-col justify-between",
        onClick ? "cursor-pointer" : "",
      )}
      onClick={onClick}
    >
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center group-hover:bg-[#00636e] group-hover:text-white transition-colors`}>
            {icon}
          </div>
          <span className={cn("px-3 py-1 rounded-full text-[11px] font-semibold", tagClass)}>
            {tag}
          </span>
        </div>
        <h3 className={`text-lg font-bold text-[#041b3c] group-hover:text-[#00636e] transition-colors`}>
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-brand-muted mt-2 leading-relaxed">{desc}</p>
      </div>
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
        {onClick ? (
          <button
            className="text-xs font-bold text-[#00636e] hover:text-cyan-700 inline-flex items-center gap-1"
            onClick={onClick}
          >
            <span>{link}</span>
            <LockOpen className="h-3 w-3" />
          </button>
        ) : (
          <a
            href="#"
            className="text-xs font-bold text-[#00636e] group-hover:text-cyan-700 inline-flex items-center gap-1"
          >
            <span>{link}</span>
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </a>
        )}
        {extra}
      </div>
      <style jsx>{`
        .shadow-[0_8px_32px_0_rgba(10,48,77,0.15)] { box-shadow: 0 8px 32px 0 rgba(10, 48, 77, 0.15); }
        .shadow-[0_10px_30px_-4px_rgba(4,27,60,0.05)] { box-shadow: 0 10px 30px -4px rgba(4, 27, 60, 0.05); }
        .shadow-hover-elevated { box-shadow: 0 18px 36px -6px rgba(8, 126, 139, 0.12); }
      `}</style>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9fbfe] text-[#041b3c] font-sans antialiased">
      {/* Floating Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 px-5 sm:px-8 lg:px-10 pt-5 pb-4 flex items-center justify-between">
        <Link
          href="#"
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/95 p-1.5 shadow-sm flex items-center justify-center transition-transform group-hover:scale-105">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={36}
              height={36}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-bold tracking-tight font-heading text-[#041b3c]">
              Medicare
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse hidden sm:inline-block" />
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 lg:gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium">
          <a href="#" className="px-3 py-1.5 rounded-full bg-white/30 text-[#041b3c] font-semibold flex items-center gap-1 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" aria-hidden="true" /> Home
          </a>
          <Link href="#about-section" className="px-3 py-1.5 rounded-full text-[#041b3c] hover:text-[#00636e] hover:bg-white/20 transition-colors">
            About
          </Link>
          <Link href="#services-section" className="px-3 py-1.5 rounded-full text-[#041b3c] hover:text-[#00636e] hover:bg-white/20 transition-colors">
            Services
          </Link>
          <Link
            href="#emergency-section"
            className="px-3 py-1.5 rounded-full flex items-center gap-1 text-[#DC2626] hover:text-[#B91C1C] hover:bg-rose-50 transition-colors"
          >
            <Phone className="h-3 w-3" aria-hidden="true" /> Emergency
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="hidden sm:inline-flex text-xs font-semibold text-[#041b3c] hover:text-[#00636e] px-3 py-2"
            onClick={() => router.push("/login")}
          >
            Sign In
          </button>
          <button
            className="group inline-flex items-center gap-2 pl-4 pr-1.5 py-1.5 rounded-full bg-white text-[#15557a] hover:bg-cyan-50 font-semibold text-xs transition-all shadow-md hover:shadow-lg"
            onClick={() => router.push("/register")}
          >
            <span>Create Account</span>
            <span className="w-6 h-6 rounded-full bg-[#1b6f9a] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </button>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 rounded-lg text-white hover:text-white hover:bg-white/10"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Stethoscope className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Mobile menu panel */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 mt-2 px-4 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl z-50 flex flex-col gap-2">
            <a href="#" className="px-4 py-2 rounded-xl bg-white/20 text-[#041b3c] font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" aria-hidden="true" /> Home
            </a>
            <Link href="#about-section" className="px-4 py-2 rounded-xl text-[#041b3c] hover:text-[#00636e] hover:bg-white/20 transition-colors">
              About
            </Link>
            <Link href="#services-section" className="px-4 py-2 rounded-xl text-[#041b3c] hover:text-[#00636e] hover:bg-white/20 transition-colors">
              Services
            </Link>
            <Link
              href="#emergency-section"
              className="px-4 py-2 rounded-xl flex items-center gap-2 text-[#DC2626] hover:text-[#B91C1C] hover:bg-rose-50 transition-colors"
            >
              <Phone className="h-4 w-4" aria-hidden="true" /> Emergency
            </Link>
            <div className="mt-4 pt-4 border-t border-white/20 flex flex-col gap-2">
              <button
                className="px-4 py-2 rounded-xl text-left text-xs font-semibold text-[#041b3c] hover:text-[#00636e]"
                onClick={() => router.push("/login")}
              >
                Sign In
              </button>
              <button
                className="px-4 py-2 rounded-xl text-left text-xs font-bold text-[#15557a] bg-white hover:bg-cyan-50 transition-colors"
                onClick={() => router.push("/register")}
              >
                Create Account
              </button>
            </div>
          </div>
        )}
      </header>


      {/* Hero Banner */}
      <section className="relative z-20 px-5 sm:px-8 lg:px-10 pt-24 sm:pt-32 lg:pt-48 pb-12 overflow-hidden">
        <div className="relative rounded-[2.2rem] overflow-hidden text-white shadow-2xl" style={{ background: "linear-gradient(135deg, #4489b8 0%, #2f7ca8 30%, #216d99 60%, #15557a 100%)" }}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 right-1/4 w-[500px] h-[500px] bg-sky-300/30 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-10 w-[600px] h-[550px] bg-teal-400/20 rounded-full blur-[110px]" />
            <div className="absolute top-1/3 -left-20 w-[450px] h-[450px] bg-white/10 rounded-full blur-[90px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#1c648d] via-[#216d99]/90 to-transparent lg:w-[68%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#15557a]/90 via-transparent to-transparent" />
          </div>
          <div className="relative z-20 px-5 sm:px-8 lg:px-10 pt-6 pb-12 sm:pb-16 lg:pb-14">
            {/* Social proof tag */}
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-medium text-white mb-6">
              <div className="flex -space-x-1.5 items-center">
                {[1, 2, 3, 4].map((i) => (
                  <img
                    key={i}
                    alt="User"
                    className="w-5 h-5 rounded-full border border-white/80 object-cover"
                    src={`https://i.pravatar.cc/150?img=${i + 10}`}
                  />
                ))}
              </div>
              <span className="text-xs text-white/90">
                Trusted by <strong className="font-bold text-white">135k+</strong> people
              </span>
            </div>

            {/* Hero Heading */}
            <div className="max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-[50px] font-extrabold tracking-tight leading-[1.12] text-white font-heading">
                Your Trusted <br className="hidden sm:block" /> Partner in Modern <br className="hidden sm:block" /> Healthcare
              </h1>
              <div className="mt-6 flex items-center gap-4">
                <Link
                  href="#services-section"
                  className="group inline-flex items-center gap-3 pl-5 pr-2 py-2 rounded-full bg-white text-[#15557a] hover:bg-cyan-50 font-semibold text-xs tracking-wide transition-all shadow-md"
                >
                  <span>Explore Services</span>
                  <span className="w-6 h-6 rounded-full bg-[#1b6f9a] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </span>
                </Link>
                <button
                  className="text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-colors"
                  onClick={() => router.push("/register")}
                >
                  <Play className="h-4 w-4 text-cyan-300" aria-hidden="true" /> Watch Platform Tour
                </button>
              </div>
            </div>

            {/* Lower Half: Dual Columns */}
            <div className="mt-14 sm:mt-16 pt-6 border-t border-white/15 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-6 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-200 font-heading">Comprehensive Care</div>
                <p className="text-xs sm:text-sm text-white/80 max-w-md leading-relaxed">
                  Accessible, modern medical care — where technology meets compassion. Book appointments, view reports, and stay
                  healthy from anywhere.
                </p>
              </div>
              <div className="lg:col-span-6 flex flex-col sm:flex-row gap-3.5 lg:justify-end">
                <div className="rounded-2xl p-4 sm:p-5 flex-1 max-w-xs shadow-[0_8px_32px_0_rgba(10,48,77,0.15)]" style={{
                  background: "rgba(255, 255, 255, 0.18)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.35)",
                }}>
                  <div className="text-[11px] font-medium text-white/75">Trusted Care Rate</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 tracking-tight">97%</div>
                  <p className="text-[11px] text-white/75 mt-2 leading-relaxed">
                    Our patients trust us and are consistently satisfied with our treatment &amp; support.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 flex-1 max-w-xs shadow-[0_8px_32px_0_rgba(10,48,77,0.15)] flex flex-col justify-between" style={{
                  background: "rgba(255, 255, 255, 0.22)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                }}>
                  <div className="text-[11px] font-medium text-white/75 mb-3 flex items-center justify-between">
                    <span>Patient Experience</span>
                    <Heart className="h-3 w-3 text-cyan-200" aria-hidden="true" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50">✕</div>
                      <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-white/90">Caring</span>
                    </div>
                    <div className="flex items-center justify-center">
                      <span className="w-full text-center px-4 py-1.5 rounded-full bg-white text-[#15557a] text-xs font-bold shadow-sm">Personalized</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50">✕</div>
                      <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold text-white/90">Reliable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Slider indicator */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <div className="w-10 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="w-1/2 h-full bg-white rounded-full" />
            </div>
            <div className="w-24 h-1.5 rounded-full bg-white" />
            <div className="w-10 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative" id="about-section">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#00636e] uppercase">
              <span className="text-cyan-500 font-extrabold text-sm">+</span> ABOUT US
            </div>
            <div className="relative w-full rounded-3xl bg-gradient-to-tr from-sky-50 via-teal-50/60 to-white border border-slate-200/80 p-6 shadow-[0_10px_30px_-4px_rgba(4,27,60,0.05)] flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#00636e] text-xs font-semibold shadow-sm border border-cyan-100">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                  <span>Clinical Excellence &amp; Trust</span>
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Highlights</span>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm flex items-start gap-3 transition-all hover:border-cyan-200">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-[#00636e] flex items-center justify-center shrink-0">
                    <Check className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#041b3c]">100% ABDM Compliant</div>
                    <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">Government-certified digital health locker &amp; encrypted health ID</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm flex items-start gap-3 transition-all hover:border-cyan-200">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 text-[#00636e] flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#041b3c]">4.8/5 Patient Trust Score</div>
                    <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">Rated by over 135,000+ patients across 40+ medical specialties</p>
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm flex items-start gap-3 transition-all hover:border-cyan-200">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#041b3c]">&lt; 3 Min Emergency Triage</div>
                    <p className="text-[11px] text-brand-muted mt-0.5 leading-relaxed">Real-time hospital ICU bed coordination &amp; ambulance dispatch</p>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                  Verified Healthcare Network
                </span>
                <span className="text-[#00636e] font-semibold">National Accreditation</span>
              </div>
            </div>
            <div className="pt-2">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#041b3c] tracking-tight">50+</div>
              <p className="text-xs sm:text-sm text-brand-muted mt-1 max-w-xs font-medium leading-relaxed">
                Healthcare Professionals &amp; Specialists Supporting Lives Worldwide
              </p>
            </div>
          </div>
          <div className="lg:col-span-7 space-y-10 lg:pl-6">
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl lg:text-[28px] font-bold text-[#041b3c] leading-[1.38] font-heading">
                Medicare Clinic connects doctors and patients effortlessly, providing smarter, safer, and compassionate healthcare
                from diagnosis to full recovery.
              </h2>
              <p className="text-sm text-brand-muted leading-relaxed max-w-2xl">
                Whether you need an immediate consultation, ambulance support, or unified digital records, Medicare bridges the gap
                between state-of-the-art medicine and everyday patient peace of mind.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="bg-gradient-to-b from-sky-50/70 to-white rounded-3xl p-6 border border-sky-100 shadow-[0_10px_30px_-4px_rgba(4,27,60,0.05)] hover:shadow-[0_18px_36px_-6px_rgba(8,126,139,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-100/80 text-[#00636e] flex items-center justify-center shadow-sm">
                      <Star className="h-4 w-4" aria-hidden="true" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-[11px] font-semibold text-[#00636e] border border-cyan-100 shadow-sm">
                      Connected Care
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#041b3c]">Smart Care</h3>
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                    Smart digital health tracking ensures accurate insights, intelligent prescription logs, and better patient outcomes.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#00636e] hover:text-cyan-700 cursor-pointer">
                  <span>Learn about AI triage</span>
                  <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                </div>
              </div>
              <div className="bg-gradient-to-b from-sky-50/70 to-white rounded-3xl p-6 border border-sky-100 shadow-[0_10px_30px_-4px_rgba(4,27,60,0.05)] hover:shadow-[0_18px_36px_-6px_rgba(8,126,139,0.12)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-100/80 text-[#00636e] flex items-center justify-center shadow-sm">
                      <Shield className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white text-[11px] font-semibold text-[#00636e] border border-cyan-100 shadow-sm">
                      Data Privacy
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#041b3c]">Secure Data</h3>
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                    Protecting patient data through secure, ABDM / ABHA compliant digital health vaults with 256-bit encryption.
                  </p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center text-xs font-bold text-[#00636e] hover:text-cyan-700 cursor-pointer">
                  <span>ABHA Security Specs</span>
                  <ArrowRight className="h-3 w-3 ml-1" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Banner */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 my-8" id="emergency-section">
        <div className="rounded-3xl bg-gradient-to-r from-rose-50 via-white to-red-50/60 border border-rose-200/80 p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
              <Phone className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">Need Immediate Emergency Assistance?</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold uppercase tracking-wider">
                  24/7 Helpline
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Direct dispatch for ambulance triage, trauma casualty units, and hospital ICU availability. No login required.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full md:w-auto">
            <a
              href="tel:112"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm hover:shadow transition-all"
            >
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Call Emergency: 112 / 108</span>
            </a>
            <Link
              href="#services-section"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold border border-slate-300 shadow-sm transition-all"
            >
              <Ambulance className="h-4 w-4 text-rose-600" aria-hidden="true" />
              <span>Dispatch Ambulance</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Service Discovery Grid */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-24" id="services-section">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#00636e] uppercase mb-2">
            <span className="text-cyan-500 font-extrabold text-sm">+</span> HEALTHCARE CATALOG
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#041b3c] tracking-tight font-heading">
            Explore Our Services
          </h2>
          <p className="text-sm text-brand-muted mt-2">
            Browse verified medical resources freely as a guest or sign in for synchronized personal care.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ServiceCard
            icon={<Hospital className="h-6 w-6" />}
            iconBg="bg-cyan-50 text-[#00636e]"
            tag="850+ Centers"
            tagClass="bg-slate-100 text-[11px] font-semibold text-slate-700"
            title="Find Hospitals"
            desc="Discover certified multi-specialty hospitals, emergency trauma units, and ICU bed availability near your coordinates."
            link="Browse Facilities"
            linkColor="text-[#00636e] group-hover:text-cyan-700"
          />
          <ServiceCard
            icon={<Stethoscope className="h-6 w-6" />}
            iconBg="bg-cyan-50 text-[#00636e]"
            tag="40+ Specialties"
            tagClass="bg-cyan-50 text-[11px] font-semibold text-[#00636e]"
            title="Find Doctors"
            desc="Search qualified practitioners by specialty, patient rating, language, and choose in-clinic or video consultation."
            link="Find Specialists"
            linkColor="text-[#00636e] group-hover:text-cyan-700"
          />
          <ServiceCard
            icon={<Ambulance className="h-6 w-6" />}
            iconBg="bg-rose-50 text-rose-600"
            tag="24/7 Live"
            tagClass="bg-rose-50 text-[11px] font-semibold text-rose-600"
            title="Ambulance Assistance"
            desc="Locate certified BLS/ALS ambulances with real-time GPS tracking and dispatch coordination within minutes."
            link="View Ambulances"
            linkColor="text-rose-600 group-hover:text-rose-700"
          />
          <ServiceCard
            icon={<Brain className="h-6 w-6" />}
            iconBg="bg-cyan-50 text-[#00636e]"
            tag="AI Triage"
            tagClass="bg-gradient-to-r from-cyan-50 to-teal-50 text-[11px] font-bold text-[#00636e] border border-cyan-100"
            title="iCare AI Assistant"
            desc="Describe your symptoms in natural language for preliminary guidance, medicine cautions, and clinical recommendations."
            link="Start iCare Chat"
            linkColor="text-[#00636e] group-hover:text-cyan-700"
            extra={<span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Online</span>}
          />
          <ServiceCard
            icon={<Folder className="h-6 w-6" />}
            iconBg="bg-slate-100 text-slate-700"
            tag="🔒 Login Required"
            tagClass="bg-slate-100 text-[11px] font-semibold text-slate-600 flex items-center gap-1"
            title="Medical Records Vault"
            desc="Secure digital repository for diagnostic lab reports, prescriptions, and ABHA linked longitudinal medical histories."
            link="Unlock Records"
            linkColor="text-[#00636e] hover:text-cyan-700"
            onClick={() => router.push("/login")}
            extra={<span className="text-[11px] text-slate-400 font-medium">256-bit Encrypted</span>}
          />
          <ServiceCard
            icon={<Pill className="h-6 w-6" />}
            iconBg="bg-cyan-50 text-[#00636e]"
            tag="Jan Aushadhi"
            tagClass="bg-teal-50 text-[11px] font-semibold text-[#00636e]"
            title="Medicines &amp; Pharmacies"
            desc="Verify generic salt equivalents, view standard price benchmarks, and locate nearby registered pharmacies."
            link="Search Pharmacy Catalog"
            linkColor="text-[#00636e] group-hover:text-cyan-700"
          />
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10 mb-8">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-[#00636e] uppercase mb-2">
          <span className="text-cyan-500 font-extrabold text-sm">+</span> WHY CHOOSE US
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#041b3c] font-heading tracking-tight mb-8">
          A Simplified Path to Health &amp; Recovery
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#00636e] flex items-center justify-center mb-4">
              <Layout className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#041b3c]">Unified Platform</h3>
            <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
              Consolidating hospitals, doctors, ambulances, and records under one seamless patient login.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#00636e] flex items-center justify-center mb-4">
              <Compass className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#041b3c]">Effortless Discovery</h3>
            <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
              Accurate geolocation tools to find open clinics and pharmacies within a 5km radius immediately.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#00636e] flex items-center justify-center mb-4">
              <Brain className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#041b3c]">AI-Guided Triage</h3>
            <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
              Understand confusing medical jargon and clinical symptoms with our validated iCare model.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#00636e] flex items-center justify-center mb-4">
              <Lock className="h-4 w-4" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-bold text-[#041b3c]">ABHA Privacy First</h3>
            <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
              Strict regulatory compliance guaranteeing your diagnostic records are never sold or shared.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl" style={{ background: "linear-gradient(135deg, #1b6f9a 0%, #15557a 100%)" }}>
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-cyan-300/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-cyan-200 border border-white/20">
              Personalized Care
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight font-heading">
              Take Control of Your Healthcare Journey Today.
            </h2>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              Create your free Medicare account to safely connect with doctors, store reports in the encrypted vault, and access
              seamless teleconsultations.
            </p>
            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                className="group inline-flex items-center gap-2 pl-5 pr-2 py-2 rounded-full bg-white text-[#15557a] hover:bg-cyan-50 font-bold text-xs shadow-md transition-all"
                onClick={() => router.push("/register")}
              >
                <span>Create Free Account</span>
                <span className="w-6 h-6 rounded-full bg-[#1b6f9a] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </button>
              <button
                className="px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-semibold text-xs border border-white/30 backdrop-blur-sm transition-all"
                onClick={() => router.push("/login")}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200 pt-12 pb-8 text-xs text-slate-500">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-200">
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-50 p-1 flex items-center justify-center border border-slate-200">
                  <Image
                    src="/icons/icon-192.png"
                    alt=""
                    width={32}
                    height={32}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-lg font-bold text-[#041b3c] font-heading">Medicare</span>
              </div>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
                India&apos;s unified patient-first healthcare access portal connecting citizens with hospitals, doctors, and round-the-clock
                emergency support.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>All Services Operational</span>
                <span className="text-slate-400">•</span>
                <span>24/7 Helpline: 112 / 108</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[#041b3c] mb-3 text-[11px]">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#services-section" className="hover:text-primary transition-colors">Find Hospitals</a></li>
                <li><a href="#services-section" className="hover:text-primary transition-colors">Find Doctors</a></li>
                <li><a href="#emergency-section" className="hover:text-primary transition-colors">Ambulance Services</a></li>
                <li><a href="#icare-ai" className="hover:text-primary transition-colors">iCare AI Assistant</a></li>
                <li><a href="#services-section" className="hover:text-primary transition-colors">Generic Medicines</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[#041b3c] mb-3 text-[11px]">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about-section" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Medical Board</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">ABDM Integration</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help &amp; Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Grievance Officer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-[#041b3c] mb-3 text-[11px]">Trust &amp; Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">ABHA Data Security</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Patient Charter</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
            <p>© 2025 Medicare Healthcare Platform. All rights reserved.</p>
            <p className="text-center sm:text-right max-w-xl">
              <strong className="text-slate-600 font-semibold">Disclaimer:</strong> Information provided is for educational and navigation purposes. Call 112 in case of urgent medical emergencies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
