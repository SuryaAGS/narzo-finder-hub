import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Phone, Shield } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { PHONE_KEY, t } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [otp, setOtp] = useState("");

  const sendOtp = () => {
    if (phone.replace(/\D/g, "").length !== 10) return;
    setStep("otp");
  };

  const verify = () => {
    if (otp.length !== 6) return;
    localStorage.setItem(PHONE_KEY, phone);
    navigate({ to: "/role" });
  };

  return (
    <div className="min-h-screen">
      <AppHeader back="/language" />
      <main className="mx-auto max-w-2xl px-5 py-8">
        {step === "phone" ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-warm shadow-warm">
              <Phone className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="mt-6 font-display text-3xl font-black text-balance">
              {t("phoneTitle")}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("phoneHelp")}</p>

            <div className="mt-8 rounded-3xl border-2 border-border bg-card p-2 focus-within:border-primary">
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="rounded-xl bg-muted px-3 py-2 font-bold">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder={t("phonePlaceholder")}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-transparent py-2 text-xl font-bold tracking-wider outline-none placeholder:font-normal placeholder:text-muted-foreground/70"
                />
              </div>
            </div>

            <button
              onClick={sendOtp}
              disabled={phone.length !== 10}
              className="mt-8 w-full rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm transition-transform active:scale-[0.98] disabled:opacity-40"
            >
              {t("sendOtp")} →
            </button>

            <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Your number stays private. Connect Lovable Cloud to enable real OTP.
            </p>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="font-display text-3xl font-black">{t("otpTitle")}</h2>
            <p className="mt-1 text-muted-foreground">+91 {phone}</p>

            <div className="mt-8 rounded-3xl border-2 border-border bg-card p-3 focus-within:border-primary">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={6}
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-transparent px-3 py-3 text-center font-display text-3xl font-black tracking-[0.6em] outline-none"
              />
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Demo mode: enter any 6 digits to continue.
            </p>

            <button
              onClick={verify}
              disabled={otp.length !== 6}
              className="mt-8 w-full rounded-2xl bg-gradient-warm px-6 py-4 text-lg font-bold text-primary-foreground shadow-warm active:scale-[0.98] disabled:opacity-40"
            >
              {t("verify")} →
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
